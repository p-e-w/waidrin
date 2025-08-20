## Feature Specification: Dynamic Game Rule Selection

### 1. Feature Name

Dynamic Game Rule Selection

### 2. Opportunity for Enhancement

The Waidrin application possesses a strong foundation for dynamic and engaging role-playing experiences. We have a significant opportunity to elevate this by introducing a sophisticated mechanism for integrating diverse game rule sets, thereby enriching character generation, action resolution, and narrative adaptability. This enhancement will empower Waidrin to:

1.  Establish a centralized and flexible system for designating and applying active game rules, seamlessly influencing core game logic.
2.  Enable plugins to directly contribute their unique game rule logic, including custom initial character statistics, tailored AI prompt modifications, precise action check definitions, and specialized combat narration, expanding the creative possibilities for content creators.
3.  Implement a graceful and robust fallback to a default rule set, ensuring a consistent and high-quality experience even when no custom game rule is actively selected, providing a solid baseline for all adventures.

### 3. Proposed Solution

To address these limitations, we will introduce a comprehensive "Dynamic Game Rule Selection" system. This system centers on an `activeGameRule` property within the main application `State` to track the currently selected game rule. The core of this solution is the `IGameRuleLogic` interface, which plugins can implement to inject their custom game rule behavior. The game engine will dynamically select and apply the logic from the active game rule plugin, ensuring a seamless and extensible experience, while always falling back to a robust default implementation if no plugin is active or found.

The implementation will involve:

1.  **State Management Integration:** Adding `activeGameRule` (a string identifier) to the application's global state to precisely track the currently selected game rule.
2.  **Rule Logic Abstraction (`IGameRuleLogic`):** Defining a clear and comprehensive `IGameRuleLogic` interface. This interface will specify methods for:
    *   Influencing **character generation** (e.g., `getInitialProtagonistStats`, `modifyProtagonistPrompt`, `getAvailableRaces`, `getAvailableClasses`).
    *   Defining and resolving **action checks** (e.g., `getActionChecks`, `resolveCheck` using `CheckDefinition` and `CheckResult` types).
    *   Customizing **narration** based on events and check outcomes (e.g., `getNarrationPrompt`, `getCombatRoundNarration`).
3.  **Dynamic Rule Application:** Modifying the core game engine (`lib/engine.ts`) to:
    *   Retrieve the active `IGameRuleLogic` implementation (either from a plugin or the default).
    *   Dynamically apply the selected game rule's logic during key game phases, such as protagonist generation, action processing, and narrative generation.
4.  **User Interface for Selection:** Updating the `CharacterSelect` view to provide a user-friendly interface for:
    *   Discovering and displaying all available game rules (default and plugin-provided).
    *   Allowing users to select their preferred active game rule.
5.  **Plugin Extensibility:** Enhancing the `Plugin` interface to allow plugins to register their `IGameRuleLogic` implementation, thereby enabling them to provide custom game rule sets that seamlessly integrate with the core application.

## Detailed Plan with Reasoning:

This feature introduces a robust system for dynamic game rule selection, allowing the application to dynamically switch between different sets of game rules provided by plugins, influencing core game mechanics like character generation, action resolution (including checks), and narration. The implementation will leverage Waidrin's existing plugin framework and state management system.

### 1. Update `lib/schemas.ts`

*   **Action:** The `State` schema was updated to include `activeGameRule: z.string()` and `isCombat: z.boolean()`. Additionally, the types used by `generateProtagonistPrompt` and `narratePrompt` were refined to accept `initialProtagonistStats` and `checkResultStatements` respectively.
*   **Reasoning:**
    *   `activeGameRule` is essential for tracking the currently selected game rule, enabling the engine to dynamically load and apply the correct logic.
    *   `isCombat` provides a flag to differentiate between general narration and combat-specific narration, allowing for distinct narrative handling.
    *   The modifications to prompt-related types (`initialProtagonistStats`, `checkResultStatements`) enable game rule plugins to inject specific character attributes, background details, and check outcomes directly into the LLM prompts, thereby influencing character generation and narrative flow.

### 2. Update `lib/state.ts`

*   **Action:**
    *   `activeGameRule` was initialized to `"default"` in `initialState`.
    *   The `CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, and `IGameRuleLogic` interfaces were defined.
    *   The `Plugin` interface was extended with `getGameRuleLogic?(): IGameRuleLogic;`.
    *   The `PluginWrapper` interface was extended with `selectedPlugin?: boolean;`.
*   **Reasoning:**
    *   Initializing `activeGameRule` to `"default"` ensures a stable baseline for game mechanics if no other rule is explicitly selected.
    *   The new interfaces (`CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, `IGameRuleLogic`) formalize the contract between the core engine and game rule plugins. They define the structure for checks, character attributes, and the methods a game rule must implement to customize game behavior.
    *   Extending the `Plugin` interface with `getGameRuleLogic` provides a standard mechanism for plugins to expose their game rule logic to the main application.
    *   The `selectedPlugin` flag in `PluginWrapper` allows for explicit activation of a plugin's game rule logic, independent of the UI tab selection, offering greater flexibility.

