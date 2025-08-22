## Combat Mechanics Change Request

This document outlines the refined plan for implementing combat mechanics, strictly adhering to the principle that all game and combat logic resides within the plugin, and the core application remains a narrator.

**Core Principle:** The plugin will manage its own internal 'plotType' (e.g., general, combat, puzzle) and associated state. The core application will interact with the plugin through existing `IGameRuleLogic` methods, and the plugin's responses will implicitly define the current scenario.

### 1. Remove `isCombat` from Core State

*   **`lib/schemas.ts`:** Remove `isCombat: z.boolean()` from the `State` schema.
*   **`lib/state.ts`:** Remove `isCombat: false` from `initialState`.

### 2. Modify `lib/state.ts`

*   **Add `getActions?(context: WritableDraft<StoredState>): Promise<string[]>;` to `IGameRuleLogic`:** This method will now be responsible for providing actions regardless of the plot type. Its implementation in the plugin will decide whether to return combat-specific actions or general actions based on its internal `plotType`.
    ```typescript
    getActions?(context: WritableDraft<StoredState>): Promise<string[]>;
    ```
    *   **Reasoning for Addition:** This method is crucial for enabling plugins to dynamically control the actions available to the player based on the current game scenario (e.g., combat, puzzle, social encounter). By delegating action generation to the plugin, the core application remains generic and unaware of game-rule-specific action sets, ensuring true separation of concerns.

### 3. Modify `lib/engine.ts`

*   **No `isCombat` flag to check.** The logic will rely entirely on the plugin's `getNarrationPrompt` and `generateActionsPrompt` (which will call `gameRuleLogic.getActions()`) to determine combat-related behavior.
*   The detection of `type: "initiative"` `CheckDefinition` will still occur. Its purpose will be solely to trigger the plugin’s internal `plotType` transition to "combat" and combat state initialization.
*   The engine will *always* call `gameRuleLogic.getNarrationPrompt(eventType, context, checkResultStatements, action)` and `generateActionsPrompt(state)` (which will call `gameRuleLogic.getActions()`). The plugin's response will implicitly define the current scenario.

### 4. Modify `lib/prompts.ts`

*   **`generateActionsPrompt`:** This function will be modified to call `gameRuleLogic.getActions()` *if the plugin's `getGameRuleLogic` method exists and has a `getActions` method*. It will *not* check any global `isCombat` flag or `plotType`.
    *   **Reasoning for Modification:** The core application (`lib/prompts.ts`) should remain generic and unaware of specific game scenarios (like combat or puzzles). The decision of what actions are available to the player in a given context must be delegated to the game rule plugin. By modifying `generateActionsPrompt` to call `gameRuleLogic.getActions()`, the plugin gains full control over the list of actions presented to the player. The plugin's `getActions` method can then use its internal `plotType` (e.g., "combat") to return scenario-specific actions (e.g., "Attack", "Defend") or general actions, ensuring the core app remains decoupled from game-specific logic.

### 5. Modify `plugins/game-rule-dnd5e/src/pluginData.ts`

*   **Define `PlotType` Enum/Schema:**
    ```typescript
    export const PlotType = z.enum(["general", "combat", "puzzle", "chase", "roleplay", "shop"]);
    export type PlotType = z.infer<typeof PlotType>;
    ```
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

### 6. Modify `plugins/game-rule-dnd5e/src/main.tsx`

*   **`getActionChecks()`:** Will return `CheckDefinition`s, including `type: "initiative"` when combat is triggered.
*   **`resolveCheck()`:**
    *   If `type: "initiative"`, the plugin will:
        *   Set `this.settings.plotType = "combat"`.
        *   Initialize `this.settings.encounter` with `BattleSchema` data (including protagonist and enemies, HP, initiative).
        *   Return a statement indicating combat has begun and the initiative order.
*   **`getNarrationPrompt()`:**
    *   This method will check its *own internal* `this.settings.plotType`.
    *   If `this.settings.plotType` is "combat", it will call `getCombatRoundNarration()` internally.
    *   Otherwise, it will proceed with general narration.
    *   **Crucially, this is also where the plugin will decide to transition *out* of combat.** If, for example, `this.settings.plotType` is "combat" but all enemies are defeated, `getNarrationPrompt` will:
        *   Set `this.settings.plotType = "general"` (or "aftermath").
        *   Clear `this.settings.encounter` (set to `undefined`).
        *   Generate post-combat narration (XP, loot, etc.).
