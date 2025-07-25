import OpenAI from "openai";
import { OpenRouterConfig, type OpenRouterConfigType } from "./types";

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
