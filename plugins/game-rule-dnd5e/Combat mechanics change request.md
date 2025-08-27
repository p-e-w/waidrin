## Combat Mechanics Change Request v3.1

This document outlines the refined plan for implementing combat mechanics, strictly adhering to the principle that all game and combat logic resides within the plugin, and the core application remains a narrator. This version incorporates significant changes in the responsibility of `resolveCheck` and `handleConsequence` to better align with D&D 5e combat flow and improve modularity.

### Core Principle and Design Rationale

**Core Principle:** The plugin will manage its own internal 'plotType' (e.g., general, combat, puzzle) and associated state. The core application will interact with the plugin through existing `IGameRuleLogic` methods, and the plugin's responses will implicitly define the current scenario.

#### Rationale for `plotType` and `encounter` Design

The design choice to introduce `plotType` and `encounter` within the plugin's settings, rather than a global `isCombat` flag or extending core application schemas, is driven by a strict adherence to the principle of **separation of concerns** and **plugin autonomy**.

**Why `plotType`?**

*   **Encapsulation of Game State:** The core application is designed to be a generic narrator, agnostic to the specific game rules or scenarios (e.g., combat, puzzle, social interaction). A global `isCombat` flag would force the core application to understand and react to a game-rule-specific state, violating this principle.
*   **Plugin-Driven Narrative Flow:** By having the plugin manage its `plotType` (e.g., "general", "combat", "puzzle", "chase", "roleplay", "shop"), the plugin itself dictates the current narrative context. The core application simply calls generic `IGameRuleLogic` methods like `getNarrativeGuidance()` and `getActions()`. The plugin's implementation of these methods then uses its internal `plotType` to determine the appropriate response (e.g., combat narration, puzzle-solving actions).
*   **Flexibility and Extensibility:** `plotType` allows the plugin to transition between various distinct game scenarios. A "romcom" game rule plugin, for instance, might define `plotType` values like "flirting", "date", or "breakup", each with its own specific narration and action generation logic, without the core application needing any awareness of these specific states.

**Why `encounter`?**

