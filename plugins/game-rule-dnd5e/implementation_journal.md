### Removed Unused Declarations and Fixed `immer` References in `main.tsx`

**Date:** August 18, 2025

**Objective:** Identify and remove all unused declarations (imports and props) from `plugins/game-rule-dnd5e/src/main.tsx` and resolve `immer` related type errors.

**Changes Made:**

1.  Removed `Character` from the import statement: `import type { Plugin, PluginWrapper, StoredState, IGameRuleLogic } from "@/lib/state";`
2.  Removed `import type * as Immer from 'immer';`
3.  Removed `import type { ChangeEvent } from 'react';`
4.  Removed `injectedImmer: typeof Immer;` from `interface DndStatsCharacterUIPageProps`.
5.  Removed `injectedImmer,` from the destructuring of props in `const DndStatsCharacterUIPage = ({ ... }) => {`.
6.  Removed `injectedImmer={this.context.immer}` from the `DndStatsCharacterUIPage` component instantiation within the `addCharacterUI` call.

**Verification:**

*   **TypeScript Type Check (`npx tsc --noEmit`):** Passed successfully (Exit Code: 0).
*   **Plugin Build (`cd plugins/game-rule-dnd5e && npm run build`):** Passed successfully (Exit Code: 0).
*   **Main Application Build (`npm run build`):** Passed successfully (Exit Code: 0).

**Outcome:** All identified unused declarations have been successfully removed, and the `immer` related type errors have been resolved. The `main.tsx` file is now cleaner, more precise, and type-correct.

**Next Steps:** The next step is to implement the `IGameRuleLogic` methods in `plugins/game-rule-dnd5e/src/main.tsx` as outlined in the `session_recovery_script.md`.

### Implemented `modifyProtagonistPrompt`

**Date:** August 18, 2025

**Objective:** Implement the `modifyProtagonistPrompt` method in `plugins/game-rule-dnd5e/src/main.tsx` and centralize its logic in `plugins/game-rule-dnd5e/src/pluginPrompt.ts`.

**Changes Made:**

