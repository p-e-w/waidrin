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