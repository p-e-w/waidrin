## Epic: Context Refinement for Upstream Merge

**As a:** Core Application Developer
**I want to:** Refactor the `Context` object and its usage to simplify `plugin.ts`
**So that:** Merging with upstream `HEAD` becomes easier and less prone to conflicts.

### Discussion: Streamlining Context for Upstream Compatibility

This epic focuses on refining the `Context` object (`app/plugins.ts`) by delegating its responsibilities to the granular service objects (`AppLibs`, `AppBackend`, `AppStateManager`, `AppUI`). The primary driver for this refactoring is to simplify `plugin.ts` to facilitate smoother merges with the upcoming upstream `HEAD`. This approach acknowledges the need to preserve certain upstream functionalities directly on `Context` (e.g., `saveSettings`, `addCharacterUI`, `addBackendUI`) while still achieving a cleaner separation of concerns for other functionalities.

### Goals:

*   **Simplify `Context`:** Remove direct library and service properties from `Context` where their functionality is encapsulated by granular services.
*   **Delegate Responsibilities:** Ensure `Context` methods delegate to the appropriate granular service where possible, without breaking upstream compatibility.
*   **Update Core Application:** Adjust `app/page.tsx` to correctly instantiate and pass the refined `Context` object.
*   **Update Plugins:** Refactor existing plugins to utilize the new `Context` structure, accessing functionalities via the granular service objects.

### Acceptance Criteria:

*   **AC1: `Context` Stripping:** The `Context` class in `app/plugins.ts` no longer contains direct properties for `react`, `getGlobalState`, `immer`, `radixThemes`, `reactIconsGi`, `useShallow`, `rpgDiceRoller`, `getBackend`, and `updateProgress`.
*   **AC2: `setPluginSelected` Delegation:** The `setPluginSelected` method in `Context` delegates its functionality to `appStateManager`.
*   **AC3: `app/page.tsx` Update:** `app/page.tsx` correctly instantiates and passes the refined `Context` object, without passing direct library/function references that have been removed from `Context`.
*   **AC4: Plugin `AppBackend` Adoption:** `plugins/game-rule-dnd5e/src/main.tsx` replaces direct calls to `this.context!.getBackend()` with `this.context!.appBackend`.
*   **AC5: Plugin `AppStateManager` Adoption:** `plugins/game-rule-dnd5e/src/main.tsx` and `plugins/test-ui-plugin/main.tsx` fully utilize `this.context!.appStateManager.getGlobalState()` for retrieving global state.
*   **AC6: Plugin `AppLibs` Adoption:** `plugins/game-rule-dnd5e/src/main.tsx` and `plugins/test-ui-plugin/main.tsx` replace direct library access via `this.context` with `this.context!.appLibs`.
*   **AC7: Functional Correctness:** The application functions correctly without regressions after all changes.
*   **AC8: Upstream Compatibility:** The changes facilitate easier merging with the upcoming upstream `HEAD`.
