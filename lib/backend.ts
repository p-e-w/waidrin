// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { current, isDraft } from "immer";
import OpenAI from "openai";
import * as z from "zod/v4";
import type { Prompt } from "./prompts";
import { getState } from "./state";

/**
 * @typedef {function(string, number): void} TokenCallback
 * @description Callback function type for handling token updates during streaming responses.
 * @param {string} token - The current token received.
 * @param {number} count - The total number of tokens received so far.
 */
export type TokenCallback = (token: string, count: number) => void;

/**
 * @interface Backend
 * @description Defines the interface for a backend service that interacts with a language model.
 */
export interface Backend {
  /**
   * @method getNarration
   * @description Retrieves a narration from the language model based on the provided prompt.
   * @param {Prompt} prompt - The prompt for generating narration.
   * @param {TokenCallback} [onToken] - Optional callback for token updates during streaming.
   * @returns {Promise<string>} A promise that resolves to the generated narration string.
   */
  getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string>;

  /**
   * @method getObject
   * @description Retrieves a JSON object from the language model, validated against a Zod schema.
   * @template Schema - The Zod schema type.
   * @template Type - The inferred type from the Zod schema.
   * @param {Prompt} prompt - The prompt for generating the JSON object.
   * @param {Schema} schema - The Zod schema to validate the generated object against.
   * @param {TokenCallback} [onToken] - Optional callback for token updates during streaming.
   * @returns {Promise<Type>} A promise that resolves to the parsed and validated object.
   */
  getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type>;

  /**
   * @method abort
   * @description Aborts any ongoing requests to the backend.
   */
  abort(): void;

  /**
   * @method isAbortError
   * @description Checks if a given error is an abort error.
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if the error is an abort error, false otherwise.
   */
  isAbortError(error: unknown): boolean;
}

/**
 * @interface DefaultBackendSettings
 * @description Defines the settings structure for the default backend implementation.
 */
export interface DefaultBackendSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
  generationParams: Record<string, unknown>;
  narrationParams: Record<string, unknown>;
}

/**
 * @class DefaultBackend
 * @implements {Backend}
 * @description Implements the Backend interface using OpenAI's API.
 */
export class DefaultBackend implements Backend {
  /**
   * @property {AbortController} controller
   * @description Manages the abortion of ongoing API requests.
   */
  controller = new AbortController();

  /**
   * @method getSettings
   * @description Retrieves the backend settings from the global state.
   * Can be overridden by subclasses to provide custom settings.
   * @returns {DefaultBackendSettings} The current backend settings.
   */
  getSettings(): DefaultBackendSettings {
    return getState();
  }

  /**
   * @method getClient
   * @description Initializes and returns an OpenAI client instance.
   * Can be overridden by subclasses to customize the client.
   * @returns {OpenAI} An OpenAI client instance.
   */
  getClient(): OpenAI {
    const settings = this.getSettings();

    return new OpenAI({
      baseURL: settings.apiUrl,
      apiKey: settings.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * @method getResponseStream
   * @description Fetches a streaming response from the OpenAI chat completions API.
   * @param {Prompt} prompt - The prompt to send to the model.
   * @param {Record<string, unknown>} [params={}] - Additional parameters for the API request.
   * @returns {AsyncGenerator<string>} An async generator that yields content chunks as they are received.
   */
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

  /**
   * @method getResponse
   * @description Retrieves a complete response from the OpenAI API, handling streaming and logging.
   * @param {Prompt} prompt - The prompt to send to the model.
   * @param {Record<string, unknown>} [params={}] - Additional parameters for the API request.
   * @param {TokenCallback} [onToken] - Optional callback for token updates during streaming.
   * @returns {Promise<string>} A promise that resolves to the complete generated response string.
   */
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

  /**
   * @method getNarration
   * @description Retrieves a narration using the default narration parameters.
   * @param {Prompt} prompt - The prompt for narration.
   * @param {TokenCallback} [onToken] - Optional callback for token updates.
   * @returns {Promise<string>} A promise that resolves to the generated narration.
   */
  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    return await this.getResponse(prompt, this.getSettings().narrationParams, onToken);
  }

  /**
   * @method getObject
   * @description Retrieves a JSON object from the model, validated against a Zod schema.
   * @template Schema - The Zod schema type.
   * @template Type - The inferred type from the Zod schema.
   * @param {Prompt} prompt - The prompt for generating the object.
   * @param {Schema} schema - The Zod schema for validation.
   * @param {TokenCallback} [onToken] - Optional callback for token updates.
   * @returns {Promise<Type>} A promise that resolves to the parsed and validated object.
   */
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

  /**
   * @method abort
   * @description Aborts the current ongoing API request.
   */
  abort(): void {
    this.controller.abort();
  }

  /**
   * @method isAbortError
   * @description Checks if the given error is an instance of OpenAI.APIUserAbortError.
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if it's an abort error, false otherwise.
   */
  isAbortError(error: unknown): boolean {
    return error instanceof OpenAI.APIUserAbortError;
  }
}

/**
 * @constant defaultBackend
 * @description An instance of the DefaultBackend, used as the fallback backend.
 */
const defaultBackend = new DefaultBackend();

/**
 * @function getBackend
 * @description Retrieves the currently active backend from the global state, or the default backend if none is active.
 * @returns {Backend} The active or default backend instance.
 */
export function getBackend(): Backend {
  const state = getState();
  return Object.hasOwn(state.backends, state.activeBackend) ? state.backends[state.activeBackend] : defaultBackend;
}