*   **`getCombatRoundNarration()`:** Read/update `this.settings.encounter` (which contains the `BattleSchema` data), generate narration, advance combat state.
*   **`getActions()`:**
    *   This method will check `this.settings.plotType`.
    *   If `this.settings.plotType` is "combat", it will return combat-specific actions.
    *   Otherwise, it will return general actions.

### Rationale for `plotType` and `encounter` Design

The design choice to introduce `plotType` and `encounter` within the plugin's settings, rather than a global `isCombat` flag or extending core application schemas, is driven by a strict adherence to the principle of **separation of concerns** and **plugin autonomy**.

**Why `plotType`?**

*   **Encapsulation of Game State:** The core application is designed to be a generic narrator, agnostic to the specific game rules or scenarios (e.g., combat, puzzle, social interaction). A global `isCombat` flag would force the core application to understand and react to a game-rule-specific state, violating this principle.
*   **Plugin-Driven Narrative Flow:** By having the plugin manage its `plotType` (e.g., "general", "combat", "puzzle", "chase", "roleplay", "shop"), the plugin itself dictates the current narrative context. The core application simply calls generic `IGameRuleLogic` methods like `getNarrationPrompt()` and `getActions()`. The plugin's implementation of these methods then uses its internal `plotType` to determine the appropriate response (e.g., combat narration, puzzle-solving actions).
*   **Flexibility and Extensibility:** `plotType` allows the plugin to transition between various distinct game scenarios. A "romcom" game rule plugin, for instance, might define `plotType` values like "flirting", "date", or "breakup", each with its own specific narration and action generation logic, without the core application needing any awareness of these specific states.

**Why `encounter`?**

