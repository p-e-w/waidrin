// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import OpenAI from "openai";
import {
  type AIProvider,
  convertOpenRouterModelToStandardized,
  OpenRouterApiClient,
  OpenRouterApiException,
  type OpenRouterConfigType,
  type StandardizedModelType,
  validateOpenRouterConfig,
} from "./openrouter-types";

export class OpenRouterProvider implements AIProvider {
  public readonly type = "openrouter" as const;

  validateConfig(config: unknown): boolean {
    return validateOpenRouterConfig(config);
  }

  async fetchModels(config: OpenRouterConfigType): Promise<StandardizedModelType[]> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid OpenRouter configuration");
    }

    const client = new OpenRouterApiClient(config);

    try {
      const response = await client.fetchModels();
      const standardizedModels = response.data.map(convertOpenRouterModelToStandardized);

      // Return all models - let the UI handle filtering for structured outputs
      return standardizedModels;
    } catch (error) {
      if (error instanceof OpenRouterApiException) {
        // Re-throw with more context for specific error types
        if (error.isAuthenticationError()) {
          throw new Error("Invalid API key. Please check your OpenRouter API key.");
        } else if (error.isRateLimited()) {
          throw new Error("Rate limited by OpenRouter API. Please try again later.");
        } else if (error.isInsufficientCredits()) {
          throw new Error("Insufficient credits in your OpenRouter account.");
        } else if (error.isModelUnavailable()) {
          throw new Error("OpenRouter service is temporarily unavailable. Please try again later.");
        }
      }

      // For network errors or other issues
      throw new Error(
        `Failed to fetch models from OpenRouter: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async testConnection(config: OpenRouterConfigType): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid OpenRouter configuration");
    }

    const client = new OpenRouterApiClient(config);

    try {
      await client.testConnection();
    } catch (error) {
      if (error instanceof OpenRouterApiException) {
        if (error.isAuthenticationError()) {
          throw new Error("Invalid API key. Please check your OpenRouter API key.");
        } else if (error.isRateLimited()) {
          throw new Error("Rate limited by OpenRouter API. Please try again later.");
        } else if (error.isInsufficientCredits()) {
          throw new Error("Insufficient credits in your OpenRouter account.");
        } else if (error.isModelUnavailable()) {
          throw new Error("OpenRouter service is temporarily unavailable. Please try again later.");
        }
      }

      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  createClient(config: OpenRouterConfigType): OpenAI {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid OpenRouter configuration");
    }

    return new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
        "X-Title": "AI Adventure Game",
      },
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Test the connection with a simple completion call to verify the selected model works
   */
  async testModelConnection(config: OpenRouterConfigType, modelId: string): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid OpenRouter configuration");
    }

    if (!modelId) {
      throw new Error("Model ID is required for testing");
    }

    const client = this.createClient(config);

    try {
      // Make a simple completion call to test the model
      const response = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say 'Hello' in response." },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response received from the model");
      }

      // Check if the response contains expected content
      const content = response.choices[0].message?.content;
      if (!content || content.trim().length === 0) {
        throw new Error("Empty response received from the model");
      }
    } catch (error) {
      // Check if it's an OpenAI API error (either real or mocked)
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; message?: string };
        if (apiError.status === 401) {
          throw new Error("Invalid API key. Please check your OpenRouter API key.");
        } else if (apiError.status === 402) {
          throw new Error("Insufficient credits in your OpenRouter account.");
        } else if (apiError.status === 429) {
          throw new Error("Rate limited by OpenRouter API. Please try again later.");
        } else if (apiError.status === 404) {
          throw new Error(`Model '${modelId}' not found or not accessible with your API key.`);
        } else if (apiError.status >= 500) {
          throw new Error("OpenRouter service is temporarily unavailable. Please try again later.");
        }
      }

      throw new Error(`Model test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelInfo(config: OpenRouterConfigType, modelId: string): Promise<StandardizedModelType | null> {
    const models = await this.fetchModels(config);
    return models.find((model) => model.id === modelId) || null;
  }

  /**
   * Check if a model supports structured outputs (json_schema)
   */
  async supportsStructuredOutputs(config: OpenRouterConfigType, modelId: string): Promise<boolean> {
    const modelInfo = await this.getModelInfo(config, modelId);
    return modelInfo?.supportsStructuredOutputs ?? false;
  }
}

// Export a singleton instance for convenience
export const openRouterProvider = new OpenRouterProvider();
