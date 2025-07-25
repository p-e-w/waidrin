
## Plugin Development Guide: Enabling React and UI Components

**Introduction:**
Developing plugins for the Waidrin application, especially those requiring custom UI components built with React and shared libraries like Radix UI, presents unique challenges due to the application's dynamic plugin loading mechanism and the interplay of Next.js's development environment (Turbopack) with module bundling. This guide outlines the solutions implemented to overcome the "two Reacts" problem and ensure seamless integration of UI-rich plugins.

## Prerequisites

Before you begin developing plugins, ensure you have the following installed:

*   **Node.js:** Version 18 or higher.
*   **npm (Node Package Manager):** Comes bundled with Node.js.
*   **Git:** For cloning the Waidrin application repository.
*   **Basic understanding of:**
    *   **React:** Component-based UI development.
    *   **TypeScript:** Type-safe JavaScript.
    *   **Next.js:** React framework for production.
    *   **Zustand:** State management library.
    *   **Immer:** Immutable state updates.

## Development Environment Setup

To set up your development environment for Waidrin plugin development:

1.  **Clone the Waidrin Repository:**
    ```bash
    git clone <repository_url>
    cd waidrin
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`. The application will automatically discover and load plugins from the `plugins/` directory.

## Plugin Structure and Basic Setup

To create a new plugin for the Waidrin application, you will need to set up a specific directory structure and provide essential files.

1.  **Plugin Directory:** Create a new directory within the `plugins/` folder (e.g., `plugins/my-new-plugin/`). This directory will contain all your plugin's files.

2.  **`manifest.json`:** This file must be present in the plugin's root directory and contain metadata about the plugin. The application uses this file to discover and load your plugin.
    *   `name`: A unique identifier for your plugin.
    *   `main`: The path to your plugin's main JavaScript file (relative to the plugin directory). This is the entry point for your plugin's logic.
    *   `settings`: An object containing **initial default settings** for the plugin. These values are loaded when the plugin is first discovered or when its persisted state is not found.

    Example `manifest.json`:
    ```json
    {
      "name": "my-new-plugin",
      "main": "index.js",
      "settings": {
        "someSetting": "defaultValue",
        "counter": 0
      }
    }
    ```

3.  **Main Plugin JavaScript File:** The JavaScript file specified in `manifest.json`'s `main` field (e.g., `plugins/my-new-plugin/index.js`). This file should export a default class that implements the `Plugin` interface. The `init` method of this class will receive the `Context` object, which provides access to core application functionalities.

    Example `index.js` (illustrating `init` and `onLocationChange` for settings updates):
    ```javascript
    import type { Context } from "@/app/plugins";
    import type { Plugin } from "@/lib/state";
    import { WritableDraft } from "immer"; // Import WritableDraft for type safety

    class MyNewPlugin implements Plugin {
      // Store plugin's internal state and context
      private settings: Record<string, unknown>;
      private context: Context;

      async init(settings: Record<string, unknown>, context: Context) {
        console.log("MyNewPlugin initialized with settings:", settings);
        // Initialize internal settings, ensuring defaults if not present
        this.settings = settings || {};
        if (typeof this.settings.counter !== 'number') {
          this.settings.counter = 0; // Ensure counter is a number
        }
        this.context = context;

        // No need to call context.saveSettings(this.settings) here.
        // The initial settings are handled by app/page.tsx and zustand/persist.
      }

      async onLocationChange(newLocation: Location, state: WritableDraft<State>) {
        console.log("Location changed to:", newLocation.name);

        // Find this plugin's entry in the state draft to modify its settings directly.
        // This is the preferred way to update persistent settings within lifecycle methods.
        const thisPluginInDraft = state.plugins.find(p => p.name === "my-new-plugin");
        if (thisPluginInDraft) {
          // Ensure the counter is a number before incrementing
          if (typeof thisPluginInDraft.settings.counter !== 'number') {
            thisPluginInDraft.settings.counter = 0;
          }
          thisPluginInDraft.settings.counter++; // Directly modify the draft
          console.log("MyNewPlugin: counter incremented to", thisPluginInDraft.settings.counter);
        }
      }

      // Other optional methods like getBackends() can be implemented here
    }

    export default MyNewPlugin;
    ```

### Minimal "Hello World" Plugin Example

To get started quickly, you can create a simple plugin that logs a message to the console when initialized.

**1. Create the Plugin Directory:**
   ```bash
   mkdir plugins/hello-world-plugin
   ```

**2. Create `plugins/hello-world-plugin/manifest.json`:**
   ```json
   {
     "name": "hello-world-plugin",
     "main": "index.js",
     "settings": {}
   }
   ```

