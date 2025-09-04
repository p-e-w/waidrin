import type { Backend, TokenCallback } from "@/lib/backend";
import type { Prompt } from "@/lib/prompts";
import type * as z from "zod/v4";

/**
 * @interface IAppBackend
 * @description Defines the interface for encapsulating backend interaction methods.
 */
export interface IAppBackend {
  getBackend(): Backend;
  getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string>;
  getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type>;
  abort(): void;
  isAbortError(error: unknown): boolean;
}

/**
 * @class AppBackend
 * @description Concrete implementation of IAppBackend, providing centralized access to backend interaction methods.
 */
export class AppBackend implements IAppBackend {
  constructor(private getBackendFn: () => Backend) {}

  getBackend(): Backend {
    return this.getBackendFn();
  }

  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    return this.getBackendFn().getNarration(prompt, onToken);
  }

  async getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type> {
    return this.getBackendFn().getObject(prompt, schema, onToken);
  }

  abort(): void {
    this.getBackendFn().abort();
  }

  isAbortError(error: unknown): boolean {
    return this.getBackendFn().isAbortError(error);
  }
}