### 3. Update `lib/engine.ts`

*   **Action:**
    *   `getDefaultGameRuleLogic()` and `getActiveGameRuleLogic()` functions were implemented.
    *   The `next()` function was modified to dynamically use the `getActiveGameRuleLogic()` for various game phases.
*   **Reasoning:**
    *   `getDefaultGameRuleLogic()` provides a robust fallback, ensuring the game always has a set of rules even without active plugins.
    *   `getActiveGameRuleLogic()` centralizes the logic for selecting the appropriate `IGameRuleLogic` implementation (prioritizing explicitly selected plugins, then the `activeGameRule`, and finally the default).
    *   The `next()` function's integration with `getActiveGameRuleLogic()` enables dynamic behavior across the game loop:
        *   **Character Generation:** `gameRuleLogic.getInitialProtagonistStats()` and `gameRuleLogic.modifyProtagonistPrompt()` are called to allow game rules to influence protagonist creation. (Implemented in D&D 5e plugin).
        *   **Action Resolution:** `gameRuleLogic.getActionChecks(action, state)` is called to determine required checks. This method is now `async` and leverages the LLM to interpret actions and return `CheckDefinition`s. (Implemented in D&D 5e plugin). For each `CheckDefinition`, `gameRuleLogic.resolveCheck(check, characterStats)` is called. (**Pending implementation in D&D 5e plugin**).
        *   **Narration Generation:** `gameRuleLogic.getNarrationPrompt(eventType, state, checkResultStatements)` is called to generate narrative. (**Pending implementation in D&D 5e plugin**).
        *   **Combat Narration:** If `state.isCombat` is true, `gameRuleLogic.getCombatRoundNarration(roundNumber, combatLog)` is called for combat-specific narration. (**Pending implementation in D&D 5e plugin**).

### 4. Update `views/CharacterSelect.tsx`

*   **Action:** The UI for game rule selection and display was modified to present available game rules and allow user selection.
*   **Reasoning:** The `CharacterSelect.tsx` view is the logical entry point for users to choose their desired game rule, as character generation is often tied to the rule set. The UI updates enable:
    *   **State Integration:** Destructuring `activeGameRule`, `plugins`, and `protagonist` from `useStateStore` for managing game rule information.
    *   **Context Access:** Instantiating `Context` to access `setPluginSelected` for UI control over plugin activation.
    *   **Tab and Toggle Handlers:** Implementing `handleTabChange` and `handlePluginSelectionToggle` to update `state.activeGameRule` and `selectedPlugin` status.
    *   **Dynamic Display:** Logic for `currentlySelectedPlugins` and `activeGameRuleDisplay` to show active rules.
    *   **Interactive Elements:** Utilizing `Tabs.Root`, `Tabs.Trigger`, `Tabs.Content`, `Switch` toggles, and a red light indicator for an intuitive user experience.

### 5. Plugin Developer's Perspective

For a plugin developer to create a custom game rule:

1.  **Implement `IGameRuleLogic`:** The plugin's main class (or a separate class within the plugin) must implement the `IGameRuleLogic` interface, providing concrete implementations for the desired methods.
    *   **Example (D&D 5e Plugin Status):**
        *   `getInitialProtagonistStats()`: **Implemented**. Uses `pluginPrompt.getProtagonistGenerationPrompt` and `backend.getNarration` to generate descriptive stats.
        *   `modifyProtagonistPrompt()`: **Implemented**. Calls `pluginPrompt.modifyProtagonistPromptForDnd`.
        *   `getActionChecks()`: **Implemented**. It is an `async` method that uses `pluginPrompt.getChecksPrompt` and `backend.getObject` to dynamically determine `CheckDefinition`s from the LLM.
        *   `resolveCheck()`: **Implemented**. Calls `resolveCheck` from `pluginData.ts`.
        *   `getNarrationPrompt()`: **Implemented**. Leverages `narratePrompt` from `lib/prompts.ts`.
        *   `getCombatRoundNarration()`: **Implemented**. Provides a basic narration string.
        *   `getAvailableRaces()`: **Pending Implementation**.
        *   `getAvailableClasses()`: **Pending Implementation**.
