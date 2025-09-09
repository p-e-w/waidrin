// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

/**
 * @interface IAppUI
 * @description Defines the interface for encapsulating UI-related functionalities.
 */
export interface IAppUI {
  updateProgress(title: string, message: string, tokenCount: number, visible?: boolean): void;
  showError(errorMessage: string, onRetry?: () => void, onCancel?: () => void): void;
  log(message: string, ...args: unknown[]): void;
}

/**
 * @class AppUI
 * @description Concrete implementation of IAppUI, providing centralized management of UI-related functionalities.
 */
export class AppUI implements IAppUI {
  constructor(
    private updateProgressFn: (title: string, message: string, tokenCount: number, visible?: boolean) => void,
    private showErrorFn: (errorMessage: string, onRetry?: () => void, onCancel?: () => void) => void,
    private logFn: (message: string, ...args: unknown[]) => void = console.log,
  ) {}

  updateProgress(title: string, message: string, tokenCount: number, visible?: boolean): void {
    this.updateProgressFn(title, message, tokenCount, visible);
  }

  showError(errorMessage: string, onRetry?: () => void, onCancel?: () => void): void {
    this.showErrorFn(errorMessage, onRetry, onCancel);
  }

  log(message: string, ...args: unknown[]): void {
    this.logFn(message, ...args);
  }
}