**3. Create `plugins/hello-world-plugin/index.js`:**
   ```javascript
   class HelloWorldPlugin {
     async init(settings, context) {
       console.log("Hello from HelloWorldPlugin!");
       this.context = context; // Store context for later use if needed
     }
   }

   export default HelloWorldPlugin;
   ```

After creating these files, run `npm run dev` in the main Waidrin application directory. You should see "Hello from HelloWorldPlugin!" logged in your browser's console.

## Understanding Plugin Challenges

***The "Two Reacts" Problem and Shared Library Conflicts:***
Initially, plugins encountered a `TypeError: Cannot read properties of null (reading 'useState')` or `React is not defined`. This "two Reacts" problem occurs when the main application and the plugin each load their own separate instance of the React library. When a component from one React instance tries to use Hooks or contexts from another, it leads to runtime errors. Similar issues arise with other shared UI libraries like Radix UI.

**Challenges Encountered:**

1.  **Webpack Aliasing Ineffectiveness in Turbopack:** Next.js's `webpack` configuration (used for aliasing `react` and other shared libraries to ensure a single instance) is ignored when Turbopack is enabled in development mode (`next dev --turbopack`). This meant our initial Webpack-based solution for the "two Reacts" problem was not applied in development.
2.  **Bare Module Specifier Resolution:** When `react` and other libraries were externalized in the plugin's `tsup` configuration, the browser's module loader failed to resolve bare module specifiers (e.g., `import React from "react";`) for dynamically loaded plugin code.
3.  **React Hook Context:** Even when `React` was seemingly available, `useState` (and other Hooks) failed because the `React` instance being used by the plugin's components did not have the Hook dispatcher set up by the main application's rendering context.
4.  **TypeScript Type Mismatches:** Complex type errors arose when different parts of the build process (main app vs. plugin) were using different definitions of shared libraries (e.g., `@types/react`, `@types/lodash`).
5.  **JSX Transform Issues:** Ensuring JSX was correctly transformed to use the injected `React` instance.

## Implementing the Solution

**Solution: Direct Library Injection via Context**

The most robust and effective solution found involves explicitly injecting the main application's instances of `React` and all other shared core libraries into the plugin's `Context` object. This bypasses bundling conflicts and ensures a single source of truth for all common dependencies. For a deeper understanding of the architectural design of the plugin framework and the `Context` object, refer to the [Application Design Specification](Application%20Design%20Spec.md).

**Implementation Steps:**

1.  **Identify All Shared Core Libraries:**
    *   Review the main application's `package.json` and common imports.
    *   For Waidrin, these include: `react`, `immer`, `lodash`, `@radix-ui/themes`, `react-icons/gi`, `zustand/shallow` (for `useShallow`), `@dice-roller/rpg-dice-roller`. For global state management, `setGlobalState` and `getGlobalState` functions are injected instead of the `zustand` library itself.

2.  **Modify `app/plugins.ts` (Context for Injection):**
    *   **Add properties to the `Context` class:** Locate the `Context` class definition in `app/plugins.ts` and add the following properties to its interface/class definition:
        ```typescript
        export class Context {
          // ... existing properties
          react: typeof React;
          setGlobalState: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>;
          getGlobalState: () => StoredState;
          immer: typeof import('immer');
          radixThemes: typeof import('@radix-ui/themes');
          reactIconsGi: typeof import('react-icons/gi');
          useShallow: typeof import('zustand/shallow').useShallow;
          // ...
        }
        ```
    *   **Modify the `Context` constructor:** Update the constructor to accept and assign these new properties. Ensure the order matches the property definitions.

3.  **Modify `app/page.tsx` (Inject Libraries and Global State Accessors into Context):**
    *   **Add imports:** At the top of `app/page.tsx`, add `import * as ... from '...'` statements for all shared libraries (e.g., `import * as React from "react";`, `import * as immer from "immer";`).
    *   **Pass to `Context` constructor:** In the `loadPlugins` function, locate where the `Context` instance is created and pass all these imported modules, along with `useStateStore.getState().setAsync` and `useStateStore.getState`, to the `Context` constructor.

4.  **Modify `plugins/<your-plugin>/tsup.config.js`:**
    *   **Set `external: [...]`:** In your plugin's `tsup.config.js`, ensure all identified shared libraries are listed in the `external` array. This is crucial to prevent the plugin from bundling its own copies.
    *   **Keep `jsx: "react-jsx"`:** Ensure this option is set to use the new JSX transform.

