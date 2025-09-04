## User Story: Dynamic Combat Initiation

**As a:** Player
**I want to:** Experience combat initiating naturally from the story's narration or be able to explicitly initiate it through a clear action choice
**So that:** The game feels immersive, responsive to unfolding events, and I have control over when and how I engage in battle.

### Discussion: Story-Driven Combat Initiation

This approach focuses on the game engine recognizing a combat scenario from the generated narration and programmatically initiating combat.

*   **Mechanism:** Introduce a new function or extend the `narrate` function in `lib/engine.ts`. After the LLM generates narration, this new logic would analyze the `sceneNarration` (the most recent narration event) for keywords, phrases, or patterns indicating a combat encounter (e.g., "ambush," "monsters attack," "battle begins"). If combat cues are detected, this logic would then *programmatically* call `gameRuleLogic.resolveCheck()` with an "initiative" `CheckDefinition`.
*   **Pros:**
    *   **Seamless Narrative Integration:** Allows combat to flow naturally from the story, as if the game master (LLM) is describing an unfolding battle.
    *   **Automated:** Reduces the need for explicit user input to start combat in narrative-heavy scenarios.
    *   **Bypasses `getActionChecks`:** Directly triggers the initiative check, making it more deterministic than relying on LLM interpretation of user actions for story-driven combat.
*   **Cons:**
    *   **Complexity:** Requires new logic in `lib/engine.ts` to analyze narration and make a decision.
    *   **Accuracy:** The effectiveness depends on the robustness of the narration analysis to correctly identify combat cues without false positives.
    *   **LLM Dependency:** Still relies on the LLM to generate sufficiently descriptive combat narration.

### Discussion: User-Initiated Combat Initiation

This approach provides a clear and reliable way for the user to explicitly choose to enter combat.

*   **Mechanism:**
    1.  **Modify `getActions()`:** In `plugins/game-rule-dnd5e/src/main.tsx`, add a specific action string (e.g., "Attack", "Initiate Combat", or "Draw Weapon") to the list of "general actions" returned by the `getActions()` method when the `plotType` is not "combat".
    2.  **Train `getActionChecks()`:** Ensure the LLM used by `getActionChecks()` (via `getChecksPrompt` in `plugins/game-rule-dnd5e/src/pluginPrompt.ts`) is explicitly trained to recognize this specific action string. When this action is provided, the LLM should consistently return an "initiative" `CheckDefinition`.
*   **Pros:**
    *   **Clear User Intent:** The user explicitly chooses to initiate combat, leading to a predictable outcome.
    *   **Reliable:** By providing a pre-defined action and explicitly training the LLM for it, the chances of misinterpretation are significantly reduced compared to free-form text input.
    *   **Good User Experience:** Provides a direct and intuitive way for players to engage in combat.
    *   **Leverages Existing UI:** Integrates seamlessly with the current `ActionChoice.tsx` component.
*   **Cons:**
    *   Requires explicit modification of `getActions()` and targeted LLM training.

### Decision

We will implement a unified approach where the `getActionChecks` method within the active game rule plugin will be responsible for determining if combat should be initiated, based on both narrative events and user actions.

*   **Narration-Driven Combat:** The `narrate` function in `lib/engine.ts` will be modified to pass the `sceneNarration` to `gameRuleLogic.getActionChecks()`. The plugin's `getActionChecks()` will then interpret the narration for combat cues and return an "initiative" `CheckDefinition` if appropriate.
*   **User-Initiated Combat:** The user's action will also be passed to `gameRuleLogic.getActionChecks()`. The plugin's `getActionChecks()` will interpret the user's action for combat intent and return an "initiative" `CheckDefinition" if appropriate.
*   **"Initiative Only Once" Logic:** The `getActionChecks()` method in the plugin will filter out "initiative" checks if the game is already in a combat `plotType`, ensuring initiative is triggered only at the beginning of a battle. The `handleConsequence("initiative_triggered")` method's internal check (`dndStats.plotType !== "combat"`) further reinforces this.

### Acceptance Criteria

*   **AC1: Story-Driven Combat Initiation:**
    *   Given a narration event that clearly describes a combat situation (e.g., "a horde of orcs slashes at you," "you fall into a trap"), the game *automatically* transitions into combat mode.
    *   The `plotType` in the active game rule plugin's settings changes to "combat".
    *   Initiative is triggered, and combatants are identified and initialized in the `encounter` object.
*   **AC2: User-Initiated Combat Initiation:**
    *   Given the player performs an action that clearly indicates combat intent (e.g., "Attack the people in the tavern," "I draw my sword and charge"), the game transitions into combat mode.
    *   The `plotType` in the active game rule plugin's settings changes to "combat".
    *   Initiative is triggered, and combatants are identified and initialized in the `encounter` object.
*   **AC3: Single Initiative Trigger:**
    *   Once the game is in combat mode, subsequent narration events or user actions that might otherwise trigger combat (e.g., another "attack" action, or a narration describing more enemies) do *not* re-trigger initiative or re-initialize the `encounter` object.
    *   The `plotType` remains "combat" until combat is resolved (which is outside the scope of this story but implies no re-triggering).
*   **AC4: Dynamic Action Choices:**
    *   When the game is in combat mode, the available actions presented to the player change to combat-specific actions (e.g., "Attack," "Defend," "Cast Spell").
    *   When the game is not in combat mode, general actions are presented.
*   **AC5: Dynamic Narration:**
    *   When the game is in combat mode, the narration includes combat-specific details (e.g., "Combat Round X," "Combat Log").
    *   When the game is not in combat mode, the narration is general.