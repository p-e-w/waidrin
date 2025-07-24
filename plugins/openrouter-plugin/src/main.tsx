import type { Plugin } from "../../../lib/state";
import type { Backend } from "../../../lib/backend";
import { OpenRouterBackend } from "./backend";

export default class OpenRouterProviderPlugin implements Plugin {
  private backend: OpenRouterBackend;

  constructor() {
    this.backend = new OpenRouterBackend({
        apiKey: "",
        selectedModel: undefined,
        baseUrl: "https://openrouter.ai/api/v1"
    });
  }

  async init(settings: Record<string, unknown>): Promise<void> {
    const apiKey = typeof settings.apiKey === "string" ? settings.apiKey : "";
    
    this.backend.updateConfig({
      apiKey,
      baseUrl: (settings.baseUrl as string) ?? "https://openrouter.ai/api/v1",
      selectedModel: (settings.defaultModel as string) ?? undefined
    });
  }

  async getBackends(): Promise<Record<string, Backend>> {
    return {
      openrouter: this.backend,
    };
  }
}