5.  **Modify `plugins/<your-plugin>/main.tsx` (Use Injected Libraries):**
    *   **Remove direct runtime imports:** Eliminate `import` statements for shared libraries that are now injected via the `Context`.
    *   **Add `import type ... from '...'` statements:** Use `import type` for type checking the injected modules to avoid bundling them.
    *   **Declare module-level `React`:** Declare a module-level `let React: typeof import('react');` variable.
    *   **Assign `React` in `init`:** Inside the plugin's `init` method, assign `React = this.context.react;`. This is crucial for JSX transform to find the correct `React` instance.
    *   **Use injected libraries:** Modify plugin components to receive injected libraries as props and use them (e.g., `injectedReact.useState`, `injectedRadixThemes.Text`). For global state updates, use `injectedSetGlobalState` and `injectedGetGlobalState`. For example, to use `rpg-dice-roller`: `const roll = new context.rpgDiceRoller.DiceRoll('4d6');`.
    *   **Type asynchronous callbacks:** If a component prop (like `onSave`) involves an asynchronous operation (e.g., persisting data), its type signature should reflect this by returning `Promise<void>`. This ensures type safety and allows consuming components to `await` the operation for proper flow control.

6.  **Manage `package.json` Dependencies Carefully:**
    *   **Principle:** Only include dependencies in your plugin's `package.json` that are *not* provided by the main application via the `Context` object. Shared libraries like `react`, `@radix-ui/themes`, `immer`, `zustand`, and their corresponding `@types` packages should *not* be listed as `dependencies` or `devDependencies` in your plugin's `package.json`.
    *   **Rationale:** Listing these shared libraries as direct dependencies will cause `npm install` (or `yarn install`) to create a separate `node_modules` folder within your plugin, leading to conflicting type definitions and potential runtime issues ("two instances" problem), even if `tsup` is configured for externalization.
    *   **Action:** Review your plugin's `package.json` and remove any dependencies that are already provided by the main application's `Context`.

**Benefits of this Approach:**

*   **Resolves "Two Reacts" Problem:** Guarantees a single React instance.
*   **Eliminates Module Resolution Errors:** Plugins no longer try to resolve bare module specifiers.
*   **Reduces Plugin Bundle Size:** Plugins are much smaller.
*   **Maximum Flexibility:** Plugins can use any part of the shared libraries.
*   **Robustness:** Works reliably in the Next.js/Turbopack development environment.

## Testing Your Plugin

Thoroughly testing your plugin is crucial to ensure its stability and correct functionality.

*   **Unit Tests:** Write unit tests for individual functions and components within your plugin. Use a testing framework like Jest or Vitest.
*   **Integration Tests:** Test how your plugin interacts with the core application and other plugins.
*   **Manual Testing:** Always perform manual testing by running the Waidrin application with your plugin enabled and interacting with its features.
*   **Console Logs:** Utilize `console.log` statements during development to inspect values and execution flow.

## Debugging Your Plugin

When issues arise, effective debugging can save significant time.

*   **Browser Developer Tools:** Use your browser's developer tools (e.g., Chrome DevTools, Firefox Developer Tools) to:
    *   Inspect the console for errors and log messages.
    *   Set breakpoints in your plugin's JavaScript code to step through execution.
    *   Examine the network requests made by your plugin.
    *   Inspect the React component tree and state.
*   **Waidrin's Internal State:** The Waidrin application's global state (managed by Zustand) can be inspected. You can often access it via the browser's console if exposed for debugging.
*   **Source Maps:** Ensure your plugin's build process generates source maps (`.map` files) to enable easier debugging of your original TypeScript/JavaScript code in the browser.

For insights into common pitfalls and recommended solutions during plugin development, refer to the [Plugin Best Practice Guide](Plugin%20best%20practice%20guide.md).

### Using the State Debugger for Plugin Management

The Waidrin application includes a built-in `StateDebugger` that allows you to inspect and modify the application's global state, including the state of installed plugins. This is a powerful tool for debugging and for manually enabling/disabling plugins during development.

**How to Access and Use the State Debugger:**

1.  **Run the application** in development mode (`npm run dev`).
2.  **Open the State Debugger:** Look for a small eye icon (👁️) or similar visual cue, usually in the top-right corner of the application. Click it to open the debugger panel.
3.  **Locate Plugin State:** Within the debugger's UI, navigate to the `plugins` array. This array contains `PluginWrapper` objects for each installed plugin.
4.  **Modify Plugin Status:** For any plugin, you can directly modify its `enabled` boolean property (true/false) within the debugger's interface.
5.  **Observe Changes:**
    *   Changes made in the `StateDebugger` are immediately reflected in the application's state.
    *   If you disable a plugin, it will no longer be loaded on subsequent page refreshes (or if the `loadPlugins` function is re-executed).
    *   The `enabled` status is persisted across browser sessions, so your changes will remain even if you close and reopen the browser.

This allows you to quickly test the behavior of your plugins when enabled or disabled without modifying source code.