*   **Dynamic Scenario Data Container:** `encounter` serves as a generic, optional container within the plugin's settings to hold the specific, dynamic data relevant to the *currently active* `plotType`.
*   **"Nuke and Pave" for Active Scenarios:** This structure is designed for "per-confrontation" use. When a scenario (e.g., a battle) begins, `encounter` is populated with its specific data (e.g., `BattleSchema`). When the scenario concludes, `encounter` is cleared (set to `undefined`). This prevents the plugin's persistent state from becoming bloated with historical, turn-by-turn data, optimizing memory and performance.
*   **Example Scenario (Developer's Perspective):**
    1.  **Initial State:** `plotType` is "general", `encounter` is `undefined`.
    2.  **Action: "I open the door" (triggers combat):**
        *   The plugin's `getActionChecks()` identifies this as a combat-initiating action and returns a `CheckDefinition` of `type: "initiative"`.
        *   The plugin's `resolveCheck()` handles the "initiative" check. It then *internally* sets `this.settings.plotType = "combat"` and initializes `this.settings.encounter` with a `BattleSchema` object (containing combatants, HP, initiative order, etc.).
    3.  **Subsequent `getNarrationPrompt()` call:**
        *   The core application calls `gameRuleLogic.getNarrationPrompt()`.
        *   The plugin's `getNarrationPrompt()` implementation checks `this.settings.plotType`. Since it's "combat", it internally calls `getCombatRoundNarration()`, which uses the data in `this.settings.encounter` to generate combat-specific narration.
    4.  **Subsequent `getActions()` call:**
        *   The core application calls `gameRuleLogic.getActions()`.
        *   The plugin's `getActions()` implementation checks `this.settings.plotType`. Since it's "combat", it returns combat-specific actions (e.g., "Attack", "Defend").
    5.  **Combat Ends (e.g., last enemy defeated):**
        *   During a `getNarrationPrompt()` or `getActions()` call, the plugin's internal logic determines that combat conditions are no longer met (e.g., all enemies in `this.settings.encounter.combatants` are "dead").
        *   The plugin *internally* sets `this.settings.plotType = "general"` (or "aftermath") and clears `this.settings.encounter` (sets it to `undefined`).
        *   The next time `getNarrationPrompt()` is called, it will generate post-combat narration (XP, loot, etc.) based on the just-concluded battle, and then revert to general narration. The core application remains unaware of the internal state transitions.

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
    *   Calls `gameRuleLogic.resolveCheck({ type: "dexterity", difficultyClass: 10, modifiers: ["perception"] }, state.protagonist)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Dexterity (Perception) check (e.g., rolls 6, protagonist's Dex modifier is +6, total 12).
    *   Returns the `resultStatement`: "The protagonist successfully passed the Dexterity (Perception) check (DC 10) with a roll of 6 and a total of 12."
    *   This `resultStatement` is added to `checkResultStatements`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrationPrompt("general", state, checkResultStatements, action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrationPrompt()`):**
    *   Checks `this.settings.plotType`. Since it's "general", it proceeds with general narration.
    *   Generates a prompt for the LLM, incorporating the `checkResultStatements`.
    *   Returns the narration: "You successfully found a secret door, and it has many symbols on it."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions(state)`.
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
    *   Calls `gameRuleLogic.resolveCheck({ type: "strength", difficultyClass: 5, modifiers: ["athletics"] }, state.protagonist)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Strength (Athletics) check (e.g., rolls 1, protagonist's Str modifier is +4, total 5).
    *   Returns the `resultStatement`: "You critically fumbled the Strength (Athletics) check (DC 5) with a roll of 1 and a total of 5."
    *   This is added to `checkResultStatements`.
    *   **Crucial Consequence - Ambush Trigger:** The plugin's internal logic (within `getNarrationPrompt` or a new `handleConsequence` method) will determine that a critical fumble on opening a door can lead to an ambush. This is *not* yet combat.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrationPrompt("general", state, checkResultStatements, action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrationPrompt()`):**
    *   Checks `this.settings.plotType`. It's still "general".
    *   Generates a prompt for the LLM, incorporating the `checkResultStatements`.
    *   The LLM's response (guided by the prompt and check results) will describe the ambush.
    *   Returns the narration: "You fumble opening the door and fell over to the other side, revealing a group of ambushing goblins who snarl and raise their crude weapons."
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions(state)`.
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
    *   Iterates through the `checkDefinitions`.
    *   Calls `gameRuleLogic.resolveCheck({ type: "dexterity", difficultyClass: 15, modifiers: ["acrobatics"] }, state.protagonist)`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs the Dexterity (Acrobatics) check (e.g., rolls 6, protagonist's Dex modifier is +6, total 12 - a failure).
    *   Returns the `resultStatement`: "You struggled to get back up, failing the Dexterity (Acrobatics) check (DC 15) with a roll of 6 and a total of 12."
    *   This is added to `checkResultStatements`.
    *   **Crucial Step - Combat Initiation Trigger:**
        *   Detects the `type: "initiative"` `CheckDefinition`.
        *   **Sets `this.settings.plotType = "combat"`**.
        *   **Initializes `this.settings.encounter` (a `Battle` object):**
            *   `roundNumber: 1`
            *   `combatants`: Populates with protagonist (Conan) and initial enemies (e.g., 4 goblins, potentially from a pre-defined encounter or inferred from the previous narration). For each, it assigns `characterIndex`, `maxHp`, `currentHp` (full), `status: "alive"`, and rolls `initiativeRoll`.
            *   `combatLog`: `["Combat initiated."]`
            *   `activeTurnCombatantIndex`: `undefined` (will be set after initiative order is determined).
        *   Performs initiative rolls for all combatants in `this.settings.encounter.combatants`.
        *   Sorts combatants by initiative.
        *   Returns the `resultStatement`: "Despite struggling to get up, combat begins! The initiative order is: Goblin 1 (5), Conan Thegreat (7), Goblin 2 (15), Goblin 3 (15), Goblin 4 (17)."
        *   This `resultStatement` is added to `checkResultStatements`.
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrationPrompt("general", state, checkResultStatements, action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrationPrompt()`):**
    *   **Checks `this.settings.plotType`. It is now "combat"**.
    *   Calls `getCombatRoundNarration(this.settings.encounter.roundNumber, this.settings.encounter.combatLog)`.