1.  Added `modifyProtagonistPromptForDnd` function to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`. This function currently returns the original prompt without modification.
2.  Implemented `modifyProtagonistPrompt` method in `plugins/game-rule-dnd5e/src/main.tsx` to call `modifyProtagonistPromptForDnd`.
3.  Added necessary imports (`Prompt` and `modifyProtagonistPromptForDnd`) to `plugins/game-rule-dnd5e/src/main.tsx`.

**Verification:**

*   **TypeScript Type Check (`npx tsc --noEmit`):** Passed successfully (Exit Code: 0).
*   **Plugin Build (`cd plugins/game-rule-dnd5e && npm run build`):** Passed successfully (Exit Code: 0).
*   **Main Application Build (`npm run build`):** Passed successfully (Exit Code: 0).

**Outcome:** The `modifyProtagonistPrompt` method has been successfully implemented and integrated, adhering to the project's convention of centralizing prompt logic. All build checks passed.

### Planning `getActionChecks` and Interface Update

**Date:** August 18, 2025

**Objective:** Plan the implementation of `getActionChecks` using an LLM-based approach and address the necessary interface change in `lib/state.ts`.

**Details:**

1.  **Identified Conflict:** The `IGameRuleLogic` interface's `getActionChecks` method is currently synchronous, but the planned LLM-based implementation requires it to be asynchronous.
2.  **Proposed Resolution:** Modify `lib/state.ts` to update the `IGameRuleLogic` interface, making `getActionChecks` return a `Promise<CheckDefinition[]>`. 
3.  **LLM-based `getActionChecks` Plan:**
    *   Read `.Requirements/Source/Core Skills and Difficulty Check.txt` for LLM guidance.
    *   Create `getChecksPrompt` in `plugins/game-rule-dnd5e/src/pluginPrompt.ts` to construct the LLM prompt.
    *   Implement `getActionChecks` in `plugins/game-rule-dnd5e/src/main.tsx` as an `async` function, calling the LLM via `backend.getObject()`.
    *   Modify `lib/engine.ts` to `await` the call to `gameRuleLogic.getActionChecks`.

**Next Steps:** Proceed with the interface change in `lib/state.ts` as the first step of the detailed plan for `getActionChecks`.

### Implemented `resolveCheck`, `getNarrationPrompt`, and `getCombatRoundNarration` and Refactored `resolveCheck` Location

**Date:** August 19, 2025

**Objective:** Implement the `resolveCheck()`, `getNarrationPrompt()`, and `getCombatRoundNarration()` methods in `plugins/game-rule-dnd5e/src/main.tsx`, and refactor the `resolveCheck` logic to `plugins/game-rule-dnd5e/src/pluginData.ts`.

**Changes Made:**

1.  **`plugins/game-rule-dnd5e/src/pluginData.ts`:**
    *   Added `getAbilityModifier(score: number): number` helper function.
    *   Added `resolveCheck(check: CheckDefinition, characterStats: Character, dndStats: DndStatsSettings, rpgDiceRoller: typeof RpgDiceRoller): string` function. This function now contains the core logic for resolving D&D 5e checks.
    *   Updated imports to include `CheckDefinition` and `Character` from `@/lib/state`.
2.  **`plugins/game-rule-dnd5e/src/main.tsx`:**
    *   Updated imports to include `resolveCheck as resolveCheckFromPluginData` from `pluginData.ts`, `narratePrompt` from `@/lib/prompts`, and `Character`, `State` from `@/lib/state`.
    *   Implemented `resolveCheck(check: CheckDefinition, characterStats: Character): string` to call `resolveCheckFromPluginData`, passing the necessary arguments.
    *   Implemented `getNarrationPrompt(eventType: string, context: WritableDraft<State>, checkResultStatements?: string[]): Prompt` to leverage `narratePrompt` from `lib/prompts.ts`.
    *   Implemented `getCombatRoundNarration(roundNumber: number, combatLog: string[]): string` with a basic narration string.

**Verification:**

*   **TypeScript Type Check (`npx tsc --noEmit`):** Passed successfully (Exit Code: 0).
*   **Plugin Build (`cd plugins/game-rule-dnd5e && npm run build`):** Passed successfully (Exit Code: 0).
*   **Main Application Build (`npm run build`):** Passed successfully (Exit Code: 0).
*   **Manual Testing:** `resolveCheck` appears to be working as expected in runtime.

**Outcome:** The `resolveCheck()`, `getNarrationPrompt()`, and `getCombatRoundNarration()` methods have been successfully implemented, and the `resolveCheck` logic has been refactored to `pluginData.ts` for better organization. All build checks passed, and manual testing indicates correct functionality.

**Next Steps:** Continue with the remaining `IGameRuleLogic` methods (`getAvailableRaces()` and `getAvailableClasses()`) or await further instructions.

### Implemented and Refactored `getActionChecks`

**Date:** August 19, 2025

**Objective:** Implement the `getActionChecks` method in `plugins/game-rule-dnd5e/src/main.tsx` to use an LLM-based approach for determining skill checks, and refactor `getChecksPrompt` to be self-contained.

**Changes Made:**

1.  **`lib/state.ts`:** Updated the `IGameRuleLogic` interface to make `getActionChecks` return a `Promise<CheckDefinition[]>`. 
2.  **`lib/engine.ts`:**
    *   Modified the default `getActionChecks` to return `Promise.resolve([])`.
    *   Updated the call to `gameRuleLogic.getActionChecks` to `await` its result.
    *   Modified `console.log` statements for brevity.
3.  **`plugins/game-rule-dnd5e/src/pluginPrompt.ts`:**
    *   Added `export const coreSkillsAndDifficultyCheckContent` with the content from `.Requirements/Source/Core Skills and Difficulty Check.txt`.
    *   Modified `getChecksPrompt` to no longer accept `coreSkillsAndDifficultyCheckContent` as a parameter, directly using the exported constant instead.
    *   Removed the unused `import type { CheckDefinition } from "@/lib/state";`.
4.  **`plugins/game-rule-dnd5e/src/main.tsx`:**
    *   Implemented the `getActionChecks` method to call `getChecksPrompt`, send the prompt to the LLM via `this.context!.getBackend().getObject()`, and validate the response using Zod.
    *   Updated the import statement for `pluginPrompt.ts` to include `coreSkillsAndDifficultyCheckContent`.
    *   Removed the temporary `console.log` statement for `checksPrompt`.
    *   Removed the `await this.context.react.useMemo(...)` block for reading `Core Skills and Difficulty Check.txt`.

**Verification:**

*   **TypeScript Type Check (`npx tsc --noEmit`):** Passed successfully (Exit Code: 0).
*   **Main Application Build (`npm run build`):** Passed successfully (Exit Code: 0).
*   **Manual Testing:** `getActionChecks` appears to be working as expected, and `checksPrompt` values are visible in the browser console.

**Outcome:** The `getActionChecks` method has been successfully implemented and refactored, improving code organization and ensuring type safety. The LLM-based approach for determining skill checks is now integrated.

**Next Steps:** The next focus is on `resolveCheck()`, followed by `getNarrationPrompt()`, and `getCombatRoundNarration()`.

## Detailed Plan: Dynamic Narrative Guidance Enhancement

**Date:** August 20, 2025

**Goal:** Implement the dynamic narrative guidance as per the user's clarified flow, with LLM handling check result interpretation.

**Phase 1: Prepare `pluginPrompt.ts` for new guidance functions.

**Step 1: Add `getConsequenceGuidancePrompt` to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`**

