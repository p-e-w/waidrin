# Application Design Specification

## 1. Introduction

This document outlines the architectural design and core components of the Waidrin application, with a particular focus on its extensible plugin framework. It synthesizes information from previous design documents and incorporates recent insights regarding plugin state management and persistence. This specification serves as a foundational reference for understanding the system's structure and design principles.

## 2. Core Application Architecture

The Waidrin application is structured into several key directories, each with a distinct role:

### 2.1. `lib` (Library)

Contains the core logic of the application.

*   **`state.ts`**: Manages the global application state using Zustand, including game data (world, characters, events, locations), user settings, and loaded plugins. It defines the `Plugin` interface, outlining methods that plugins can implement (e.g., `init`, `getBackends`, `onLocationChange`). It also configures the `zustand/persist` middleware for automatic state persistence.
*   **`backend.ts`**: Defines the `Backend` interface and a `DefaultBackend` class for communicating with AI models (OpenAI-compatible APIs). It handles API requests, streaming responses, and JSON schema validation.
*   **`engine.ts`**: Contains the game's state machine logic, orchestrating the flow of the game. It uses the `backend` to generate narration, characters, locations, and actions based on the current game state and user input. It also handles state transitions between different "views" of the application and manages plugin lifecycle hooks.
*   **`prompts.ts`**: Defines the various prompts used to interact with the AI model, constructing the system and user messages based on the current game state.
*   **`schemas.ts`**: Defines Zod schemas for validating data structures used throughout the application, ensuring data consistency and type safety.

### 2.2. `app` (Application Root & API Routes)

Serves as the entry point for the Next.js application and defines API routes.

*   **`layout.tsx`**: The root layout for the Next.js application, setting up global styles, fonts, and the Radix UI theme.
*   **`page.tsx`**: The main client-side component that orchestrates the application's views. It loads plugins, manages overlay and error states, and renders the appropriate view component based on the `view` state from `lib/state.ts`. It also initiates the game engine's `next` function and handles state rehydration.
*   **`plugins.ts`**: Defines the `Context` class used by plugins to interact with the main application (e.g., adding backend UI components, character UI components). It also manages a separate Zustand store for plugin-related UI elements, including `BackendUI` and `CharacterUI` interfaces.
*   **`api/log-error/route.ts`**: An API route for logging errors.
*   **`plugins/route.ts`**: An API route (`/plugins`) that scans the `plugins` directory for `manifest.json` files and returns a list of available plugins to the frontend.
*   **`plugins/[...path]/route.ts`**: An API route (`/plugins/[path]`) that serves JavaScript files from the `plugins` directory, allowing the frontend to dynamically load plugin code. It includes security checks to prevent path traversal.

### 2.3. `components` (Reusable UI Components)

Contains small, reusable React components that are used across different views. Examples include `ErrorPopup`, `ProcessingOverlay`, `MainMenu`, `CharacterView`, `EventView`, and `WizardStep`. These components are generally presentational and receive data via props.

### 2.4. `views` (Application Screens)

Contains the main "screens" or pages of the application, each corresponding to a specific game state or user interaction. Examples include `Welcome`, `ConnectionSetup`, `GenreSelect`, `CharacterSelect`, `ScenarioSetup`, and `Chat`. These views compose `components` and interact with `lib/engine.ts` and `lib/state.ts` to manage game flow and data.

## 3. Application Flow

`app/page.tsx` is the central orchestrator. It initializes the global state (`lib/state.ts`) and dynamically loads plugins by fetching their manifests from `/plugins` and their code from `/plugins/[...path]`. Based on the `view` property in the global state, `app/page.tsx` renders the appropriate component from the `views` directory.

The `views` components, in turn, use `lib/state.ts` to read and update the application state. User interactions within the `views` (e.g., clicking a button, entering text) trigger functions in `lib/engine.ts` (like `next` or `back`), which then perform game logic, interact with `lib/backend.ts` to communicate with the AI model, and update the global state. The `components` directory provides the building blocks for these views, ensuring a consistent UI.

## 4. Plugin Framework

The plugin framework allows for extending Waidrin's functionality, particularly for integrating new AI backends, custom game logic, and character-related UI components.

### 4.1. Plugin Discovery and Loading

The core application automatically discovers plugins by scanning a designated directory for `manifest.json` files. These manifests provide metadata necessary for loading and initializing the plugin's main module.

### 4.2. Plugin Initialization and Context Provision

Upon loading, each enabled plugin will be initialized. During initialization, the core provides a `Context` object to the plugin. This `Context` object serves as the primary interface for the plugin to interact with core functionalities, including state management and UI injection.

### 4.3. Plugin State Management and Persistence (Updated)

