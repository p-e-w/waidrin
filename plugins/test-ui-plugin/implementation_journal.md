## Implementation Journal for test-ui-plugin

### Entry: Refactoring Zustand Relationship (2025-08-12)

**Objective:** Simplify plugin-Zustand interaction, align with original design, and ensure correct typing, specifically addressing `TypeError: injectedZustandStore.useStore is not a function`.

**Problem Addressed:** The `PluginCharacterUIPage` was receiving the `useStateStore` creator function instead of the store instance, leading to `TypeError: injectedZustandStore.useStore is not a function`.

**Solution Implemented:** Refactored the relationship to direct global state access for plugins by passing `useStateStore.getState().setAsync` and `useStateStore.getState` functions directly to the `Context` object. This involved:

1.  **`app/plugins.ts`:**
    *   Removed `zustandStore` property and its assignment in the constructor.
    *   Added `setGlobalState` and `getGlobalState` properties to `Context`.
    *   Updated `setGlobalState` type to handle `Promise<void>` for asynchronous updates.
    *   Ensured `StoredState` and `WritableDraft` types are correctly imported.
    *   Assigned `setGlobalState` and `getGlobalState` in the `Context` constructor.

2.  **`app/page.tsx`:**
    *   Removed `import * as Zustand from 'zustand';`.
    *   Updated `Context` instantiation to pass `useStateStore.getState().setAsync` and `useStateStore.getState`.

3.  **`plugins/test-ui-plugin/main.tsx`:**
    *   Removed `injectedZustandStore` from `PluginCharacterUIPage` props.
    *   Removed `import type * as Zustand from 'zustand';` and `import type { UseBoundStore } from 'zustand';`.
    *   Updated `PluginCharacterUIPage` props to reflect `setGlobalState`'s asynchronous type.
    *   Modified `pluginSettings` derivation to use `getGlobalState()`.
    *   Updated `onSave` callback in `TestUIPlugin`'s `init` method to use `setGlobalState()` with an `async` updater.

4.  **`plugins/test-ui-plugin/tsup.config.js`:**
    *   Confirmed `"zustand"` is removed from the `external` array.

**Compilation Status:**
*   `plugins/test-ui-plugin`: Built successfully.
*   Main application: Built successfully.

**Runtime Verification:**
*   **User Report:** "test passed for our component, we were able to change value and see it persists from tab changes as well as narration events."
*   **Console Logs:** Confirmed `TestUIAttributeDisplay` initialization and `TestPlugin`'s `tstCount` increment on location change, indicating successful `setGlobalState` operation.
*   **Conclusion:** The refactoring successfully resolved the `TypeError` and enabled correct, persistent state interaction for the plugin.

**Next Steps:**
*   Consider if the `onSave` prop in `PluginCharacterUIPage` and `TestUIAttributeDisplay` should be typed to return `Promise<void>` for consistency, although it did not cause a compile or runtime error in this scenario.
