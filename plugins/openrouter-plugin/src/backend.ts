import OpenAI from "openai";
import * as z from "zod/v4";
import type { Backend, TokenCallback } from "../../../lib/backend";
import type { Prompt } from "../../../lib/prompts";
import { getState } from "../../../lib/state";
import type { OpenRouterConfigType } from "./types";
import { createOpenRouterClient } from "./utils";

export class OpenRouterBackend implements Backend {
  private config: OpenRouterConfigType;
  private controller = new AbortController();
  private client: OpenAI | null = null;

  constructor(config: OpenRouterConfigType) {
    this.config = config;
    // Don't create client in constructor - wait for proper config in updateConfig
  }

  public updateConfig(newConfig: Partial<OpenRouterConfigType>) {
    this.config = { ...this.config, ...newConfig };
    this.client = createOpenRouterClient(this.config);
  }

  /**
   * Custom serialization method for Zustand's persist middleware.
   *
   * The main app uses Zustand with persist middleware to save state to localStorage,
   * which includes the backends object containing this class instance. The OpenAI
   * client has circular references that would cause JSON.stringify() to throw:
   * "TypeError: Converting circular structure to JSON"
   *
   * This toJSON() method is automatically called during serialization and returns
   * only the safe, serializable parts of the backend state. The OpenAI client
   * gets recreated when the plugin reinitializes on app startup.
   */
  public toJSON() {
    return {
      type: "OpenRouterBackend",
      config: {
        baseUrl: this.config.baseUrl,
        selectedModel: this.config.selectedModel,
        // Don't serialize the API key for security reasons
        hasApiKey: !!this.config.apiKey,
      },
    };
  }

  abort(): void {
    this.controller.abort();
  }

  isAbortError(error: unknown): boolean {
    return error instanceof OpenAI.APIUserAbortError;
  }

  async *getResponseStream(prompt: Prompt, params: Record<string, unknown> = {}): AsyncGenerator<string> {
    if (!this.client) {
      throw new Error("OpenRouter client not initialized. Please check your configuration.");
    }

    if (!this.config.selectedModel) {
      throw new Error("OpenRouter model not selected.");
    }

    try {
      const stream = await this.client.chat.completions.create(
        {
          stream: true,
          model: this.config.selectedModel,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          max_tokens: 4096, // Legacy parameter for older models
          max_completion_tokens: 4096, // Newer parameter for token limits
          ...params,
        },
        { signal: this.controller.signal },
      );

      for await (const chunk of stream) {
        if (chunk.choices.length === 0) {
          // No choices in this chunk, end stream
          return;
        }

        const choice = chunk.choices[0];

        if (choice.delta.content) {
          yield choice.delta.content;
        }

        if (choice.finish_reason) {
          // Model finished generating (stop, length, etc.)
          return;
        }
      }

      if (stream.controller.signal.aborted) {
        // Stream was cancelled by user
        throw new OpenAI.APIUserAbortError();
      }
    } finally {
      // Reset abort controller for next request
      this.controller = new AbortController();
    }
  }

  async getResponse(prompt: Prompt, params: Record<string, unknown> = {}, onToken?: TokenCallback): Promise<string> {
    let response = "";
    let count = 0;

    if (onToken) {
      // Initialize token callback with empty string and zero count
      onToken("", 0);
    }

    for await (const token of this.getResponseStream(prompt, params)) {
      response += token;
      count++;

      if (onToken) {
        onToken(token, count);
      }
    }

    return response;
  }

  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    return this.getResponse(prompt, getState().narrationParams, onToken);
  }

  async listModels(): Promise<Array<{ id: string; name: string }>> {
    if (!this.client) {
      throw new Error("OpenRouter client not initialized. Please check your configuration.");
    }

    try {
      const response = await this.client.models.list();
      return response.data.map((model) => ({
        id: model.id,
        name: model.id,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type> {
    const response = await this.getResponse(
      prompt,
      {
        ...getState().generationParams,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "schema",
            strict: true, // Enforce strict JSON schema compliance
            schema: z.toJSONSchema(schema),
          },
        },
      },
      onToken,
    );

    return schema.parse(JSON.parse(response)) as Type;
  }
}
