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

This feature aims to introduce a robust system for dynamic game rule selection, allowing the application to dynamically switch between different sets of game rules provided by plugins, influencing core game mechanics like character generation, action resolution (including checks), and narration. The implementation will leverage Waidrin's existing plugin framework and state management system.

### 1. Update `lib/schemas.ts`

*   **Action:** Add `activeGameRule: z.string()` to the `State` schema.
*   **Reasoning:** The `State` schema (`lib/schemas.ts`) defines the overall structure of the application's global state. To enable dynamic game rule selection, we need a persistent way to track which game rule is currently active. Adding `activeGameRule` as a `z.string()` ensures that this information is part of the validated global state, allowing it to be stored and retrieved reliably. This is a foundational step for any state-driven feature.

### 2. Update `lib/state.ts`

*   **Action 2.1:** Initialize `activeGameRule` to `"default"` in `initialState`.
    *   **Reasoning:** The `initialState` in `lib/state.ts` defines the default values for the application's state when it first loads or is reset. Setting `activeGameRule` to `"default"` ensures that the application always starts with a known, fallback game rule if no other rule is explicitly selected or persisted. This provides a stable baseline for the game mechanics.
*   **Action 2.2:** Define `CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, and the `IGameRuleLogic` interface.

    *   **Purpose of Each Interface:**
        *   **`CheckDefinition` Interface:** This interface defines the parameters for a specific check (e.g., a skill check, an attribute check). It specifies the type of check (e.g., "strength", "stealth"), a `difficultyClass` (the target number to beat), and optionally an `attribute` (e.g., "strength", "dexterity") if the check is tied to a character's stat. It acts as a blueprint for what needs to be evaluated.
            ```typescript
            export interface CheckDefinition {
              type: string; // e.g., "strength", "stealth", "perception"
              difficultyClass: number; // The target number to beat for a successful check.
              modifiers?: string[]; // Optional: The character attribute and modifiers relevant to the check (e.g., "strength", "dexterity").
            }
            ```
        *   **`CheckResult` Interface:** This interface captures the outcome of a `CheckDefinition` being resolved. It indicates `success` (boolean), provides a `message` describing the result, and can optionally include the `roll` value if a dice roll was involved. This structured result allows the narration engine to understand and describe the consequences of actions.
            ```typescript
            export interface CheckResult {
              success: boolean; // True if the check was successful, false otherwise.
              message: string; // A descriptive message about the check's outcome.
              roll?: number; // Optional: The result of the dice roll, if applicable.
            }
            ```
        *   **`RaceDefinition` Interface:** This interface expands on simply listing race names. It includes a `name` (e.g., "Elf") and a `description` (e.g., "Elves are long-lived, graceful beings, often associated with ancient forests and arcane arts..."). This description provides rich lore and narrative material that the AI can leverage during story generation, ensuring that racial context is woven into the plot and character interactions.
            ```typescript
            export interface RaceDefinition {
              name: string;
              description: string; // Lore or narrative material for the race
            }
            ```
        *   **`ClassDefinition` Interface:** Similar to `RaceDefinition`, this interface provides a `name` (e.g., "Wizard") and a `description` (e.g., "Wizards are highly respected and often viewed with a mix of awe and wariness, rarely socializing outside their arcane domains..."). This allows the AI to understand the social standing, common perceptions, and narrative implications of a character's class, enriching the story.
            ```typescript
            export interface ClassDefinition {
              name: string;
              description: string; // Lore or narrative material for the class
            }
            ```
        *   **`IGameRuleLogic` Interface:** This is the central interface that ties everything together. It defines a set of optional methods that any game rule (either the default or a plugin-provided one) can implement. These methods cover various aspects of game mechanics, from character generation to action resolution and narration. By implementing this interface, a game rule effectively tells the application "this is how I want things to work."
            ```typescript
            export interface IGameRuleLogic {
              /**
               * @method getInitialProtagonistStats
               * @description Provides a statement that augments the default prompt in `generateProtagonistPrompt`, influencing the protagonist's background, personality, and appearance based on the plugin's internal interpretation of stats.
               * This statement will be inserted into the `generateProtagonistPrompt` at a designated placeholder (e.g., `[PLUGIN_PROTAGONIST_DESCRIPTION]`).
               * (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
               * @returns {string} A statement to augment the protagonist generation prompt.
               */
              getInitialProtagonistStats?(): string;

              /**
               * @method modifyProtagonistPrompt
               * @description Alters the PC's background to better suit the game world (e.g., magic is very rare or this game world is mostly water).
               * @param {Prompt} originalPrompt - The original prompt for protagonist generation is read from core application and used as the basis to construct a modified prompt. 
               * (Note: The `Prompt` type is defined in `lib/prompts.ts` and has `system: string; user: string;` properties.)
               * @returns {Prompt} The modified prompt.
               */
              modifyProtagonistPrompt?(originalPrompt: Prompt): Prompt;

              /**
               * @method getAvailableRaces
               * @description Provides a list of available races for character creation, including lore for narration.
               * This can impact the character's backstory and story plots due to different race dynamics and world setting.
               * @returns {RaceDefinition[]} An array of race definitions.
               */
              getAvailableRaces?(): RaceDefinition[];

              /**
               * @method getAvailableClasses
               * @description Provides a list of available classes for character creation, including lore for narration.
               * This can influence the narration by providing game world flavor or attitude towards the PC's class (much like how people treat a doctor vs. a janitor).
               * @returns {ClassDefinition[]} An array of class definitions.
               */
              getAvailableClasses?(): ClassDefinition[];

              /**
               * @method getActionChecks
               * @description Specifies what checks are required for a given action, based on the action and current context.
               * This method is triggered when an action is passed to `narratePrompt`.
               * Its implementation will typically involve constructing an LLM prompt, making an API call, and parsing/validating the LLM's JSON response against the `CheckDefinition` schema.
               * @param {string} action - The raw action string performed by the protagonist.
               * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
               * @returns {CheckDefinition[]} An array of check definitions. If the LLM response is invalid or unparseable, an empty array should be returned as a graceful fallback.
               */
              getActionChecks?(action: string, context: WritableDraft<State>): CheckDefinition[];

              /**
               * @method resolveCheck
               * @description Resolves a game rule check, utilizing rpg-dice-roller, and returns the result.
               * @param {CheckDefinition} check - The definition of the check to resolve.
               * @param {Character} characterStats - The character's stats relevant to the check.
               * (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
               * @returns {string} A statement describing the check's result and any consequences.
               */
              * @description Resolves a game rule check, utilizing rpg-dice-roller, and returns the result as a statement.
               * The plugin will use its internal rules to determine the character's appropriate stat and skill modifier.
               * This statement will be incorporated into the `narratePrompt`'s output, typically after the action description.
               * @param {CheckDefinition} check - The definition of the check to resolve.
               * @param {Character} characterStats - The global `Character` object. The plugin will map this to its internal representation of the character's stats.
               *   (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
               * @returns {string} A statement describing the check's result and any consequences.
               */
              resolveCheck?(check: CheckDefinition, characterStats: Character): string;

              /**
               * @method getNarrationPrompt
               * @description Generates a narration prompt, influenced by the outcome of performed checks and consequences (e.g., HP, item, relationship, story/plot branch changes).
               * @param {string} eventType - The type of event triggering narration.
               * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
               * @param {string[]} [checkResultStatements] - Optional: Statements describing results of checks performed for the event, provided by `resolveCheck`.
               * @returns {string} The generated narration prompt.
               */
              getNarrationPrompt?(eventType: string, context: WritableDraft<State>, checkResultStatements?: string[]): string;

              /**
               * @method getCombatRoundNarration
               * @description A dedicated method for handling narration during combat rounds, allowing for different narrative structures and details compared to general scene narration.
               * @param {number} roundNumber - The current combat round number.
               * @param {string[]} combatLog - A minimal log of events that occurred in the combat round, e.g., ["Protagonist attacks Goblin for 5 damage.", "Goblin misses Protagonist."].
               * @returns {string} The narration for the combat round.
               */
              getCombatRoundNarration?(roundNumber: number, combatLog: string[]): string;
            }
            ```
    *   **Reasoning:** These interfaces are central to the dynamic game rule system. They formalize the contract between the core game engine and any game rule plugin. By defining these methods, we create clear extension points for plugins to inject their specific logic for character generation, action resolution, and narration. The optional `?` makes these methods flexible, allowing plugins to implement only the logic they need. This aligns with the plugin framework's goal of extensibility and modularity.
*   **Action 2.3:** Extend `Plugin` interface with `getGameRuleLogic?(): IGameRuleLogic;`.
    *   **Reasoning:** The `Plugin` interface in `lib/state.ts` defines the capabilities that any plugin can expose to the main application. By adding `getGameRuleLogic?()`, we provide a standard way for plugins to register their `IGameRuleLogic` implementation. The optional `?` ensures that not all plugins are required to provide game rule logic, maintaining flexibility. This is how the core application will discover and access the specific game rule logic provided by an active plugin.

    *   **Integration with the Plugin System:**
        The `IGameRuleLogic` interface is exposed through the existing `Plugin` interface in `lib/state.ts` via the new `getGameRuleLogic?(): IGameRuleLogic;` method.
        1.  **Plugin Registration:** When a plugin is loaded by `app/page.tsx`, if it implements `getGameRuleLogic()`, the application will be able to retrieve its specific game rule logic.
        2.  **Dynamic Discovery:** The application can iterate through its loaded and enabled plugins to identify all available game rules (those that provide an `IGameRuleLogic` implementation). This list will include the "default" rule set provided by the core application.

### 3. Update `lib/engine.ts`

*   **Action 3.1:** Implement `getDefaultGameRuleLogic()`.
    *   **Reasoning:** This function will provide a robust, default implementation of the `IGameRuleLogic` interface. It acts as a fallback if no plugin is active or if the active plugin does not provide its own game rule logic. This ensures that the game always has a set of rules to operate by, preventing errors and providing a consistent experience even without specialized game rule plugins.
*   **Action 3.2:** Implement `getActiveGameRuleLogic()`.
    *   **Reasoning:** This function will be responsible for retrieving the correct `IGameRuleLogic` implementation. It will first check if the `activeGameRule` in the global state corresponds to an enabled plugin that provides `IGameRuleLogic`. If so, it will return that plugin's logic. Otherwise, it will fall back to `getDefaultGameRuleLogic()`. This function centralizes the logic for selecting the active game rule, making it easy for other parts of the engine to use the correct rule set.
*   **Action 3.3:** Modify `next()` function to use `getActiveGameRuleLogic()`:
    *   **Flow within `lib/engine.ts`:** The `lib/engine.ts` file, which orchestrates the game's state machine, will be the primary consumer of `IGameRuleLogic`.
        *   **`activeGameRule` in State:** The `activeGameRule: z.string()` property in the global `State` (defined in `lib/schemas.ts` and initialized in `lib/state.ts`) will store the name of the currently selected game rule (e.g., "default", "dnd5e").
        *   **`getActiveGameRuleLogic()`:** A new helper function, `getActiveGameRuleLogic()`, will be implemented in `lib/engine.ts`. This function will:
            *   Read the `activeGameRule` from the global state.
            *   Search through the loaded plugins for one whose name matches `activeGameRule` and which provides an `IGameRuleLogic` implementation via `getGameRuleLogic()`.
            *   If a matching plugin is found, it will return that plugin's `IGameRuleLogic` instance.
            *   If no matching plugin is found (or if `activeGameRule` is "default"), it will return a `getDefaultGameRuleLogic()` implementation, ensuring a fallback.
        *   **`next()` Function Utilization:** The core `next()` function in `lib/engine.ts` will be modified to leverage the `getActiveGameRuleLogic()`:
            *   **Character Generation:** When the game is in the "character" view, `next()` will call `gameRuleLogic.getInitialProtagonistStats()` to get initial character attributes and `gameRuleLogic.modifyProtagonistPrompt()` to tailor the AI prompt for protagonist generation. This allows game rules to define how characters are created (e.g., stat generation methods, available races/classes with their descriptions).
            *   **Action Resolution:** When a user takes an action, `next()` will call `gameRuleLogic.getActionChecks(actionType, state)` to determine if any checks are required. For each `CheckDefinition` returned, it will then call `gameRuleLogic.resolveCheck(check, characterStats)` (utilizing the `rpg-dice-roller` internally) to get a `CheckResult`.
            *   **Narration Generation:** The `CheckResult` (and other context) will be passed to `gameRuleLogic.getNarrationPrompt(eventType, state, checkResults)` to generate the narrative. This allows the game rule to dynamically describe the success, failure, or critical outcome of actions, and to weave in the lore from `RaceDefinition` and `ClassDefinition` descriptions.
            *   **Combat Narration:** If the game enters a "combat" state, `next()` will call `gameRuleLogic.getCombatRoundNarration(roundNumber, combatLog)` to generate combat-specific narration, allowing for different narrative structures during combat.

### 4. Update `views/CharacterSelect.tsx`

*   **Action:** Modify UI for game rule selection and display. This will involve presenting the user with available game rules (either default or from loaded plugins) and allowing them to select one.
*   **Reasoning:** The `CharacterSelect.tsx` view is the logical place for users to choose their desired game rule, as character generation is often tied to the rule set. This step involves creating UI elements (e.g., dropdowns, radio buttons) to display the available game rules (which can be retrieved by iterating through `state.plugins` and checking for `getGameRuleLogic` implementations, plus the default). User selection will then update `state.activeGameRule`, triggering the dynamic behavior implemented in `lib/engine.ts`. This provides the user-facing control for the new feature.

    *   **User Interface (`views/CharacterSelect.tsx`):** The `views/CharacterSelect.tsx` component will be updated to provide the user interface for selecting the active game rule.
        1.  It will query the `usePluginsStateStore` (from `app/plugins.ts`) to get a list of all `CharacterUI` components provided by plugins. Each `CharacterUI` will implicitly represent a game rule if the plugin also provides `IGameRuleLogic`.
        2.  It will display these available game rules (including a "Default Rules" option) as selectable elements (e.g., tabs, dropdowns).
        3.  When a user selects a game rule, the UI will update the `activeGameRule` property in the global state (`state.activeGameRule = selectedRuleName`). This change will trigger the dynamic behavior in `lib/engine.ts` on subsequent game turns.

#### 4.5. Plugin Developer Impact

*   **Implementing `IGameRuleLogic`:** Plugin developers who wish to provide custom game rules will need to implement the `IGameRuleLogic` interface within their plugin and return an instance of it via the `getGameRuleLogic()` method in their main plugin class.
*   **Expose via `Plugin` Interface:** The plugin's main class must return an instance of its `IGameRuleLogic` implementation via the `getGameRuleLogic()` method in its `Plugin` interface.
*   **Register UI (Optional but Recommended):** To make the game rule selectable in the UI, the plugin should use `context.addCharacterUI()` to register a `CharacterUI` component. The `GameRuleName` for a plugin's game rule is typically defined in its `manifest.json` file. This name must be unique across all plugins and consistently used when registering both the `IGameRuleLogic` implementation and the `CharacterUI` component.
*   **Linking `GameRuleName` to `CharacterUI`:** The `GameRuleName` is passed as a property to the `CharacterUI` component registered via `context.addCharacterUI()`. This establishes the link between the UI and the specific game rule.
    *   **Example (Conceptual):**
    // Inside a plugin's main file (e.g., main.tsx or main.js)
    // Assuming 'context' is provided to the plugin's init method
    // and 'manifest' is accessible (e.g., loaded from manifest.json)

    const gameRuleName = manifest.name; // Or manifest.gameRuleName if a specific field

    // Register the game rule logic (assuming a method like addGameRuleLogic exists in context)
    context.addGameRuleLogic(gameRuleName, new MyGameRuleLogic());

    // Register the CharacterUI component, linking it to the game rule name
    context.addCharacterUI({
      name: gameRuleName, // This links the UI to the game rule
      component: MyCharacterUIComponent,
      // ... other CharacterUI properties
    });

### 5. Benefits

*   **Extensibility:** Allows for easy integration of new game rules via plugins without modifying core application logic.
*   **Flexibility:** Users can choose their preferred game rule, influencing character generation and other mechanics.
*   **Robustness:** Guarantees default behavior even when no game rule plugins are active or found.
*   **Modularity:** Clearly separates core game logic from plugin-specific rule implementations.
*   **Maintainability:** Centralizes game rule selection and application, simplifying future updates and additions.

### 6. Risks/Considerations
 
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

## How `IGameRuleLogic` influences narration (expanded):

*   **Action-based Narration with Checks:** When a player attempts an action (e.g., "sneak past the guard"), the `engine` will first consult the `activeGameRuleLogic` via `getActionChecks()` to determine if any skill checks are needed. The plugin's `getActionChecks` implementation will interpret the raw action and context (potentially using an LLM) to derive `CheckDefinition`s. If checks are required, the `engine` will then use `resolveCheck()` to perform these checks, leveraging the `rpg-dice-roller`. The `resolveCheck` method will return a *statement* describing the check's outcome and any consequences. This statement will then be directly incorporated into the core `narratePrompt()` function's output, allowing the game rule to dynamically describe the success, failure, or critical outcome of the action, making the story more interactive and responsive to player choices and character abilities.
*   **Combat Narration:** The `getCombatRoundNarration()` method provides a dedicated pathway for handling the narrative flow during combat. This allows game rules to define specific narrative structures for combat rounds, potentially including details about initiative, attacks, damage, and character actions within that round, distinct from the more free-form narration of exploration or social encounters.

## Plugin Developer's Perspective

For a plugin developer to create a custom game rule:

1.  **Implement `IGameRuleLogic`:** The plugin's main class (or a separate class within the plugin) must implement the `IGameRuleLogic` interface, providing concrete implementations for the desired methods (e.g., `getInitialProtagonistStats`, `getAvailableRaces`, `getActionChecks`).
2.  **Expose via `Plugin` Interface:** The plugin's main class must return an instance of its `IGameRuleLogic` implementation via the `getGameRuleLogic()` method in its `Plugin` interface.
3.  **Register UI (Optional but Recommended):** To make the game rule selectable in the UI, the plugin should use `context.addCharacterUI()` to register a `CharacterUI` component. The `GameRuleName` provided during this registration should match the name used to identify the game rule (which will be stored in `state.activeGameRule`).

In summary, these interfaces create a powerful, extensible system where game rules are no longer hardcoded but can be dynamically provided by plugins, significantly enhancing the application's flexibility and narrative depth.

## Verification Steps (Post-Implementation):

*   **Build and Run Application:** Ensure the application builds successfully.
*   **Test Game Rule Selection:** Verify that selecting different game rules in the UI correctly changes the `activeGameRule` in the state.
*   **Test Protagonist Generation:** Confirm that protagonist generation (especially initial stats) is influenced by the active game rule (default or plugin-provided).
*   **Test Dynamic Narration:** Verify that the narration changes based on the selected game rule, reflecting the different storytelling styles or rule interpretations.
*   **Test Action Checks:** Verify that performing actions triggers appropriate checks, and that the narration reflects the success or failure of these checks.
*   **Test Combat Narration:** If a combat scenario can be simulated, verify that the narration during combat rounds uses the dedicated combat narration logic.
*   **Persistence Check:** Verify that the `activeGameRule` persists across sessions.