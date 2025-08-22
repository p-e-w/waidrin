# CharacterUI Tab Management Change Request

## Decision: Eliminate `activeGameRule` from Global State and Implement UI-Only Local State for Tab Management

### Rationale

The `activeGameRule` property in the global `StoredState` (`lib/schemas.ts` and `lib/state.ts`) was initially used for two primary purposes:
1.  To control the active tab in the `CharacterSelect.tsx` UI.
2.  To serve as a fallback mechanism in `lib/engine.ts`'s `getActiveGameRuleLogic()` to determine the active game rule when no plugin was explicitly marked as `selectedPlugin`.

Upon review, it has been determined that `activeGameRule` introduces unnecessary coupling between the UI's tab selection and the engine's game rule activation logic. Furthermore, the project's evolving design aims to support **multiple selected plugins** (where `selectedPlugin: true` for more than one plugin), with the engine defaulting to `getDefaultGameRuleLogic()` if no matching conditions are found. In this scenario, `activeGameRule` becomes redundant for engine logic.

Therefore, the decision is to eliminate `activeGameRule` from the global state to simplify the codebase and improve separation of concerns.

### Implementation Plan

#### Part 1: Eliminate `activeGameRule` from Global State

1.  **Remove `activeGameRule` from `lib/schemas.ts`:**
    *   Locate and remove `activeGameRule: z.string(),` from the `State` schema definition.
2.  **Remove `activeGameRule` from `lib/state.ts`:**
    *   Locate and remove `activeGameRule: "default",` from the `initialState` object.
3.  **Update `lib/engine.ts` (`getActiveGameRuleLogic()`):**
    *   Modify the `getActiveGameRuleLogic()` function to *only* check for `pluginWrapper.selectedPlugin`.
    *   The logic will be simplified to: if any `pluginWrapper.enabled` and `pluginWrapper.selectedPlugin` is found, return its `getGameRuleLogic()`. Otherwise, return `getDefaultGameRuleLogic()`. The `activeGameRule` check will be removed entirely from this function.
4.  **Review Other Files:**
    *   Perform a project-wide search for any other direct references to `activeGameRule` (e.g., `state.activeGameRule`) and update them to reflect its removal.

#### Part 2: Implement UI-Only Local State for Tab Management in `CharacterSelect.tsx`

To manage the active tab in `CharacterSelect.tsx` without relying on `activeGameRule`, a local React state will be introduced.

1.  **Introduce Local State:**
    *   Add a `useState` hook within the `CharacterSelect` component to manage the currently active tab. This state will *not* be part of the global `StoredState`.
    ```typescript
    // Inside CharacterSelect.tsx component function
    const [activeTabKey, setActiveTabKey] = React.useState('default'); // 'default' for Appearance tab
    ```
2.  **Update `Tabs.Root` Component:**
    *   Bind the `value` prop of `Tabs.Root` to `activeTabKey` and the `onValueChange` prop to `setActiveTabKey`.
    ```typescript
    <Tabs.Root value={activeTabKey} onValueChange={setActiveTabKey}>
        {/* ... Tabs.List and Tabs.Content ... */}
    </Tabs.Root>
    ```
3.  **Adjust `handleTabChange` (if still needed):**
    *   The `handleTabChange` function (which previously updated `state.activeGameRule`) will be removed or refactored as its purpose is now handled by `setActiveTabKey`.
4.  **Maintain `handlePluginSelectionToggle`:**
    *   The `handlePluginSelectionToggle` function will continue to update the `selectedPlugin` flag in the global state. This ensures that the engine's game rule activation logic remains correctly linked to the `selectedPlugin` status, independent of the UI's active tab.

### Benefits of this Approach

*   **Simplified Global State:** Removes a redundant property from the core application state.
*   **Clear Separation of Concerns:** Explicitly separates UI state (which tab is visible) from engine logic (which game rule is active).
*   **Support for Multiple Selected Plugins:** This approach aligns with the decision to allow multiple plugins to be `selectedPlugin: true`. The engine will prioritize these selected plugins, and if none are selected, it will gracefully fall back to the default game rule logic. The UI tab can then independently display any plugin's interface without affecting the engine's active game rule unless the `selectedPlugin` flag is explicitly toggled.
*   **Improved Maintainability:** Changes to the UI's tab behavior will not necessitate changes to the global state schema or engine logic, and vice-versa.
