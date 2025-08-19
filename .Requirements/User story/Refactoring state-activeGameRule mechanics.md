## Refactoring `state.activeGameRule` Mechanics

### Analysis of `state.activeGameRule` Usages

**Current Usages of `state.activeGameRule`:**

1.  **Definition:**
    *   `lib/schemas.ts`: Defined as `activeGameRule: z.string()` within the `State` schema.
    *   `lib/state.ts`: Initialized to `"default"` in `initialState`.

2.  **Reads/Writes:**
    *   **`lib/engine.ts` (`getActiveGameRuleLogic`):** Reads `state.activeGameRule` as a fallback to determine the active game rule logic if no plugin has `selectedPlugin: true`.
    *   **`views/CharacterSelect.tsx`:**
        *   Destructured from `useStateStore`.
        *   Used in `useShallow` to select `state.activeGameRule`.
        *   `handleTabChange` function writes to `state.activeGameRule` to change the active tab.
        *   `handlePluginSelectionToggle` function writes to `state.activeGameRule` when a plugin is selected/deselected, influencing the active tab.
        *   Used as the `value` prop for `Tabs.Root` to control the active tab display.
        *   Used in the `activeGameRuleDisplay` string for UI presentation.

### Proposed Changes and Impact

To completely remove `state.activeGameRule` from the global state, the following modifications are necessary:

1.  **Remove `activeGameRule` from `lib/schemas.ts` and `lib/state.ts`:**
    *   **Action:** Delete the `activeGameRule` property from the `State` schema in `lib/schemas.ts` and from `initialState` in `lib/state.ts`.
    *   **Impact:** `activeGameRule` will no longer be part of the global application state.

2.  **Modify `lib/engine.ts`:**
    *   **Action:** In `getActiveGameRuleLogic()`, remove the entire second `for` loop that checks `activeGameRuleName` (i.e., the fallback logic based on `state.activeGameRule`). The function will then directly return `getDefaultGameRuleLogic()` if no plugin with `selectedPlugin: true` is found.
    *   **Impact:** The engine's game rule selection will strictly prioritize plugins with `selectedPlugin: true`. If no such plugin exists, it will *always* use the default game rule logic.

3.  **Modify `views/CharacterSelect.tsx`:**
    *   **Action:**
        *   Remove `activeGameRule` from the destructuring of `useStateStore`.
        *   Introduce a new local state variable (e.g., `const [activeTab, setActiveTab] = React.useState("default");`) to manage the active tab within the component.
        *   Update `handleTabChange` to call `setActiveTab(value)` instead of `setState((state) => { state.activeGameRule = value; })`.
        *   Update `Tabs.Root` to use `value={activeTab}` and `onValueChange={handleTabChange}`.
        *   Remove the logic within `handlePluginSelectionToggle` that modifies `state.activeGameRule`. This function will now only update the `selectedPlugin` flag via `context.setPluginSelected`.
        *   The `activeGameRuleDisplay` variable can remain, as it's based on `currentlySelectedPlugins` (which uses `selectedPlugin`). However, its label might be rephrased (e.g., "Active Plugin(s)") to avoid confusion.
    *   **Impact:** The `CharacterSelect` UI will manage its active tab locally, completely decoupled from the global state.

### Potential Issues/Complexities:

*   **Persisted State:** If users have existing persisted application states (e.g., in browser local storage) that contain `activeGameRule`, removing it from the schema might lead to the persisted value being ignored on first load. This is generally a minor issue in development but should be considered for production releases.
*   **Refactoring Scope:** The changes are well-defined and localized to the identified files. The refactoring is manageable.
*   **Testing:** Thorough testing will be crucial to ensure:
    *   The `CharacterSelect` UI's tab functionality works correctly with local state.
    *   The engine consistently uses the default game rule logic when no plugin is explicitly selected.
    *   The engine correctly uses the game rule logic of the *single* explicitly selected plugin.
    *   No unintended side effects or regressions are introduced elsewhere in the application due to the removal of `activeGameRule` from the global state.

This approach aligns with your goal of eliminating `state.activeGameRule` and relying solely on `selectedPlugin` for engine logic, while managing the UI's active tab locally.
