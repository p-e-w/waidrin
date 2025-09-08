## US_P1_S1_1: Inject Granular Services to `plugin.init`

**As a:** Core Application Developer
**I want to:** Modify `app/page.tsx` and the `Plugin` interface to pass granular service instances directly to `plugin.init`
**So that:** Plugins can access these services independently of the `Context` object, enabling a phased migration.

**Goal:** Pass `appLibs`, `appBackend`, `appStateManager`, and `appUI` directly to `plugin.init`.

**Work:**
*   **Modify `Plugin` Interface:** Update the `Plugin` interface (likely in `lib/state.ts`) to include `appLibs`, `appBackend`, `appStateManager`, and `appUI` as parameters for the `init` method.
*   **Update `app/page.tsx`:**
    *   Instantiate the granular service objects (`appLibs`, `appBackend`, `appStateManager`, `appUI`) in `app/page.tsx` (if not already done).
    *   Modify the `plugin.init` method call within the `loadPlugins` function to pass these instantiated granular service objects as additional arguments.

**Acceptance Criteria:**

*   **Verification of `Plugin` Interface Update:**
    *   Verify that when `npx tsc --noEmit` is executed after modifying the `Plugin` interface, the TypeScript compilation completes with no errors related to the `Plugin` interface definition.

*   **Verification of Granular Services Injection into `plugin.init`:**
    *   Verify that when the `loadPlugins` function in `app/page.tsx` executes and a plugin's `init` method is invoked, the instantiated `appLibs`, `appBackend`, `appStateManager`, and `appUI` objects are passed as arguments to `plugin.init`.

*   **Type-Checking Success (Overall):**
    *   Execute `npx tsc --noEmit`.
    *   Verify that the TypeScript compilation completes with no errors related to `app/page.tsx` or the `Plugin` interface changes.

*   **Scenario: Functional Correctness (No Regression)**
    *   **Given:** The application has been built successfully.
    *   **When:** The application is launched and plugin functionalities are exercised.
    *   **Then:** All functionalities (e.g., plugin settings, backend calls, UI updates) work as expected without regressions, as plugins are still using `this.context.<old_property>` for now.

**Testing:**
*   Type-check (`npx tsc --noEmit`).
*   Run `npm run build`.
*   Manually verify application startup and plugin functionalities.

### Status

**Status:** Completed
