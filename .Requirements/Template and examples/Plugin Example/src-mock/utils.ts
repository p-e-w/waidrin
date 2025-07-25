import OpenAI from "openai";
import {
  OpenRouterConfig,
  type OpenRouterConfigType,
  type OpenRouterModelType,
  type StandardizedModelType,
} from "./types";

/**
 * Model filtering and searching utilities
 */

/**
 * Search models by name, ID, or description
 */
export function searchModels(models: StandardizedModelType[], query: string): StandardizedModelType[] {
  if (!query.trim()) {
    return models;
  }

  const searchTerm = query.toLowerCase();
  return models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm) ||
      model.id.toLowerCase().includes(searchTerm) ||
      model.description?.toLowerCase().includes(searchTerm),
  );
}

/**
 * Configuration validation utilities
 */

/**
 * Validate OpenRouter configuration
 */
export function validateOpenRouterConfig(config: unknown): config is OpenRouterConfigType {
  try {
    OpenRouterConfig.parse(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate API key format (basic checks)
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // Basic validation - API key should be non-empty and reasonable length
  const trimmed = apiKey.trim();
  return trimmed.length >= 10 && trimmed.length <= 200;
}

/**
 * Sanitize configuration for logging (removes sensitive data)
 */
export function sanitizeConfigForLogging(config: OpenRouterConfigType): Partial<OpenRouterConfigType> {
  return {
    selectedModel: config.selectedModel,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : undefined,
  };
}

/**
 * Create default OpenRouter configuration
 */
export function createDefaultOpenRouterConfig(): Partial<OpenRouterConfigType> {
  return {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    selectedModel: undefined,
  };
}

/**
 * API client creation helpers
 */

/**
 * Create OpenAI client configured for OpenRouter
 */
export function createOpenRouterClient(config: OpenRouterConfigType): OpenAI {
  if (!validateOpenRouterConfig(config)) {
    throw new Error("Invalid OpenRouter configuration");
  }

  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
    defaultHeaders: {
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      "X-Title": "Waidrin",
    },
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Model conversion utilities
 */

/**
 * Convert OpenRouter model to standardized format
 */
export function convertOpenRouterModelToStandardized(model: OpenRouterModelType): StandardizedModelType {
  const inputPrice = model.pricing ? parseFloat(model.pricing.prompt) : 0;
  const outputPrice = model.pricing ? parseFloat(model.pricing.completion) : 0;

  return {
    id: model.id,
    name: model.name,
    description: model.description,
    provider: "openrouter",
    contextLength: model.context_length,
    pricing: model.pricing
      ? {
          input: inputPrice,
          output: outputPrice,
        }
      : undefined,
  };
}

/**
 * Format model display name for UI
 */
export function formatModelDisplayName(model: StandardizedModelType): string {
  const contextInfo = model.contextLength ? ` (${model.contextLength.toLocaleString("en-US")} tokens)` : "";
  return `${model.name}${contextInfo}`;
}

/**
 * Format pricing information for display
 */
export function formatModelPricing(model: StandardizedModelType): string {
  if (!model.pricing) {
    return "Pricing not available";
  }

  const inputPrice = (model.pricing.input * 1000000).toFixed(2);
  const outputPrice = (model.pricing.output * 1000000).toFixed(2);

  return `$${inputPrice}/$${outputPrice} per 1M tokens (input/output)`;
}

/**
 * Error handling utilities
 */

/**
 * Check if error is an OpenRouter API authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return !!(error && typeof error === "object" && "status" in error && (error as { status: number }).status === 401);
}

/**
 * Check if error is a rate limiting error
 */
export function isRateLimitError(error: unknown): boolean {
  return !!(error && typeof error === "object" && "status" in error && (error as { status: number }).status === 429);
}

/**
 * Check if error is an insufficient credits error
 */
export function isInsufficientCreditsError(error: unknown): boolean {
  return !!(error && typeof error === "object" && "status" in error && (error as { status: number }).status === 402);
}

/**
 * Get user-friendly error message for OpenRouter API errors
 */
export function getOpenRouterErrorMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    return "Invalid API key. Please check your OpenRouter API key.";
  }

  if (isRateLimitError(error)) {
    return "Rate limited by OpenRouter API. Please try again later.";
  }

  if (isInsufficientCreditsError(error)) {
    return "Insufficient credits in your OpenRouter account.";
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    if (status >= 500) {
      return "OpenRouter service is temporarily unavailable. Please try again later.";
    }
  }

  return error instanceof Error ? error.message : "An unknown error occurred";
}
