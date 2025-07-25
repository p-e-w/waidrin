import OpenAI from "openai";
import * as z from "zod/v4";
import type { Backend, TokenCallback } from "../../../lib/backend";
import type { Prompt } from "../../../lib/prompts";
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

  // Prevent serialization of the OpenAI client (which has circular references)
  public toJSON() {
    return {
      type: "OpenRouterBackend",
      config: {
        baseUrl: this.config.baseUrl,
        selectedModel: this.config.selectedModel,
        // Don't serialize the API key for security
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

  private async getResponse(prompt: Prompt, params: Record<string, unknown>, onToken?: TokenCallback): Promise<string> {
    if (!this.client) {
      throw new Error("OpenRouter client not initialized. Please check your configuration.");
    }

    if (!this.config.selectedModel) {
      throw new Error("OpenRouter model not selected.");
    }

    try {
      // Check if this is a JSON schema request
      const hasJsonSchema =
        params.response_format &&
        typeof params.response_format === "object" &&
        "type" in params.response_format &&
        params.response_format.type === "json_schema";

      if (hasJsonSchema) {
        // Try streaming first for JSON schema requests to show progress
        try {
          const stream = await this.client.chat.completions.create(
            {
              stream: true,
              model: this.config.selectedModel,
              messages: [
                { role: "system", content: prompt.system },
                { role: "user", content: prompt.user },
              ],
              max_tokens: 4096,
              ...params,
            },
            { signal: this.controller.signal },
          );

          let response = "";
          let count = 0;
          if (onToken) onToken("", 0);

          for await (const chunk of stream) {
            if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
            if (chunk.choices[0]?.delta?.content) {
              const token = chunk.choices[0].delta.content;
              response += token;
              count++;
              if (onToken) onToken(token, count);
            }
            if (chunk.choices[0]?.finish_reason) break;
          }

          if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
          return response;
        } catch (_streamError) {
          if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
          // Fallback to non-streaming if streaming fails
          if (onToken) {
            onToken("", 0);
            // Show some progress indication
            const progressInterval = setInterval(() => {
              if (this.controller.signal.aborted) {
                clearInterval(progressInterval);
                throw new OpenAI.APIUserAbortError();
              }
              if (onToken) onToken("", Math.floor(Math.random() * 10) + 1);
            }, 500);

            try {
              const response = await this.client.chat.completions.create(
                {
                  stream: false,
                  model: this.config.selectedModel,
                  messages: [
                    { role: "system", content: prompt.system },
                    { role: "user", content: prompt.user },
                  ],
                  max_tokens: 4096,
                  ...params,
                },
                { signal: this.controller.signal },
              );

              clearInterval(progressInterval);
              if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
              return response.choices[0]?.message?.content || "";
            } finally {
              clearInterval(progressInterval);
            }
          } else {
            const response = await this.client.chat.completions.create(
              {
                stream: false,
                model: this.config.selectedModel,
                messages: [
                  { role: "system", content: prompt.system },
                  { role: "user", content: prompt.user },
                ],
                max_tokens: 4096,
                ...params,
              },
              { signal: this.controller.signal },
            );

            if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
            return response.choices[0]?.message?.content || "";
          }
        }
      }

      // Regular streaming for non-JSON schema requests
      const stream = await this.client.chat.completions.create(
        {
          stream: true,
          model: this.config.selectedModel,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          max_tokens: 4096,
          ...params,
        },
        { signal: this.controller.signal },
      );

      let response = "";
      let count = 0;
      if (onToken) onToken("", 0);

      for await (const chunk of stream) {
        if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
        if (chunk.choices[0]?.delta?.content) {
          const token = chunk.choices[0].delta.content;
          response += token;
          count++;
          if (onToken) onToken(token, count);
        }
        if (chunk.choices[0]?.finish_reason) break;
      }

      if (this.controller.signal.aborted) throw new OpenAI.APIUserAbortError();
      return response;
    } finally {
      // An AbortController cannot be reused after calling abort().
      // Reset the controller so a new one is available for the next operation
      // in case this operation was aborted.
      this.controller = new AbortController();
    }
  }

  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    const narrationParams = { temperature: 0.6 };
    return this.getResponse(prompt, narrationParams, onToken);
  }

  async getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type> {
    const generatedSchema = z.toJSONSchema(schema);

    // Try with JSON schema first
    let response: string;
    try {
      response = await this.getResponse(
        prompt,
        {
          temperature: 0.1, // Lower temperature for better schema adherence
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "schema",
              strict: false,
              schema: generatedSchema,
            },
          },
        },
        onToken,
      );
    } catch (_error) {
      // Fallback: Add schema instructions to the prompt
      const enhancedPrompt: Prompt = {
        system: `${prompt.system}\n\nIMPORTANT: You must respond with valid JSON that exactly matches this schema: ${JSON.stringify(generatedSchema, null, 2)}`,
        user: `${prompt.user}\n\nRespond with valid JSON only, no other text.`,
      };

      response = await this.getResponse(
        enhancedPrompt,
        {
          temperature: 0.1,
        },
        onToken,
      );
    }

    try {
      const parsed = JSON.parse(response);

      // Check if the response is a validation error array instead of the expected data
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].code) {
        throw new Error(`Model returned validation errors instead of conforming to schema: ${JSON.stringify(parsed)}`);
      }

      const result = schema.parse(parsed) as Type;
      return result;
    } catch (error) {
      // If it's a validation error from the model, try to provide a more helpful message
      if (error instanceof Error && error.message.includes("validation errors")) {
        throw new Error(
          `OpenRouter model doesn't properly support JSON schema constraints. Try a different model or contact support. Original error: ${error.message}`,
        );
      }

      throw error;
    }
  }
}
