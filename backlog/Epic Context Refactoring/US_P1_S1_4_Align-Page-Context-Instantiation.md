## US_P1_S1_4: Align `app/page.tsx` `Context` Instantiation

**As a:** Core Application Developer
**I want to:** Modify the `Context` constructor call in `app/page.tsx`
**So that:** It aligns with the lean `Context` class after its properties have been removed.

**Goal:** Modify the `Context` constructor call in `app/page.tsx` to pass *only* `manifest.name`.

**Work:**
*   In `app/page.tsx`, locate the `Context` constructor call within the `loadPlugins` function.
*   Modify the `Context` constructor call to pass *only* `manifest.name`.

**Acceptance Criteria:**

*   **Verification of `Context` Constructor Call:**
    *   Verify that when the `loadPlugins` function in `app/page.tsx` executes and a plugin is initialized, the `Context` constructor is called with *only* `manifest.name` as its argument.

*   **Type-Checking Success:**
    *   Execute `npx tsc --noEmit`.
    *   Verify that the TypeScript compilation completes with no errors related to `app/page.tsx`.

*   **Scenario: Functional Correctness (No Regression)**
    *   **Given:** The application has been built successfully after completing `US_P1_S1_1`, `US_P1_S1_2`, and `US_P1_S1_3`.
    *   **When:** The application is launched and plugin functionalities are exercised.
    *   **Then:** All functionalities (e.g., plugin settings, backend calls, UI updates) work as expected without regressions.

**Testing:**
*   Type-check (`npx tsc --noEmit`).
*   Run `npm run build`.
*   Manually verify application startup and plugin functionalities.

### Status

**Status:** Pending
