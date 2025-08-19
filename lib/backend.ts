// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { current, isDraft } from "immer";
import OpenAI from "openai";
import * as z from "zod/v4";
import type { Prompt } from "./prompts";
import { getState } from "./state";

export type TokenCallback = (token: string, count: number) => void;

export interface Backend {
  getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string>;

  getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type>;

  getContextLength(): Promise<number>;

  abort(): void;

  isAbortError(error: unknown): boolean;
}

export interface DefaultBackendSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
  generationParams: Record<string, unknown>;
  narrationParams: Record<string, unknown>;
}

export class DefaultBackend implements Backend {
  controller = new AbortController();

  // Can be overridden by subclasses to provide custom settings.
  getSettings(): DefaultBackendSettings {
    return getState();
  }

  // Can be overridden by subclasses to customize the client.
  getClient(): OpenAI {
    const settings = this.getSettings();

    return new OpenAI({
      baseURL: settings.apiUrl,
      apiKey: settings.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async *getResponseStream(prompt: Prompt, params: Record<string, unknown> = {}): AsyncGenerator<string> {
    try {
      const stream = await this.getClient().chat.completions.create(
        {
          stream: true,
          model: this.getSettings().model,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          // These are hardcoded because the required number depends on
          // what is being prompted for, which is also hardcoded.
          max_tokens: 4096,
          // Both variants need to be provided, as newer OpenAI models
          // don't support max_tokens, while some inference engines don't
          // support max_completion_tokens.
          max_completion_tokens: 4096,
          ...params,
        },
        { signal: this.controller.signal },
      );

      for await (const chunk of stream) {
        if (chunk.choices.length === 0) {
          // We must return directly here instead of just breaking the loop,
          // because the OpenAI library calls controller.abort() if streaming
          // is stopped, which would trigger the error-throwing code below.
          return;
        }

        const choice = chunk.choices[0];

        if (choice.delta.content) {
          yield choice.delta.content;
        }

        if (choice.finish_reason) {
          return;
        }
      }

      // The OpenAI library only throws this error if abort() is called
      // during the request itself, not if it is called while the
      // response is being streamed. We throw it manually in this case,
      // so error handling code can easily detect whether an error
      // is the result of a user abort.
      if (stream.controller.signal.aborted) {
        throw new OpenAI.APIUserAbortError();
      }
    } finally {
      // An AbortController cannot be reused after calling abort().
      // Reset the controller so a new one is available for the next operation
      // in case this operation was aborted.
      this.controller = new AbortController();
    }
  }

  async getResponse(prompt: Prompt, params: Record<string, unknown> = {}, onToken?: TokenCallback): Promise<string> {
    const state = getState();

    if (state.logPrompts) {
      console.log(prompt.user);
    }

    if (state.logParams) {
      console.log(isDraft(params) ? current(params) : params);
    }

    let response = "";
    let count = 0;

    // Send empty update at the start of the streaming process
    // to facilitate displaying progress indicators.
    if (onToken) {
      onToken("", 0);
    }

    for await (const token of this.getResponseStream(prompt, params)) {
      response += token;
      count++;

      if (onToken) {
        onToken(token, count);
      }
    }

    if (state.logResponses) {
      console.log(response);
    }

    return response;
  }

  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    return await this.getResponse(prompt, this.getSettings().narrationParams, onToken);
  }

  async getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type> {
    const response = await this.getResponse(
      prompt,
      {
        ...this.getSettings().generationParams,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "schema",
            strict: true,
            schema: z.toJSONSchema(schema),
          },
        },
      },
      onToken,
    );

    return schema.parse(JSON.parse(response)) as Type;
  }

  async getContextLength(): Promise<number> {
    // Some API providers do not provide a way to get the context length,
    // so we hardcode values for those.
    const settings = this.getSettings();
    if (settings.apiUrl.startsWith("https://api.deepseek.com")) {
      // All DeepSeek models from official API support at least this size.
      return 64000;
    } else if (settings.apiUrl.startsWith("https://api.anthropic.com/")) {
      // All Anthropic models support at least this size.
      return 200000;
    }

    const client = this.getClient();
    const modelName = settings.model;
    
    let models = await client.models.list();
    
    while (true) {
      const found = models.data.find((m) => m.id === modelName) as { context_length?: number; } | undefined;
      if (found) {
        if (typeof found.context_length !== "number") {
          throw new Error("Model does not have a valid context length");
        }
        return found.context_length;
      }
      
      // Try to get the next page
      if (models.hasNextPage()) {
        models = await models.getNextPage();
      } else {
        break;
      }
    }
    // If the model was not found, throw an error
    throw new Error("Model not found")
  }

  abort(): void {
    this.controller.abort();
  }

  isAbortError(error: unknown): boolean {
    return error instanceof OpenAI.APIUserAbortError;
  }
}

const defaultBackend = new DefaultBackend();

export function getBackend(): Backend {
  const state = getState();
  return Object.hasOwn(state.backends, state.activeBackend) ? state.backends[state.activeBackend] : defaultBackend;
}
