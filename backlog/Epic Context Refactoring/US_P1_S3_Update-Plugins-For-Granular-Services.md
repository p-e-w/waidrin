## US_P1_S3: Update Plugins for Full Granular Service Adoption via `plugin.init`

**As a:** Plugin Developer
**I want to:** Update existing plugins to fully utilize the new granular service objects received via `plugin.init`
**So that:** Plugin code is cleaner, more modular, and aligns with the lean `Context` structure.

**Goal:** Refactor `game-rule-dnd5e` and `test-ui-plugin` to receive and use `appLibs`, `appBackend`, `appStateManager`, and `appUI` via their `init` method.

**Work:**
*   **Update `plugins/game-rule-dnd5e/src/main.tsx` and `plugins/test-ui-plugin/main.tsx`:**
    *   Modify the `init` method signature in both plugin classes to accept and store `appLibs`, `appBackend`, `appStateManager`, and `appUI` as parameters.
    *   Store these granular service instances as properties within the plugin class.
    *   **`AppBackend` Adoption:** Replace all direct calls to `this.context!.getBackend()` with `this.appBackend`. (Applies primarily to `game-rule-dnd5e`).
    *   **`AppStateManager` Adoption:** Replace all direct `getGlobalState()` calls with `this.appStateManager.getGlobalState()`. Also, ensure `savePluginSettings()` is called via `this.appStateManager`. (Applies to both plugins).
    *   **`AppLibs` Adoption:** Replace all direct library access via `this.context` (e.g., `this.context.react`) with `this.appLibs.<library>`. (Applies to both plugins).
    *   **`AppUI` Adoption:** Replace all direct `updateProgress()` calls with `this.appUI.updateProgress()`. (Applies primarily to `game-rule-dnd5e`).

**Acceptance Criteria:**

*   **Verification of Plugin `init` Methods:**
    *   Verify that when a plugin is initialized and its `init` method is invoked, the `init` method correctly receives and stores the `appLibs`, `appBackend`, `appStateManager`, and `appUI` objects.

*   **Scenario: Plugin `AppBackend` Adoption**
    *   **Given:** `plugins/game-rule-dnd5e/src/main.tsx` has been modified.
    *   **When:** The plugin interacts with the backend (e.g., calls `getNarration` or `getObject`).
    *   **Then:** It uses `this.appBackend` for all backend interactions.

*   **Scenario: Plugin `AppStateManager` Adoption**
    *   **Given:** `plugins/game-rule-dnd5e/src/main.tsx` and `plugins/test-ui-plugin/main.tsx` have been modified.
    *   **When:** The plugins access or modify global state (e.g., call `getGlobalState` or `savePluginSettings`).
    *   **Then:** They fully utilize `this.appStateManager.getGlobalState()` and `this.appStateManager.savePluginSettings()`.

*   **Scenario: Plugin `AppLibs` Adoption**
    *   **Given:** `plugins/game-rule-dnd5e/src/main.tsx` and `plugins/test-ui-plugin/main.tsx` have been modified.
    *   **When:** The plugins access core libraries (e.g., `React`, `RadixThemes`).
    *   **Then:** They use `this.appLibs.<library>` for all library access.

*   **Scenario: Plugin `AppUI` Adoption**
    *   **Given:** `plugins/game-rule-dnd5e/src/main.tsx` has been modified.
    *   **When:** The plugin reports UI progress (e.g., calls `updateProgress`).
    *   **Then:** It uses `this.appUI.updateProgress()`.

*   **Type-Checking Success (Overall):**
    *   Execute `npx tsc --noEmit`.
    *   Verify that the TypeScript compilation completes with no errors related to the plugin code.

*   **Scenario: Functional Correctness**
    *   **Given:** The application has been built successfully.
    *   **When:** The application is launched and plugin functionalities are exercised.
    *   **Then:** They work as expected without regressions.

**Testing:**
*   Type-check (`npx tsc --noEmit`).
*   Run `npm run build`.
*   Manually verify all plugin functionalities in the UI.

### Status

**Status:** Pending