Plugins can define and manage their own settings (state). The core application is responsible for persisting these settings across sessions.

*   **`manifest.json` Settings:** The `settings` object within `manifest.json` defines the **initial default values** for a plugin's persistent state. These values are loaded when the plugin is first discovered or when its persisted state is not found.
*   **Runtime Updates of Plugin Variables:** To update variables defined in `manifest.json` (or any other persistent data) at runtime, plugins should directly modify the `settings` object of their `PluginWrapper` within the `immer` draft (`state`) that is passed to their lifecycle methods (e.g., `onLocationChange`).
    *   **Example:** If a plugin's `onLocationChange` method receives `state: WritableDraft<State>`, and it wants to update its `tstCount` setting, it should do so by finding its own entry in `state.plugins` and directly modifying `state.plugins[index].settings.tstCount`.
    *   **Rationale:** This approach ensures that all modifications occur within the same `immer` transaction, maintaining state consistency. The `setAsync` function in `lib/engine.ts` will then atomically commit these changes to the global Zustand store and trigger persistence.
*   **`Context.saveSettings(settings)`:** This method is provided by the `Context` object. While it *does* persist settings, its primary intended use is for **UI-driven updates**. For example, if a plugin provides a configuration UI, and a user changes a setting via an input field, the UI component would call `context.saveSettings(newSettings)` to persist that user-initiated change. Callbacks for such UI-driven updates (e.g., `onSave` props) should be typed to return `Promise<void>` if they involve asynchronous persistence operations, allowing for proper `await` usage and error handling. For internal, programmatic updates within lifecycle methods (like `onLocationChange`), directly modifying the `immer` draft is the preferred and more robust approach.
*   **Automatic Persistence:** Waidrin automatically handles the serialization and deserialization of plugin settings using `zustand/persist` and its `partialize` function. Plugin authors **do not need to worry about the mechanics of serialization or deserialization**. Only the data within the `settings` object is persisted; plugin and backend instances themselves are not serialized.
*   **Handling Initial/Undefined Values:** Plugins should ensure that any variables they expect to persist are properly initialized (e.g., to `0` for numbers, `""` for strings) within their `init` method. This prevents issues like `NaN` values being introduced if a variable is `undefined` and then used in an arithmetic operation, which can lead to `null` persistence and unexpected resets.

### 4.4. Dynamic UI Injection

Plugins have the capability to inject custom React components into predefined slots within the core application's user interface. This allows plugins to provide configuration screens, character customization options, or other UI elements relevant to their functionality.

*   **`BackendUI`**: Defines the structure for a backend's user interface components (`backendName`, `configurationTab`, `configurationPage`).
*   **`CharacterUI`**: Defines the structure for a character-related user interface component (`GameRuleName`, `GameRuleTab`, `GameRulePage`).
*   **`Context.addBackendUI(...)` and `Context.addCharacterUI(...)`**: Methods provided by the `Context` object for plugins to register their UI components.

### 4.5. Backend Integration

Plugins can register custom backend implementations with the core, allowing the application to connect to various language models or AI services beyond the default.

*   **`getBackends(): Promise<Record<string, Backend>>`**: A method in the `Plugin` interface that allows a plugin to return a map of backend instances.

### 4.6. Plugin Interface (`lib/state.ts:Plugin`)

Defines the methods that a plugin's main module must implement to interact with the core.

```typescript
export type Plugin = Partial<{
  init(settings: Record<string, unknown>, context: Context): Promise<void>;
  getBackends(): Promise<Record<string, Backend>>;
  onLocationChange(newLocation: Location, state: WritableDraft<State>): Promise<void>;
  // ... (Future methods for rule query service registration, etc.)
}>;
```

### 4.7. Plugin Context (`app/plugins.ts:Context`)

Provides a controlled interface for plugins to interact with the core application.

```typescript
export class Context {
  pluginName: string;
  react: typeof React;
  setGlobalState: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>;
  getGlobalState: () => StoredState;
  immer: typeof import('immer');
  radixThemes: typeof import('@radix-ui/themes');
  reactIconsGi: typeof import('react-icons/gi');
  useShallow: typeof import('zustand/shallow').useShallow;

  constructor(
    pluginName: string,
    react: typeof React,
    setGlobalState: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>,
    getGlobalState: () => StoredState,
    immer: typeof import('immer'),
    radixThemes: typeof import('@radix-ui/themes'),
    reactIconsGi: typeof import('react-icons/gi'),
    useShallow: typeof import('zustand/shallow').useShallow,
  );
  saveSettings(settings: Record<string, unknown>): void; // Primarily for UI-driven updates
  addCharacterUI(GameRuleName: string, GameRuleTab: React.ReactNode, GameRulePage: React.ReactNode): void;
  addBackendUI(backendName: string, configurationTab: React.ReactNode, configurationPage: React.ReactNode): void;
  // ... (Future methods like publishGameEvent, registerRuleQueryService)
}
```