*   **Action:** Add the new function `export function getConsequenceGuidancePrompt(sceneNarration: string, actionText: string, originalCheckResultStatements: string[]): Prompt` to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`.
*   **Code Snippet to Add:**
    ```typescript
    /**
     * Generates a prompt for an LLM to interpret check results and provide narrative guidance.
     * The LLM is instructed to consider proximity to DC and critical rolls.
     * @param sceneNarration The current scene narration text.
     * @param actionText The action text that led to the checks.
     * @param originalCheckResultStatements An array of strings describing the check outcomes.
     * @returns A Prompt object for the internal LLM call.
     */
    export function getConsequenceGuidancePrompt(sceneNarration: string, actionText: string, originalCheckResultStatements: string[]): Prompt {
      const checkResultsFormatted = originalCheckResultStatements.length > 0
        ? `Check Results:\n${originalCheckResultStatements.join('\n')}`
        : "No specific checks were performed or their results are not available.";

      return {
        system: `You are an expert D&D 5e Game Master. Your task is to interpret the outcome of an action based on the provided scene, action, and D&D 5e skill check results.\n    Consider how close the roll was to the Difficulty Class (DC). A natural 1 on the roll is a critical failure, and a natural 20 is a critical success.\n    Based on your interpretation, provide concise narrative guidance for the next scene. Focus on the immediate consequences of the action and how the story should unfold, including any twists or unexpected developments.`,
        user: `Current scene:\n    ${sceneNarration}\n\n    Action taken:\n    ${actionText}\n\n    ${checkResultsFormatted}\n\n    Provide narrative guidance for the next scene based on these inputs.`
      };
    }
    ```
*   **Reasoning:** This directly implements the user's latest refinement, offloading the interpretation of check results to the LLM.
*   **Approach:** Plugin-level, structural and functional change (full implementation).

**Step 2: Add `getDndNarrationGuidance` to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`**

*   **Action:** Add the new function `export function getDndNarrationGuidance(eventType: string): string` to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`.
*   **Code Snippet to Add:**
    ```typescript
    /**
     * Provides general D&D narrative style guidance.
     * @param eventType The type of event triggering narration (e.g., "combat", "general").
     * @returns A string containing general D&D narrative instructions.
     */
    export function getDndNarrationGuidance(eventType: string): string {
      let guidance = "";
      if (eventType === "combat") {
        guidance += "Narrate this as a dynamic combat scene, focusing on action and character reactions, adhering to D&D 5e combat rules.";
      } else {
        guidance += "Ensure your narration aligns with D&D 5e fantasy themes, character abilities, and typical role-playing scenarios.";
      }
      return guidance;
    }
    ```
*   **Reasoning:** This provides the general D&D narrative style guidance as required by the user's flow.
*   **Approach:** Plugin-level, structural and functional change (stub implementation).

**Phase 2: Modify `main.tsx` to use the new guidance functions.**

**Step 3: Modify `getNarrationPrompt` in `plugins/game-rule-dnd5e/src/main.tsx`**

*   **Action:** Update the `getNarrationPrompt` method.
*   **Code Snippet to Replace/Modify:**
    *   **Imports (to be added/modified at the top of the file):**
        ```typescript
        import { getProtagonistGenerationPrompt, modifyProtagonistPromptForDnd, getChecksPrompt, getConsequenceGuidancePrompt, getDndNarrationGuidance } from "./pluginPrompt";
        ```
    *   **`getNarrationPrompt` method:**
        ```typescript
          async getNarrationPrompt(eventType: string, context: WritableDraft<State>, checkResultStatements?: string[]): Promise<Prompt> {
            if (!this.context) {
              console.error("Context not available for getNarrationPrompt.");
              // Fallback to default narration prompt if context is missing
              return narratePrompt(context, undefined, checkResultStatements);
            }

            // Extract sceneNarration and actionText from context.events
            let sceneNarration = "";
            let actionText = "";

            // Find the most recent narration and action events
            for (let i = context.events.length - 1; i >= 0; i--) {
              const event = context.events[i];
              if (event.type === "narration" && !sceneNarration) {
                sceneNarration = event.text;
              } else if (event.type === "action" && !actionText) {
                actionText = event.action;
              }
              if (sceneNarration && actionText) {
                break; // Found both, no need to continue
              }
            }

            // 1. Get consequence guidance from internal LLM call
            const internalGuidancePrompt = getConsequenceGuidancePrompt(sceneNarration, actionText, checkResultStatements || []);
            const consequenceGuidance = await this.context.getBackend().getNarration(internalGuidancePrompt);

            // 2. Get general D&D style guidance
            const dndStyleGuidance = getDndNarrationGuidance(eventType);

            // 3. Combine guidance into a single string
            const consolidatedGuidance = `${consequenceGuidance}\n\n${dndStyleGuidance}`;

            // 4. Call core narratePrompt with consolidated guidance as checkResultStatements
            // The core narratePrompt will then embed this consolidated guidance into its user prompt.
            return narratePrompt(context, undefined, [consolidatedGuidance]);
          }
        ```
*   **Reasoning:** Implements the core logic for dynamic narrative guidance as per the latest user clarification, including extracting context from `state.events` and performing the internal LLM call.
*   **Approach:** Plugin-level, functional and structural change.

### CharacterUI Tab Management Change Rollout Status

**Date:** August 22, 2025

**Objective:** Verify the successful rollout of changes related to eliminating `activeGameRule` from global state and implementing UI-only local state for tab management.

**Outcome:** The changes outlined in `plugins/game-rule-dnd5e/CharacterUI Tab management change request.md` have been successfully implemented and deployed. All compilation and type checks passed without issues. Initial runtime testing indicates that the changes behave as expected, and no new issues have been observed.
