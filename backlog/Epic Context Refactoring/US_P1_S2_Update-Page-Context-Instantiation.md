## US_P1_S2: Update `app/page.tsx` for Refined `Context` Instantiation and Plugin Dependency Injection

**As a:** Core Application Developer
**I want to:** Update the instantiation of the `Context` object and the dependency injection for plugins in `app/page.tsx`
**So that:** It aligns with the lean `Context` class and properly provides granular services to plugins.

**Goal:** Modify the `Context` constructor call in `app/page.tsx` to pass only `pluginName`, and inject granular services into `plugin.init`.

**Work:**
*   In `app/page.tsx`, locate the `Context` constructor call within the `loadPlugins` function.
*   Modify the `Context` constructor call to pass *only* `manifest.name` (which is the `pluginName`).
*   Instantiate the granular service objects (`appLibs`, `appBackend`, `appStateManager`, `appUI`) in `app/page.tsx` (if not already done).
*   Modify the `plugin.init` method call to pass these instantiated granular service objects as additional arguments. The `plugin.init` signature will need to be updated to accept these.

**Acceptance Criteria:**

*   **Verification of `Context` Constructor Call:**
    *   Verify that when the `loadPlugins` function in `app/page.tsx` executes and a plugin is initialized, the `Context` constructor is called with *only* `manifest.name` as its argument.

*   **Verification of Granular Services Injection into `plugin.init`:**
    *   Verify that when the `loadPlugins` function in `app/page.tsx` executes and a plugin's `init` method is invoked, the instantiated `appLibs`, `appBackend`, `appStateManager`, and `appUI` objects are passed as arguments to `plugin.init`.

*   **Type-Checking Success:**
    *   Execute `npx tsc --noEmit`.
    *   Verify that the TypeScript compilation completes with no errors related to `app/page.tsx` or the `Context`/`Plugin` interface changes.

*   **Scenario: Functional Correctness**
    *   **Given:** The application has been built successfully.
    *   **When:** The application is launched and plugin functionalities are exercised.
    *   **Then:** All functionalities (e.g., plugin settings, backend calls, UI updates) work as expected without regressions.

**Testing:**
*   Type-check (`npx tsc --noEmit`).
*   Run `npm run build`.
*   Manually verify application startup and plugin functionalities.

### Status

**Status:** Pending