*   **Dynamic Scenario Data Container:** `encounter` serves as a generic, optional container within the plugin's settings to hold the specific, dynamic data relevant to the *currently active* `plotType`.
*   **"Nuke and Pave" for Active Scenarios:** This structure is designed for "per-confrontation" use. When a scenario (e.g., a battle) begins, `encounter` is populated with its specific data (e.g., `BattleSchema`). When the scenario concludes, `encounter` is cleared (set to `undefined`). This prevents the plugin's persistent state from becoming bloated with historical, turn-by-turn data, optimizing memory and performance.
*   **Example Scenario (Developer's Perspective):**
    1.  **Initial State:** `plotType` is "general", `encounter` is `undefined`.
    2.  **Action: "I open the door" (triggers combat):**
        *   The plugin's `getActionChecks()` identifies this as a combat-initiating action and returns a `CheckDefinition` of `type: "initiative"`.
        *   The plugin's `resolveCheck()` handles the "initiative" check. It then *internally* sets `this.settings.plotType = "combat"` and initializes `this.settings.encounter` with a `BattleSchema` object (containing combatants, HP, initiative order, etc.).
    3.  **Subsequent `getNarrativeGuidance()` call:**
        *   The core application calls `gameRuleLogic.getNarrativeGuidance()` (which now returns `Promise<string[]>`).
        *   The plugin's `getNarrativeGuidance()` implementation checks `this.settings.plotType`. Since it's "combat", it generates combat-specific narrative guidance (e.g., "PC1 swing did 5 dmg to monster2", "Monster 2 dodged") as a `string[]`. It also handles updating the internal battle object (stats, history).
    4.  **Subsequent `getActions()` call:**
        *   The core application calls `gameRuleLogic.getActions()`.
        *   The plugin's `getActions()` implementation checks `this.settings.plotType`. Since it's "combat", it returns combat-specific actions (e.g., "Attack", "Defend").
    5.  **Combat Ends (e.g., last enemy defeated):**
        *   During a `getNarrativeGuidance()` or `getActions()` call, the plugin's internal logic determines that combat conditions are no longer met (e.g., all enemies in `this.settings.encounter.combatants` are "dead").
        *   The plugin *internally* sets `this.settings.plotType = "general"` (or "aftermath") and clears `this.settings.encounter` (sets it to `undefined`).
        *   The next time `getNarrativeGuidance()` is called, it will generate post-combat narration (XP, loot, etc.) based on the just-concluded battle, and then revert to general narration. The core application remains unaware of the internal state transitions.

### Implementation Changes

This section details the modifications to the core application files and the D&D 5e plugin, focusing on how new data structures and updated logic work together to implement the refined combat mechanics.

#### 1. Rename `getNarrationPrompt` to `getNarrativeGuidance` and Consolidate Narration Logic

To better reflect its role and consolidate narration logic within the plugin, the `getNarrationPrompt` method will be renamed to `getNarrativeGuidance`. This change also involves integrating combat narration logic directly into `getNarrativeGuidance`, removing the separate `getCombatRoundNarration` method from `IGameRuleLogic`.

*   **`lib/state.ts`:**
    *   Rename `getNarrationPrompt?(...)` to `getNarrativeGuidance?(...)` in the `IGameRuleLogic` interface.
    *   Remove `getCombatRoundNarration?(...)` from the `IGameRuleLogic` interface.
    *   **NEW:** Define `CheckResolutionResult` interface:
        ```typescript
        export interface CheckResolutionResult {
          resultStatement: string; // The factual outcome of the check (e.g., "You passed the check").
          consequencesApplied?: string[]; // Optional: A list of high-level consequences applied (e.g., "Goblin 1 took 15 damage", "Goblin 1 is dead", "Longsword broke").
        }
        ```
    *   Refine `resolveCheck` in `IGameRuleLogic` to return `Promise<CheckResolutionResult>` and accept `context: WritableDraft<State>` and `action?: string` as parameters.
    *   **NEW:** Add `handleConsequence` to `IGameRuleLogic` with signature `handleConsequence?(eventType: string, checkResultStatements?: string[], action?: string): void;`.

*   **`lib/engine.ts`:**
    *   Update the default implementation of `getNarrationPrompt` to `getNarrativeGuidance` in `getDefaultGameRuleLogic()`.
    *   Modify the `narrate()` function to *always* call `gameRuleLogic.getNarrativeGuidance(eventType, context, checkResolutionResults, action)`.
    *   Remove the conditional branching based on `state.isCombat` and the direct calls to `gameRuleLogic.getCombatRoundNarration()`. The `string[]` returned by `getNarrativeGuidance` will always be passed to `lib/prompts.ts/narratePrompt`.
    *   Update the call to `gameRuleLogic.resolveCheck` to pass `context` and `action`, and expect `CheckResolutionResult` as the return type.
    *   Adjust the call to `gameRuleLogic.getNarrationPrompt` (which is `getNarrativeGuidance`) to pass the `CheckResolutionResult` (or its relevant parts) instead of `checkResultStatements`.

*   **`lib/prompts.ts`:**
    *   No direct changes to `lib/prompts.ts` are required, as `narratePrompt` already accepts `checkResultStatements: string[]`. The change is in *what* `getNarrativeGuidance` provides to it.

*   **`plugins/game-rule-dnd5e/src/main.tsx`:**
    *   Rename the implementation of `getNarrationPrompt` to `getNarrativeGuidance`.
    *   Integrate the logic of `getCombatRoundNarration` directly into `getNarrativeGuidance`.
    *   Inside `getNarrativeGuidance`, check `this.settings.plotType`:
        *   If `this.settings.plotType` is "combat", generate combat-specific narrative guidance (e.g., "PC1 swing did 5 dmg to monster2", "Monster 2 dodged") as a `string[]`.
        *   If `this.settings.plotType` is "general" (or any other plot type), generate general narrative guidance as a `string[]`.
    *   Remove the separate `getCombatRoundNarration` implementation.
    *   Redefine `resolveCheck` implementation:
        *   It will now be `async`.
        *   It will take `check: CheckDefinition`, `characterStats: Character`, `context: WritableDraft<State>`, and `action?: string` as parameters.
        *   It will call `resolveCheckFromPluginData` to get the basic `resultStatement` (factual outcome of the check).
        *   **Crucially, it will then perform subsequent checks/actions (e.g., damage roll if "to-hit" was successful) and call `this.handleConsequence` internally to apply all immediate state changes.**
            *   Example: If a "to-hit" check succeeds, `resolveCheck` will then trigger a "damage" calculation and call `handleConsequence` to reduce the target's HP. If HP drops to 0 or below, `handleConsequence` will update the combatant's status to "dead."
            *   Example: If a "critical miss" occurs on an attack roll, `resolveCheck` could also trigger `handleConsequence` to apply negative consequences (e.g., weapon breakage, inventory update).
        *   It will return a `CheckResolutionResult` object containing:
            *   `resultStatement`: A factual statement about the initial check's outcome (e.g., "Protagonist hit Goblin 1").
            *   `consequencesApplied`: A list of high-level, factual descriptions of the state changes that `handleConsequence` just applied (e.g., "Goblin 1 took 15 damage", "Goblin 1 is dead", "Longsword broke"). This list is crucial for `getNarrativeGuidance`.
*   **`handleConsequence()`:**
    *   **NEW:** Implement `handleConsequence`:
        *   **New Signature:** `handleConsequence(eventType: string, checkResultStatements?: string[], action?: string): void`
    *   **Clarified Role:** This new method will be called *internally* by `resolveCheck`. It is solely responsible for modifying the plugin's internal state (`this.settings.encounter`, `this.settings.plotType`, inventory, etc.) based on the factual `checkResultStatements` and other context provided by `resolveCheck`. It *must not* return any narrative strings.
*   Update `getNarrativeGuidance` implementation:
        *   It will receive `checkResolutionResults?: CheckResolutionResult[]` (or a similar structure) from `lib/engine.ts`.
        *   It will use the `resultStatement` and `consequencesApplied` (from `CheckResolutionResult`), along with the *already updated* internal plugin state (modified by `handleConsequence` via `resolveCheck`), to generate rich narration via the LLM.

#### 2. Core Application Changes (`lib/` directory)

This section details the modifications to the core application files within the `lib/` directory, focusing on changes related to state management, engine logic, and prompt generation.

##### 2.1. State and Schema Updates (`lib/schemas.ts`, `lib/state.ts`)

This subsection describes changes to the core application's state schema and initial state, and additions to the `IGameRuleLogic` interface.

*   **Schema Update:**
    *   **`lib/schemas.ts`:** Remove `isCombat: z.boolean()` from the `State` schema.

*   **Stat Update:**
*   **`lib/state.ts`:** Remove `isCombat: false` from `initialState`.
*   **Add `getActions?(): Promise<string[]>;` to `IGameRuleLogic`:** This method will now be responsible for providing actions regardless of the plot type. Its implementation in the plugin will decide whether to return combat-specific actions or general actions based on its internal `plotType`.
    ```typescript
    getActions?(): Promise<string[]>;
    ```
    *   **Reasoning for Addition:** This method is crucial for enabling plugins to dynamically control the actions available to the player based on the current game scenario (e.g., combat, puzzle, social encounter). By delegating action generation to the plugin, the core application remains generic and unaware of game-rule-specific action sets, ensuring true separation of concerns. The plugin's `getActions` method is intended to derive its context for action generation from its own internal state (`this.settings.plotType` and `this.settings.encounter`), rather than from the global `StoredState`. This change strengthens the separation of concerns, reduces coupling between the plugin and the core application's state structure, and improves the clarity and testability of the `IGameRuleLogic` interface.

##### 2.2. Engine Logic Updates (`lib/engine.ts`)

This subsection outlines the changes to the core application's engine logic, specifically how it interacts with game rules and handles combat-related behavior.

*   **No `isCombat` flag to check.** The logic will rely entirely on the plugin's `getNarrativeGuidance` and `generateActionsPrompt` (which will call `gameRuleLogic.getActions()`) to determine combat-related behavior.
*   The detection of `type: "initiative"` `CheckDefinition` will still occur. Its purpose will be solely to trigger the plugin’s internal `plotType` transition to "combat" and combat state initialization.
*   The engine will *always* call `gameRuleLogic.getNarrativeGuidance(eventType, context, checkResolutionResults, action)` and `generateActionsPrompt(state)` (which will call `gameRuleLogic.getActions()`). The plugin's response will implicitly define the current scenario.

##### 2.3. Prompt Generation Updates (`lib/prompts.ts`)

This subsection describes modifications to the prompt generation logic within the core application.

*   **`generateActionsPrompt`:** This function will be modified to call `gameRuleLogic.getActions()` *if the plugin's `getGameRuleLogic` method exists and has a `getActions` method*. It will *not* check any global `isCombat` flag or `plotType`.
    *   **Reasoning for Modification:** The core application (`lib/prompts.ts`) should remain generic and unaware of specific game scenarios (like combat or puzzles). The decision of what actions are available to the player in a given context must be delegated to the game rule plugin. By modifying `generateActionsPrompt` to call `gameRuleLogic.getActions()`, the plugin gains full control over the list of actions presented to the player. The plugin's `getActions` method can then use its internal `plotType` (e.g., "combat") to return scenario-specific actions (e.g., "Attack", "Defend") or general actions, ensuring the core app remains decoupled from game-specific logic.

#### 3. Plugin-Specific Changes (`plugins/game-rule-dnd5e`)

This section details the modifications and additions within the `game-rule-dnd5e` plugin, focusing on how new data structures and updated logic work together to implement the refined combat mechanics.

##### 3.1. Data Structures (`src/pluginData.ts`)

This subsection describes the new and modified data schemas that underpin the plugin's internal state management for combat and plot types.

*   **Define `PlotType` Enum/Schema:**
    ```typescript
    export const PlotType = z.enum(["general", "combat", "puzzle", "chase", "roleplay", "shop"]);
    export type PlotType = z.infer<typeof PlotType>;
    ```
    *   *Usage Note:* This `plotType` will be used by logic in `src/main.tsx` (see Section 6.2) to determine the current game scenario and influence narrative generation and available actions.

*   **`CombatantSchema`:** This schema describes individual participants in combat, linking them to the main application's `Character` objects via `characterIndex`. It includes combat-specific attributes like HP, status, and initiative.
    ```typescript
    export const CombatantSchema = z.object({
      characterIndex: z.number().int(), // Link to state.characters by index
      currentHp: z.number().int(),
      maxHp: z.number().int(),
      status: z.enum(["active", "unconscious", "dead", "fled"]),
      initiativeRoll: z.number().int(),
    });

    export type Combatant = z.infer<typeof CombatantSchema>;
    ```
##### Combatant Status Management and State Machine

The `status` field within the `CombatantSchema` represents the current condition of a combatant and is crucial for managing the flow of combat. The possible states are:

*   **`active`**: The combatant is conscious, able to act, and participating in combat.
*   **`unconscious`**: The combatant has dropped to 0 hit points but is not yet dead. They are incapacitated and cannot take actions. This state typically transitions to `dead` after failing death saving throws, or back to `active` if healed.
*   **`unconscious` -> `dead`**: Occurs after a combatant fails a specified number of death saving throws (typically three in D&D 5e) or takes massive damage while unconscious.
*   **`unconscious` -> `active`**: Occurs if a combatant receives healing while unconscious.
*   **`active` -> `fled`**: Occurs when a combatant successfully disengages from combat and moves out of the encounter area, often after a successful escape attempt check.
*   **`dead` or `fled`**: These are terminal states for the current combat encounter; combatants in these states do not typically transition back to `active` within the same encounter.


*   **Define `BattleSchema`:** This schema encapsulates the overall state of a combat encounter, including the current round, all active combatants, and a log of combat events.
    ```typescript
    export const BattleSchema = z.object({
      roundNumber: z.number().int(),
      combatants: z.array(CombatantSchema),
      combatLog: z.array(z.string()),
      activeTurnCombatantIndex: z.number().int().optional(), // Index of the Combatant whose turn it is in the combatants array.
    });

    export type Battle = z.infer<typeof BattleSchema>;
    ```
    *   *Usage Note:* This `BattleSchema` will be used by logic in `src/main.tsx` (see Section 6.2), particularly within `resolveCheck` and `handleConsequence`, to manage the detailed state of combat encounters.

*   **`DndStatsSettingsSchema`:**
    *   **Add `plotType: PlotType.default("general")` and `encounter: BattleSchema.optional()` to this schema.**
    *   The `encounter` property will be optional and will hold the `BattleSchema` data when `plotType` is "combat".
    ```typescript
    export const DndStatsSettingsSchema = z.object({
      // ... existing dnd stats (strength, dexterity, etc.)
      plotType: PlotType.default("general"), // Default to general
      encounter: BattleSchema.optional(), // Holds battle data when plotType is "combat"
    });
    ```

##### 3.2. Core Logic (`src/main.tsx`)

This subsection outlines the changes to the main logic functions within the plugin, demonstrating how they interact with the data structures defined above to manage game flow and combat.

*   **`getActionChecks()`:** Will return `CheckDefinition`s, including `type: "initiative"` when combat is triggered.
    *   *Interaction with Data:* This function may trigger changes to `this.settings.plotType` and `this.settings.encounter` via `resolveCheck` when an initiative check is returned.

*   **`resolveCheck()`:**
    *   **New Signature:** `async resolveCheck(check: CheckDefinition, characterStats: Character, context: WritableDraft<State>, action?: string): Promise<CheckResolutionResult>`
    *   **New Responsibilities:**
        *   Perform the initial check (e.g., "to-hit" roll) using `resolveCheckFromPluginData`.
        *   Based on the outcome of the initial check (hit, miss, critical hit, critical miss), determine and calculate subsequent consequences (e.g., damage roll if "to-hit" was successful, weapon breakage on critical miss).
        *   **Introduce a call to `this.handleConsequence` internally** to apply all immediate state changes resulting from the check and its consequences (e.g., HP reduction, status changes like "dead," inventory updates).
        *   Construct and return a `CheckResolutionResult` object containing:
            *   `resultStatement`: A factual statement about the initial check's outcome (e.g., "Protagonist hit Goblin 1").
            *   `consequencesApplied`: A list of high-level, factual descriptions of the state changes that `handleConsequence` just applied (e.g., "Goblin 1 took 15 damage", "Goblin 1 is dead", "Longsword broke"). This list is crucial for `getNarrativeGuidance`.
    *   *Interaction with Data:* This function directly manipulates the plugin's internal state (`this.settings.plotType` and `this.settings.encounter`) by calling `this.handleConsequence`.

*   **`handleConsequence()`:**
    *   **NEW:** Implement `handleConsequence`:
        *   **New Signature:** `handleConsequence(eventType: string, checkResultStatements?: string[], action?: string): void`
    *   **Clarified Role:** This new method will be called *internally* by `resolveCheck`. It is solely responsible for modifying the plugin's internal state (`this.settings.encounter`, `this.settings.plotType`, inventory, etc.) based on the factual `checkResultStatements` and other context provided by `resolveCheck`. It *must not* return any narrative strings.
    *   *Interaction with Data:* This function is the primary mechanism for updating `this.settings.encounter` and `this.settings.plotType` based on game events.

*   **`getNarrativeGuidance()`:**
    *   **New Signature:** `async getNarrativeGuidance(eventType: string, context: WritableDraft<State>, checkResolutionResults?: CheckResolutionResult[], action?: string): Promise<string[]>`
    *   **Clarified Role:** This method will receive the `CheckResolutionResult[]` (or a similar structure) from `lib/engine.ts`. It will use the `resultStatement` and `consequencesApplied` (from `CheckResolutionResult`), along with the *already updated* internal plugin state (modified by `handleConsequence` via `resolveCheck`), to generate rich narration via the LLM.
    *   *Interaction with Data:* This function reads `this.settings.plotType` and `this.settings.encounter` to generate context-aware narration.

*   **`getActions()`:**
    *   This method will check `this.settings.plotType`.
    *   If `this.settings.plotType` is "combat", it will return combat-specific actions.
    *   Otherwise, it will return general actions.
    *   *Interaction with Data:* This function directly relies on `this.settings.plotType` to determine the set of available actions.

### Detailed Combat Flow Scenario Walkthrough

This section walks through a combat scenario, illustrating how the planned changes to the core application and the D&D 5e plugin will interact to manage the combat lifecycle.

---

**Scenario Start: Talking in a room, trying to find a secret door.**

**Action 1: Player inputs "I detect trap to find a secret door"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I detect trap to find a secret door", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "dexterity", difficultyClass: 10, modifiers: ["perception"] }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "dexterity", difficultyClass: 10, modifiers: ["perception"] }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Dexterity (Perception) check (e.g., rolls 6, protagonist's Dex modifier is +6, total 12).
    *   **Internally calls `this.handleConsequence("check_resolved", ["The protagonist successfully passed the Dexterity (Perception) check (DC 10) with a roll of 6 and a total of 12."], action)`.**
    *   Returns `CheckResolutionResult`: `{ resultStatement: "The protagonist successfully passed the Dexterity (Perception) check (DC 10) with a roll of 6 and a total of 12.", consequencesApplied: [] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("general", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. Since it's "general", it proceeds with general narration.
    *   Generates a prompt for the LLM, incorporating the `resultStatement` from `checkResolutionResult`.
    *   Returns the narration: "You successfully found a secret door, and it has many symbols on it."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions()`.
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's "general", it returns general actions.
10. **`lib/engine.ts`:**
    *   Displays the general actions to the player.

---

**Action 2: Player inputs "I open the door"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I open the door", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "strength", difficultyClass: 5, modifiers: ["athletics"] }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "strength", difficultyClass: 5, modifiers: ["athletics"] }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Strength (Athletics) check (e.g., rolls 1, protagonist's Str modifier is +4, total 5).
    *   **Internally calls `this.handleConsequence("check_resolved", ["You critically fumbled the Strength (Athletics) check (DC 5) with a roll of 1 and a total of 5."], action)`.**
    *   **Crucial Consequence - Ambush Trigger:** `handleConsequence`'s internal logic will determine that a critical fumble on opening a door can lead to an ambush. This is *not* yet combat, but it might set up a future `plotType` transition if the player chooses to engage.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "You critically fumbled the Strength (Athletics) check (DC 5) with a roll of 1 and a total of 5.", consequencesApplied: ["An ambush is triggered!"] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("general", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. It's still "general".
    *   Generates a prompt for the LLM, incorporating the `resultStatement` and `consequencesApplied` from `checkResolutionResult`.
    *   The LLM's response (guided by the prompt and check results) will describe the ambush.
    *   Returns the narration: "You fumble opening the door and fell over to the other side, revealing a group of ambushing goblins who snarl and raise their crude weapons."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions()`.
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's "general", it returns general actions.
    *   The LLM (guided by the prompt and the recent ambush narration) will suggest actions like "Try to get up and fight", "Flee", "Negotiate".
    *   Returns these actions.
10. **`lib/engine.ts`:**
    *   Displays the suggested actions to the player.

---

**Action 3: Player inputs "I try to get up and fight"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I try to get up and fight", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "dexterity", difficultyClass: 15, modifiers: ["acrobatics"] }, { type: "initiative" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "dexterity", difficultyClass: 15, modifiers: ["acrobatics"] }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Dexterity (Acrobatics) check (e.g., rolls 6, protagonist's Dex modifier is +6, total 12 - a failure).
    *   **Detects the `type: "initiative"` `CheckDefinition`.**
    *   **Internally calls `this.handleConsequence("initiative_triggered", ["Despite struggling to get up, combat begins! The initiative order is: [List of combatants and their initiative scores, e.g., Goblin 1 (17), Conan The Great (15), Goblin 2 (13), Goblin 3 (12), Goblin 4 (8)]."], action)`.**
        *   `handleConsequence` will:
            *   Set `this.settings.plotType = "combat"`.
            *   Initialize `this.settings.encounter` (a `Battle` object) with `roundNumber: 1`, `combatants` (protagonist and enemies with HP, initiative), and `combatLog: ["Combat initiated."]`
            *   Perform initiative rolls for all combatants and sort them.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "You struggled to get back up, failing the Dexterity (Acrobatics) check (DC 15) with a roll of 6 and a total of 12.", consequencesApplied: ["Combat initiated! Initiative order determined."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("general", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. It is now "combat".
    *   Generates narration for the start of combat and the first turn, incorporating the `resultStatement` and `consequencesApplied` from `checkResolutionResult`, using `this.settings.encounter` to determine the current turn.
    *   Returns the narration: "You struggle to regain your footing, but the goblins are already upon you! Combat begins! Goblin 1 snarls and lunges forward..."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions()`.
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's "combat", it returns combat-specific actions: `["Attack", "Defend", "Flee"]`.
10. **`lib/engine.ts`:**
    *   Displays the combat actions to the player.

---

**Combat Loop: "I attack Goblin 4"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action` ("I attack Goblin 4").
    *   Calls `gameRuleLogic.getActionChecks("I attack Goblin 4", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "melee_attack", target: "Goblin 4" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "melee_attack", target: "Goblin 4" }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the melee attack roll (e.g., Protagonist rolls 15, hits Goblin 4's AC).
    *   Calculates damage (e.g., 1d8+3 slashing damage, rolls 7, total 10).
    *   **Internally calls `this.handleConsequence("damage_dealt", ["Protagonist dealt 10 slashing damage to Goblin 4."], action)`.**
        *   `handleConsequence` will:
            *   Update Goblin 4's `currentHp` in `this.settings.encounter.combatants`.
            *   Add entry to `this.settings.encounter.combatLog`.
            *   Advance the turn order and `roundNumber` within `this.settings.encounter`.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "Protagonist hit Goblin 4 for 10 slashing damage.", consequencesApplied: ["Goblin 4 took 10 damage."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("combat_round", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. ("combat").
    *   Generates narration for the current combat round, including actions by player and enemies, and their effects, based on the `resultStatement` and `consequencesApplied` from `checkResolutionResult` and the *already updated* `this.settings.encounter`.
    *   Returns the narration: "Your longsword slices into Goblin 4, dealing 10 damage. Goblin 4 stumbles back, wounded."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Calls `gameRuleLogic.getActions()`.
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's "combat", it returns combat-specific actions.
10. **`lib/engine.ts`:**
    *   Displays the combat actions to the player.

---

**Combat End: Player inputs "I swing my sword at the last goblin"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action` ("I swing my sword at the last goblin").
    *   Calls `gameRuleLogic.getActionChecks("I swing my sword at the last goblin", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Returns `[{ type: "melee_attack", target: "Goblin 4" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "melee_attack", target: "Goblin 4" }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the melee attack roll (e.g., Protagonist rolls 18, hits Goblin 4's AC).
    *   Calculates damage (e.g., 1d8+3 slashing damage, rolls 8, total 11).
    *   **Internally calls `this.handleConsequence("damage_dealt", ["Protagonist dealt 11 slashing damage to Goblin 4."], action)`.**
        *   `handleConsequence` will:
            *   Update Goblin 4's `currentHp` in `this.settings.encounter.combatants` (Goblin 4's HP goes to -5, `status: "dead"`).
            *   Add entry to `this.settings.encounter.combatLog`.
            *   **Crucial Step - Combat End Detection:** `handleConsequence`'s internal logic checks `this.settings.encounter.combatants` and finds all enemies are "dead".
            *   **Sets `this.settings.plotType = "general"`** (or "aftermath").
            *   **Clears `this.settings.encounter = undefined`**.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "Protagonist hit Goblin 4 for 11 slashing damage, killing it.", consequencesApplied: ["Goblin 4 is dead.", "Combat ends."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("combat_end", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. It is now "general".
    *   Generates post-combat narration, including XP calculation, treasure drop, and story progression details, based on the `resultStatement` and `consequencesApplied` from `checkResolutionResult` and the *already updated* `this.settings.encounter`.
    *   Returns the narration: "That was the last goblin. Combat ends. You gain 100 XP and find a rusty dagger on the goblin's corpse. The path ahead is now clear."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Calls `gameRuleLogic.getActions()` (which now returns general actions).
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's now "general", it returns general actions.
10. **`lib/engine.ts`:**
    *   Displays the general actions to the player.

---

#### Expanded Play Scenarios

The following mini-scenarios are proposed to cover common D&D combat situations and player choices not fully detailed in the current walkthrough. Each scenario follows the established format, demonstrating how the new `getNarrativeGuidance`-centric system handles these situations.

---

**Scenario A: Critical Success on an Attack Roll**

*   **Context:** Player is in combat, it's their turn.
*   **Player Action:** "I attack Goblin 1 with my longsword!"

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I attack Goblin 1 with my longsword!", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "melee_attack", target: "Goblin 1" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "melee_attack", target: "Goblin 1" }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the melee attack roll (e.g., Protagonist rolls a natural 20, hits Goblin 1's AC).
    *   **Detects Critical Hit.** Rolls damage dice twice (e.g., 2d8+3 slashing damage, rolls 7 and 5, total 15).
    *   **Internally calls `this.handleConsequence("damage_dealt", ["Protagonist scored a critical hit on Goblin 1 for 15 slashing damage, killing it instantly!"], action)`.**
        *   `handleConsequence` will:
            *   Update Goblin 1's `currentHp` in `this.settings.encounter.combatants` (Goblin 1's HP goes to -5, `status: "dead"`).
            *   Add entry to `this.settings.encounter.combatLog`.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "Protagonist scored a critical hit on Goblin 1 for 15 slashing damage, killing it instantly!", consequencesApplied: ["Goblin 1 is dead."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("combat_round", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. ("combat").
    *   Generates a dramatic narration reflecting the critical hit and Goblin 1's demise, incorporating the `resultStatement` and `consequencesApplied` from `checkResolutionResult`.
    *   Returns the narration: "Your longsword flashes, finding a gap in Goblin 1's crude armor. The blade sinks deep, and the goblin gurgles, collapsing lifelessly to the ground. One less foe!"
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks `this.settings.plotType`. ("combat").
    *   Returns combat-specific actions.

---

**Scenario B: Player Attempts to Flee Combat**

*   **Context:** Player is in combat (e.g., after Action 3).
*   **Player Action:** "I disengage and run back through the secret door!"

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I disengage and run back through the secret door!", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "dexterity", difficultyClass: 10, modifiers: ["acrobatics"] }, { type: "escape_attempt" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "dexterity", difficultyClass: 10, modifiers: ["acrobatics"] }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs Dexterity (Acrobatics) check (e.g., rolls 15, total 18 vs. DC 10 - success).
    *   Performs "escape_attempt" check (e.g., custom check, succeeds).
    *   **Internally calls `this.handleConsequence("escape_attempt", ["You successfully disengaged and escaped combat."], action)`.**
        *   `handleConsequence` will:
            *   Detects successful escape attempt.
            *   Sets `this.settings.plotType = "general"`.
            *   Clears `this.settings.encounter = undefined`.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "You successfully disengaged and escaped combat.", consequencesApplied: ["Combat ended."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("general", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. Since it's now "general", it generates narration reflecting the escape, incorporating the `resultStatement` and `consequencesApplied` from `checkResolutionResult`.
    *   Returns the narration: "You deftly tumble away from the goblins, darting back through the secret door before they can react. The sounds of their frustrated snarls fade behind you as you make your escape."

---

**Scenario C: Player Uses a Spell in Combat**

*   **Context:** Player is in combat, it's their turn.
*   **Player Action:** "I cast Fire Bolt at Goblin 2!"

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I cast Fire Bolt at Goblin 2!", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Interprets the action.
    *   Returns `[{ type: "spell_attack", spell: "Fire Bolt", target: "Goblin 2" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck({ type: "spell_attack", spell: "Fire Bolt", target: "Goblin 2" }, state.protagonist, state, action)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs spell attack roll (e.g., Protagonist's spell attack bonus +5. Rolls a d20, gets 14, total 19 vs. Goblin 2's AC 13 - hit).
    *   Rolls damage (e.g., 1d10 fire damage, rolls 6).
    *   **Internally calls `this.handleConsequence("damage_dealt", ["Your Fire Bolt strikes Goblin 2 for 6 fire damage!"], action)`.**
        *   `handleConsequence` will:
            *   Update Goblin 2's `currentHp` in `this.settings.encounter.combatants`.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "Your Fire Bolt strikes Goblin 2 for 6 fire damage!", consequencesApplied: ["Goblin 2 took 6 fire damage."] }`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("combat_round", state, [checkResolutionResult], action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. ("combat").
    *   Generates narration describing the spell being cast, its effect, and Goblin 2's reaction, incorporating the `resultStatement` and `consequencesApplied` from `checkResolutionResult`.
    *   Returns the narration: "A searing bolt of fire erupts from your hand, streaking across the room to engulf Goblin 2. It shrieks as the flames lick at its crude armor."

---

**Scenario D: Enemy Turn and Player Takes Damage/Becomes Unconscious**

*   **Context:** During the "Combat Loop," it's an enemy's turn.
*   **No Player Action:** This is an internal turn managed by the plugin.

1.  **`lib/engine.ts` (`next()` function):**
    *   (This call is triggered by the engine's turn progression, not a player action).
    *   Calls `gameRuleLogic.resolveCheck` (internally, for the enemy's attack).
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   **Determines it's Goblin 1's turn (based on `this.settings.encounter.activeTurnCombatantIndex`).**
    *   **Performs Goblin 1's attack roll** (e.g., Goblin 1's attack bonus +4. Rolls a d20, gets 17, total 21 vs. Protagonist's AC 15 - hit).
    *   **Rolls damage** (e.g., 1d6+2 piercing damage, rolls 5, total 7).
    *   **Internally calls `this.handleConsequence("damage_taken", ["Goblin 1 dealt 7 piercing damage to Protagonist."], undefined)`.**
        *   `handleConsequence` will:
            *   Update Protagonist's `currentHp` in `this.settings.encounter.combatants`.
            *   If Protagonist's `currentHp` drops to 0, sets Protagonist's `status` to "unconscious" and initiates death saving throws (internal plugin state).
            *   Add entry to `this.settings.encounter.combatLog`.
            *   Advance `this.settings.encounter.activeTurnCombatantIndex` to the next combatant.
    *   Returns `CheckResolutionResult`: `{ resultStatement: "Goblin 1 hit Protagonist for 7 piercing damage.", consequencesApplied: ["Protagonist took 7 damage.", "Protagonist is unconscious."] }`.
3.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrativeGuidance("combat_round", state, [checkResolutionResult], undefined)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrativeGuidance()`):**
    *   Checks `this.settings.plotType`. ("combat").
    *   Generates narration: "Goblin 1 lunges at you, its crude scimitar flashing! It strikes your arm, dealing 7 piercing damage. The blow sends you reeling, and darkness consumes your vision as you collapse to the ground, unconscious."
