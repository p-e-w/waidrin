## Plugin Best Practice Guide: Lessons Learned from UI Plugin Development

**Introduction:**
This guide consolidates critical insights gained from developing UI-rich plugins for the Waidrin application, particularly concerning the integration of React and shared UI libraries in a Next.js development environment with Turbopack. It aims to prevent future agents from encountering similar complex and time-consuming debugging loops. For a comprehensive understanding of the plugin framework's architecture, refer to the [Application Design Specification](Application%20Design%20Spec.md). For detailed implementation steps, consult the [Plugin Development Guide](Plugin%20development%20guide.md).

**Core Principle: Single Source of Truth for Shared Libraries**
The fundamental challenge in this plugin architecture is ensuring that both the main application and the plugin use the *exact same instances* of shared libraries (like React, Zustand, Radix UI). Failure to do so leads to the "two instances" problem, resulting in cryptic runtime errors.

**Common Pitfalls and Why They Occur:**

1.  **"Multiple Reacts" Problem (`TypeError: Cannot read properties of null (reading 'useState')`):**
    *   **Cause:** Occurs when the main application and the plugin each load their own separate instance of the React library. Hooks (like `useState`, `useRef`, `useEffect`) from one React instance cannot function correctly when a component is rendered by another React instance.
    *   **Why it's Tricky:** Bundlers (like Webpack or tsup) can inadvertently include React within the plugin's bundle, even if `external` options are set, especially in complex environments like Next.js with dynamic module loading.

2.  **Incorrect Zustand Store Access (`TypeError: injectedZustandStore.useStore is not a function`):**
    *   **Cause:** This error arises when the plugin attempts to use `useStore` directly on the `useStateStore` object (which is the global store instance) passed via the `Context`, instead of using the provided `setGlobalState` and `getGlobalState` functions. The `useStore` method is a React Hook and should be called on the *result* of `useStateStore` (i.e., `useStateStore.useStore`), but the `Context` provides direct access to the global state's `set` and `get` functions for simplified interaction.
    *   **Why it's Tricky:** The naming can be confusing, as `useStateStore` is both the name of the global store and the function to create a store. Plugins should use the `setGlobalState` and `getGlobalState` functions provided by the `Context` for interacting with the global store, or `context.react.useMemo` with `context.getGlobalState()` for reading state within React components.

3.  **`React is not defined`:**
    *   **Cause:** Happens when `React` is externalized from the plugin's bundle, but the runtime environment (browser's module loader, Next.js's dynamic loader) cannot resolve the bare module specifier (`import React from "react";`).
    *   **Why it's Tricky:** Next.js's development environment (especially with Turbopack) might not provide the necessary module resolution mapping for dynamically loaded modules.

3.  **Context Propagation Issues (`useThemeContext` must be used within a `Theme`):**
    *   **Cause:** Components rendered into React Portals (often used by UI libraries like Radix UI for overlays, dropdowns) do not automatically inherit context from their DOM parent. If the `Theme` context is not explicitly propagated to the portal's content, components within the portal will fail.
    *   **Why it's Tricky:** This can be masked by different bundler behaviors (e.g., Turbopack might implicitly handle it, while Webpack might not).

4.  **TypeScript Type Mismatches (`Property 'default' is missing in type 'LoDashStatic'`):**
    *   **Cause:** Occurs when the TypeScript compiler sees different type definitions for the same library (e.g., `lodash`) due to multiple `@types/` packages being present in different `node_modules` paths (main app vs. plugin).
    *   **Why it's Tricky:** Even if the runtime code works, the build will fail due to type conflicts.

5.  **`package.json` vs. `tsup.config.js` Dependency Conflict:**
    *   **Cause:** Occurs when shared libraries (like React, Radix UI, Immer, Zustand) that are *injected* by the main application via the `Context` are *also* listed as `dependencies` or `devDependencies` in the plugin's `package.json`. Even if `tsup.config.js` correctly externalizes these libraries, `npm install` (or `yarn install`) within the plugin's directory will create a separate `node_modules` folder containing these libraries and their `@types` definitions.
    *   **Why it's Tricky:** This leads to the "two instances" problem at the *type level* (TypeScript sees conflicting type definitions) and potentially at runtime if the externalization isn't perfect or if the module resolution order favors the plugin's `node_modules`. This manifests as `TS2322` (type incompatibility) and `TS2786` (JSX component errors) even when the code appears correct and `tsup` is configured for externalization.

**Recommended Best Practices and Solutions:**

1.  **Direct Library Injection via Context (Primary Solution) & Dependency Management:**
    *   **Principle:** Explicitly pass the main application's instances of all shared core libraries to the plugin via the `Context` object. This is the most robust way to ensure a single source of truth. **Crucially, plugins should *not* list these shared libraries (e.g., `react`, `@radix-ui/themes`, `immer`, `zustand`, `@dice-roller/rpg-dice-roller`, their `@types` counterparts) as `dependencies` or `devDependencies` in their `package.json` file.**
    *   **Implementation:** For detailed implementation steps on how to set up direct library injection, refer to the "Solution: Direct Library Injection via Context" section in the [Plugin Development Guide](Plugin%20development%20guide.md).
    *   **Benefits:** Resolves "two instances" problems at both runtime and type levels, eliminates module resolution errors, reduces plugin bundle size, and provides maximum flexibility.

2.  **`tsup` Configuration for Plugins:** Proper `tsup` configuration is crucial to avoid bundling shared libraries within your plugin, which can lead to the "two instances" problem. Ensure all shared libraries are externalized and that the JSX transform is correctly configured to use the injected React instance.

3.  **TypeScript Type Management:** Mismatched or duplicated TypeScript type definitions can lead to complex build errors. It's essential to deduplicate `@types` packages and use explicit typing to guide the TypeScript compiler, ensuring type consistency across the main application and plugins.

4.  **Debugging Strategy:** Effective debugging is crucial when developing plugins. Utilize `console.log` extensively to inspect the state of injected libraries and isolate problematic components or modules.

5.  **Using the State Debugger:** For detailed inspection and modification of the application's global state, including plugin `enabled` status and settings, utilize the built-in `StateDebugger`. Refer to the [Plugin Development Guide](Plugin%20development%20guide.md) for instructions on how to use it.

6.  **Direct State Modification with `WritableDraft` (Immer & Zustand):**
    *   **Principle:** When interacting with the global application state via functions that provide a `WritableDraft<State>` (e.g., within `setAsync` updaters or certain plugin lifecycle methods like `onLocationChange`), you can and should directly mutate the provided `draft` object. Immer, used in conjunction with Zustand, handles the underlying immutability, ensuring that a new state object is produced without requiring manual spreading or copying.
    *   **Why it's Important:** This pattern simplifies state updates, reduces boilerplate, and prevents common errors associated with manual immutable updates. It is the intended and efficient way to modify the application's state in these contexts.
    *   **Example Contexts:** This applies to the `state` parameter in `onLocationChange` and the `draft` object received by updater functions passed to `setAsync`.

**What NOT to do (Common Pitfalls to Avoid):**

*   **Relying on Webpack Aliasing in Turbopack Dev:** Webpack configurations in `next.config.ts` are ignored by Turbopack. Do not expect them to solve development-time module resolution issues.
*   **Bundling Shared Libraries in Plugins:** Avoid `noExternal: [/.*/]` for shared libraries in `tsup.config.js` if the main application also uses them.
*   **Implicit `React` Usage:** Do not assume `React` is globally available or implicitly linked. Always ensure it's explicitly passed and used.