### 4.7.1. Shared Library Injection

To ensure plugins can utilize core application libraries (like React, Radix UI) without bundling their own copies (which leads to the "two instances" problem, especially in environments like Next.js with Turbopack), the `Context` object is extended to directly inject these shared library instances. This guarantees a single source of truth for common dependencies across the application and its plugins.

For global state management, instead of injecting the entire Zustand library, specific global state access functions (`setGlobalState` and `getGlobalState`) are injected for direct, type-safe interaction with the main application's `useStateStore`.

Plugins should use these injected instances for all their React-related operations and for components from shared libraries, and the provided global state access functions for state manipulation.

**Key Libraries/Functions Injected:**

*   `react`: The core React library.
*   `setGlobalState`: Function to asynchronously update the global application state.
*   `getGlobalState`: Function to retrieve the current global application state.
*   `immer`: For immutable state updates.
*   `lodash`: A utility library.
*   `@radix-ui/themes`: The UI component library.
*   `react-icons/gi`: Specific icons used in the application.
*   `useShallow`: For optimizing re-renders with Zustand selectors.
*   `@dice-roller/rpg-dice-roller`: For dice rolling functionality.

**Plugin Usage:**

Plugins receive these injected libraries and functions via the `Context` object in their `init` method. They should then use these injected instances for all their operations. For example, instead of `import React from 'react'`, a plugin would use `context.react.useState` or `context.radixThemes.Text`. For global state updates, they would use `context.setGlobalState` and `context.getGlobalState`.

For detailed implementation steps and troubleshooting, refer to the [Plugin Development Guide](Plugin%20development%20guide.md).

### 4.7.2. Core File Modifications for Shared Library Injection

To implement the shared library injection mechanism, modifications were made to the following core application files. These changes are essential for enabling plugins to utilize the main application's React and other shared libraries, and should be carefully considered during future merges or updates from upstream.

*   **`app/plugins.ts`**:
    *   **Change:** The `Context` class was extended to include properties for injected shared libraries (`react`, `immer`, `lodash`, `radixThemes`, `reactIconsGi`, `useShallow`, `rpgDiceRoller`).
    *   **Change:** Instead of injecting the `zustand` library directly, `setGlobalState` and `getGlobalState` functions were added to the `Context` class, providing direct access to the main application's global state management.
    *   **Change:** The `Context` class constructor was modified to accept and assign these shared library instances and global state access functions.
    *   **Reason:** To provide plugins with direct access to the main application's instances of these libraries and a controlled interface for global state management, resolving "two instances" problems and module resolution issues in the development environment (Turbopack).

*   **`app/page.tsx`**:
    *   **Change:** The `Context` constructor call within the `loadPlugins` function was modified to pass the imported shared library instances and the `useStateStore.getState().setAsync` and `useStateStore.getState` functions to the `Context` object, including `rpgDiceRoller`.
    *   **Change:** Explicitly imported `React` (`import React, { useEffect, useState } from "react";`) to ensure `React` is correctly in scope when passed to the `Context`.
    *   **Reason:** To gather the main application's instances of shared libraries and global state access functions and inject them into the plugin `Context` during plugin loading.

### 4.8. Core State Management (`lib/state.ts:useStateStore`)

The central Zustand store for the entire application state, including plugin-specific settings.

*   **Plugin Persistence:** The `persist` middleware is configured to automatically save and load plugin settings (via `partialize`) based on the `PluginWrapper` structure.
*   **`PluginWrapper`:**
    ```typescript
    export interface PluginWrapper {
      name: string;
      enabled: boolean;
      settings: Record<string, unknown>;
      plugin: Plugin; // The actual plugin instance (not persisted)
    }
    ```
    The `plugin` instance itself is not persisted, only its `name`, `enabled` status, and `settings`.

### 4.9. UI Integration (`views/CharacterSelect.tsx`, `views/ConnectionSetup.tsx`)

These views utilize `app/plugins.ts:usePluginsStateStore` to retrieve and render the `characterUIs` and `backendUIs` provided by loaded plugins. This allows for dynamic tab and page injection.

## 5. Plugin Development Essentials

For detailed instructions on how to create a new plugin, including required files, manifest structure, and example code, please refer to the [Plugin Development Guide](Plugin%20development%20guide.md). This guide provides step-by-step instructions for setting up your plugin and integrating it with the Waidrin application. For best practices and common pitfalls to avoid during plugin development, consult the [Plugin Best Practice Guide](Plugin%20best%20practice%20guide.md).