2.  **Expose via `Plugin` Interface:** The plugin's main class must return an instance of its `IGameRuleLogic` implementation via the `getGameRuleLogic()` method in its `Plugin` interface.
3.  **Register UI (Optional but Recommended):** To make the game rule selectable in the UI, the plugin should use `context.addCharacterUI()` to register a `CharacterUI` component. The `GameRuleName` provided during this registration should match the name used to identify the game rule (which will be stored in `state.activeGameRule`). Additionally, the `PluginWrapper` now includes a `selectedPlugin?: boolean` flag, which can be set via `context.setPluginSelected` to explicitly activate a plugin's game rule logic, overriding the `activeGameRule` based on tab selection.

### 6. Benefits

*   **Extensibility:** Allows for easy integration of new game rules via plugins without modifying core application logic.
*   **Flexibility:** Users can choose their preferred game rule, influencing character generation and other mechanics.
*   **Robustness:** Guarantees default behavior even when no game rule plugins are active or found.
*   **Modularity:** Clearly separates core game logic from plugin-specific rule implementations.
*   **Maintainability:** Centralizes game rule selection and application, simplifying future updates and additions.

### 7. Risks/Considerations
 
*   **Plugin Compatibility:** Ensuring that plugin-provided `IGameRuleLogic` implementations are compatible with the core engine's expectations.
*   **Error Handling:** Robust error handling within `getActiveGameRuleLogic()` and `next()` to gracefully manage cases where a plugin's `IGameRuleLogic` might be malformed or throw errors.
    *   **Error Handling Strategy:**
        *   **Centralized State Rollback (`lib/state.ts`):** The `setAsync` mechanism in `lib/state.ts` provides a robust `try...catch` block for all state updates. If an error occurs during a state update (including those triggered by plugin logic), the state will be rolled back to its last valid committed state, ensuring data consistency. Errors are then re-thrown for higher-level handling.
        *   **Plugin-Internal LLM Error Handling:** For LLM interactions within plugin methods (e.g., `getActionChecks`), the plugin itself is responsible for implementing `try...catch` blocks around LLM API calls and JSON parsing/validation.
             *   If the LLM response is invalid, unparseable, or does not conform to the expected schema, the plugin should **not** throw an error. Instead, it should return a "safe" default (e.g., an empty array for `CheckDefinition[]` from `getActionChecks`).
             *   This allows the core application to continue gracefully without interruption.
             *   Plugins should log these internal errors for debugging purposes.
        *   **Core Application Expectation:** The core application (e.g., in `lib/engine.ts`) will call plugin methods expecting these "safe" defaults in case of internal plugin errors.
        *   **Propagated Errors:** Errors that *do* propagate out of `next()` (e.g., unhandled exceptions from plugin logic, Zod validation failures) will be caught by the top-level `setAsync` mechanism and re-thrown. These should be caught and displayed to the user by the UI.
*   **Performance:** The impact of dynamically looking up and applying game rule logic on performance, especially if many plugins are loaded or logic is complex.
*   **User Experience:** Clear communication to the user about which game rule is active and how to switch between them.
*   **Data Migration:** If game rules introduce new character properties, consideration for how existing character data will be handled (e.g., default values for new properties).

### 8. How `IGameRuleLogic` influences narration (expanded):

*   **Action-based Narration with Checks:** When a player attempts an action (e.g., "sneak past the guard"), the `engine` will first consult the `activeGameRuleLogic` via `getActionChecks()` to determine if any skill checks are needed. The plugin's `getActionChecks` implementation will interpret the raw action and context (potentially using an LLM) to derive `CheckDefinition`s. If checks are required, the `engine` will then use `resolveCheck()` to perform these checks, leveraging the `rpg-dice-roller`. The `resolveCheck` method will return a *statement* describing the check's outcome and any consequences. This statement will then be directly incorporated into the core `narratePrompt()` function's output, allowing the game rule to dynamically describe the success, failure, or critical outcome of the action, making the story more interactive and responsive to player choices and character abilities.
*   **Combat Narration:** The `getCombatRoundNarration()` method provides a dedicated pathway for handling the narrative flow during combat. This allows game rules to define specific narrative structures for combat rounds, potentially including details about initiative, attacks, damage, and character actions within that round, distinct from the more free-form narration of exploration or social encounters.

### 9. Verification Steps (Post-Implementation):

*   **Build and Run Application:** Ensure the application builds successfully.
*   **Test Game Rule Selection:** Verify that selecting different game rules in the UI correctly changes the `activeGameRule` in the state.
*   **Test Protagonist Generation:** Confirm that protagonist generation (especially initial stats) is influenced by the active game rule (default or plugin-provided).
*   **Test Dynamic Narration:** Verify that the narration changes based on the selected game rule, reflecting the different storytelling styles or rule interpretations.
*   **Test Action Checks:** Verify that performing actions triggers appropriate checks, and that the narration reflects the success or failure of these checks.
*   **Test Combat Narration:** If a combat scenario can be simulated, verify that the narration during combat rounds uses the dedicated combat narration logic.
*   **Persistence Check:** Verify that the `activeGameRule` persists across sessions.