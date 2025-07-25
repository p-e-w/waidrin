import * as z from "zod/v4";

// Configuration Types
export const OpenRouterConfig = z.object({
  apiKey: z.string().min(1, "API key is required"),
  selectedModel: z.string().optional(),
  baseUrl: z.string().url().default("https://openrouter.ai/api/v1"),
});

// Type exports
export type OpenRouterConfigType = z.infer<typeof OpenRouterConfig>;
