### Refactoring `main.tsx` and creating `pluginData.ts` and `pluginPrompt.ts`

**Date:** August 18, 2025

**Objective:** Refactor `plugins/game-rule-dnd5e/src/main.tsx` to separate configuration items (attributes, class/subclass data) and prompt-related text into dedicated files (`pluginData.ts` and `pluginPrompt.ts`).

**Changes Made:**

1.  **`plugins/game-rule-dnd5e/src/pluginData.ts` created:**
    *   Moved `DndStatsSettingsSchema`, `DndStatsSettings` type, `generateDefaultDndStatsSettings` function, `DndClassData` type, and `DND_CLASS_DATA` constant from `main.tsx` to this new file.
    *   Ensured necessary imports (`z`, `rpg-dice-roller`) were added.
    *   All moved items are exported.

2.  **`plugins/game-rule-dnd5e/src/pluginPrompt.ts` created:**
    *   Moved `coreAttributesContent` string from `main.tsx` to this new file.
    *   Created `getProtagonistGenerationPrompt` function to encapsulate prompt construction logic.
    *   Ensured necessary imports (`Prompt`, `DndStatsSettings`, `StoredState`) were added.
    *   Both `coreAttributesContent` and `getProtagonistGenerationPrompt` are exported.

3.  **`plugins/game-rule-dnd5e/src/main.tsx` updated:**
    *   Removed the definitions of `DndStatsSettingsSchema`, `DndStatsSettings`, `generateDefaultDndStatsSettings`, `DndClassData`, `DND_CLASS_DATA`, and `coreAttributesContent`.
    *   Updated import statements to import these items from `./pluginData` and `./pluginPrompt`.
    *   Modified the `getInitialProtagonistStats` method to call `getProtagonistGenerationPrompt` from `pluginPrompt.ts`.
    *   Verified that `DndStatsCharacterUIPage` and `DndStatsPlugin` correctly use the imported items.

**Verification:**

*   **TypeScript Type Check (`npx tsc --noEmit`):** Passed successfully (Exit Code: 0).
*   **Plugin Build (`cd plugins/game-rule-dnd5e && npm run build`):** Passed successfully (Exit Code: 0).
*   **Main Application Build (`npm run build`):** Passed successfully (Exit Code: 0).

**Outcome:** The refactoring was successful. The code is now more modular, readable, and maintainable, with a clear separation of concerns between UI, data, and prompt logic. No compilation errors were introduced.

**Next Steps:** The next step is to implement the `IGameRuleLogic` methods in `plugins/game-rule-dnd5e/src/main.tsx` as outlined in the `session_recovery_script.md`.