7.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getCombatRoundNarration()`):**
    *   Uses `this.settings.encounter` to determine the current turn.
    *   Generates narration for the start of combat and the first turn, incorporating the result of the Acrobatics check.
    *   Returns the narration: "You struggle to regain your footing, but the goblins are already upon you! Combat begins! Goblin 1 snarls and lunges forward..."
8.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
9.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Checks if `gameRuleLogic.getActions()` exists. It does.
    *   Calls `gameRuleLogic.getActions(state)`.
10. **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):**
    *   Checks `this.settings.plotType`. Since it's "combat", it returns combat-specific actions: `["Attack", "Defend", "Flee"]`.
11. **`lib/engine.ts`:**
    *   Displays the combat actions to the player.

---

**Combat Loop: "... many rounds later..."**

*   Player continues to select actions (e.g., "Attack Goblin 4").
*   `lib/engine.ts` calls `getActionChecks` and `resolveCheck`.
*   `plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):
    *   Handles "to hit" and "damage" checks.
    *   **Updates `this.settings.encounter.combatants` (e.g., Goblin 4's `currentHp` decreases).**
    *   Adds entries to `this.settings.encounter.combatLog`.
*   `lib/engine.ts` calls `narrate()`.
*   `plugins/game-rule-dnd5e/src/main.tsx` (`getNarrationPrompt()`):
    *   Checks `this.settings.plotType` ("combat").
    *   Calls `getCombatRoundNarration()` (which uses `this.settings.encounter`).
*   `plugins/game-rule-dnd5e/src/main.tsx` (`getCombatRoundNarration()`):
    *   Generates narration for the current combat round, including actions by player and enemies, and their effects, based on `this.settings.encounter`.
    *   **Advances the turn order and `roundNumber` within `this.settings.encounter`.**
*   `lib/engine.ts` calls `generateActionsPrompt()`.
*   `plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):
    *   Returns combat-specific actions.

---

**Combat End: Player inputs "I swing my sword at the last goblin"**

1.  **`lib/engine.ts` (`next()` function):**
    *   Receives the player's `action`.
    *   Calls `gameRuleLogic.getActionChecks("I swing my sword at the last goblin", state)`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActionChecks()`):**
    *   Returns `[{ type: "to_hit" }, { type: "damage" }]`.
3.  **`lib/engine.ts` (`next()` function):**
    *   Calls `gameRuleLogic.resolveCheck()` for "to_hit" and "damage".
4.  **`plugins/game-rule-dnd5e/src/main.tsx` (`resolveCheck()`):**
    *   Performs checks (e.g., to hit roll 15, damage 1d8 roll 7).
    *   **Updates `this.settings.encounter.combatants` (Goblin 4's HP goes to -5, `status: "dead"`).**
    *   Adds entries to `this.settings.encounter.combatLog`.
    *   Returns `resultStatement`: "Hit success, damage 1d8, rolled 7 to Goblin 4, bringing HP to -5, killed it."
5.  **`lib/engine.ts` (`narrate()` function):**
    *   Calls `gameRuleLogic.getNarrationPrompt("general", state, checkResultStatements, action)`.
6.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getNarrationPrompt()`):**
    *   Checks `this.settings.plotType`. It is still "combat".
    *   **Crucial Step - Combat End Detection:**
        *   **Internal logic checks `this.settings.encounter.combatants` and finds all enemies are "dead".**
        *   **Sets `this.settings.plotType = "general"`** (or "aftermath").
        *   **Clears `this.settings.encounter = undefined`**.
        *   Generates post-combat narration, including XP calculation, treasure drop, and story progression details (e.g., "That was the last goblin. Combat ends. You gain 100 XP and find a rusty dagger on the goblin's corpse. The path ahead is now clear.").
7.  **`lib/engine.ts`:**
    *   Displays the narration.
    *   Calls `generateActionsPrompt(state)`.
8.  **`lib/prompts.ts` (`generateActionsPrompt()`):**
    *   Calls `gameRuleLogic.getActions()` (which now returns general actions).
9.  **`plugins/game-rule-dnd5e/src/main.tsx` (`getActions()`):
    *   Checks `this.settings.plotType`. Since it's now "general", it returns general actions.
10. **`lib/engine.ts`:**
    *   Displays the general actions to the player.