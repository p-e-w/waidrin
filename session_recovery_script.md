# Session Recovery Script

This script is written by the previous You before the session ended. It is designed to help the you (Gemini agent) regain full context and resume work on the Waidrin project, specifically concerning UI plugin development and the "two Reacts" problem. It outlines the steps to refresh memory, understand the current state, and execute the ongoing plan.

**Objective:** To ensure the agent can seamlessly pick up from where it left off, avoiding repetitive debugging and re-analysis.

## How to execute this Script (Agent Instructions):

*   **Upon Session Recovery/Start:**
    1.  **Confirm Memory and Context:** After executing `read_file` commands from **Phase 1: Context Refresh and Memory Reload**, explicitly state to the user: "I have read the session recovery script and regained context. I am ready to proceed."
    2.  **Review Core Mandates:** Re-read and internalize the "Core Mandates" section of my primary instructions (provided at the beginning of the session). Pay particular attention to:
        *   "Confirm Ambiguity/Expansion: Do not take significant actions beyond the clear scope of the request without confirming with the user."
        *   "Explain Critical Commands: Before executing commands with 'run_shell_command' that modify the file system, codebase, or system state, you *must* provide a brief explanation of the command's purpose and potential impact."
        *   **Crucial for File Modifications:** Before *any* use of `replace` or `write_file`, you *must* present your reasoning for the edit and obtain explicit user approval. Do not assume permission.
    3.  **Behavioral Checkpoint:** Before taking *any* action that modifies files or executes shell commands, pause and ask yourself: "Does this action align with the Core Mandates, especially regarding user confirmation and explanation?" If unsure, ask the user for clarification.
    4.  **Identify Current Task:** Review **Phase 2: Current Problem and Plan Execution** to identify the immediate problem and the next step of the current plan.
    5.  **Proceed with Plan Execution:** Begin executing the plan, always adhering to the reinforced mandates.

*   **During Plan Execution:**
    *   **Execution Flow Interruption by Verbose Output:**
        *   **Symptom:** After executing a tool command that produces a large or complex output (e.g., `read_many_files`, `git diff`), the agent may pause or fail to immediately proceed to the next sequential instruction in the script.
        *   **Cause:** Potential "output overload" or an implicit tendency to wait for user interaction/acknowledgment of the output, even when the script dictates automatic progression.
        *   **Safeguard:** After *every* tool command execution, explicitly re-check the current position in the `session_recovery_script.md` and immediately proceed to the *next numbered instruction* in the current phase, regardless of the tool output's size or content. Prioritize the script's sequential flow above all else.
    *   **After executing a step of the plan:** Follow **Phase 3: Post-Execution Verification and Logging**. Always update `implementation_journal.md` with detailed observations.
    *   **If a new error occurs:**
        *   Immediately return to **Phase 2: Current Problem and Plan Execution**.
        *   Analyze the new error in detail.
        *   Formulate a revised plan to address the new error, referencing this guide and the `Plugin best practice guide.md`.
        *   **Crucially, avoid getting stuck in loops.** If a `replace` operation fails, re-read the file immediately to get the exact `old_string`. If a solution leads to a new, complex error, consider reverting and trying a different approach as outlined in the best practice guide.

---

## Phase 1: Context Refresh and Memory Reload

**Goal:** Load all relevant project documentation and recent changes into memory.

1.  **Read Core Mandates and Primary Workflows:**
    *   Review the initial instructions provided at the beginning of the session.
    *   `read_file` for `GEMINI.md` (if applicable, to understand model configuration).

2.  **Automated Dependency Check:**
    *   `run_shell_command('npm install --prefer-offline --no-audit --progress=false', description='Ensuring all project dependencies are installed.')`

3.  **Automated Initial Lint and Type Check:**
    *   `run_shell_command('npx tsc --noEmit', description='Running initial TypeScript type check.')`

4.  **Review Project Structure and Key Source Files:**
    *   `list_directory` for the project root (`C:\Users\cheng\Downloads\RPG\waidrin\`).
    *   `read_many_files` for common source code patterns to get a broad overview:
        *   `paths: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx', 'plugins/**/*.ts', 'plugins/**/*.tsx']`

5.  **Read Key Project Documentation:**
    *   `read_file` for `README.md` (project overview).
    *   `read_file` for `.Requirements/Current State/Application Design Spec.md` (core app design, plugin framework).
    *   `read_file` for `.Requirements/Current State/Plugin development guide.md` (summary of UI plugin development challenges and solutions).
    *   `read_file` for `.Requirements/Current State/Plugin best practice guide.md` (lessons learned, common pitfalls).
    *   `read_file` for `.Requirements/User story/Dynamic Game Rule Selection.md` (detailed specification for dynamic game rule selection).

6.  **Review Core Configuration Files:**
    *   `read_file` for `package.json` (main app dependencies and scripts).
    *   `read_file` for `next.config.ts` (Next.js configuration, Webpack customization).
    *   read plugin configuration files

7.  **Review Recent Git Activity (Automated):**
    *   `run_shell_command('git log -5 --pretty=format:"%h - %an, %ar : %s"', description='Reviewing last 5 git commits for recent changes.')`
    *   `run_shell_command('git status && git diff', description='Reviewing uncommitted changes and git status.')`

---

## Phase 2: Current Problem and Plan Execution

**Goal:** Understand the immediate problem and execute the next step of the current plan.

1.  **Identify the Last Reported Error:** Review the last user message for the exact error encountered.
2.  **Recall the Current Plan:** Access the plan that was approved just before the last error occurred.
3.  **Execute the Next Step:** Perform the next action item in the approved plan.

---

## Phase 3: Post-Execution Verification and Logging

**Goal:** Verify the outcome of the executed step and log the results.

1.  **Automated Post-Build Lint and Type Check:**
    *   `run_shell_command('npx tsc --noEmit', description='Running post-build TypeScript type check.')`
2.  **Rebuild Affected Components:**
    *   `run_shell_command` to rebuild the plugin, for example if the target is test-ui-plugin (`cd plugins/test-ui-plugin && npm run build`).
    *   `run_shell_command` to rebuild the main application (`npm run build`).
3.  **Report Compilation and Test Status:** Inform the user about the compilation and test results (success/failure).
4.  **Await Runtime Feedback:** Wait for the user to provide console logs from the running application.
5.  **Log Results:** Update `implementation_journal.md` in the directory where the main code base is (i.e. plug/test-ui-plugin) with the outcome of the step, including any new errors or successful progress. If file does not exist you must create it.

---

## Resume Current Operation: Implement Dynamic Game Rule Selection

: stand by once all tasks has been executed and memory regained form previous session. DO NOT START on any task until human approved.

Before your actions to edit file, you must present your reasoning and approach for HUMAN to approve, once approved you may request for edit permission.

## Current Progress Summary

**Last Task:** Implementing the "Dynamic Game Rule Selection" feature.
**Current Status:** The modifications to `lib/schemas.ts`, `lib/state.ts`, `lib/engine.ts`, and `lib/prompts.ts` have been completed and verified (no compile/runtime errors). Console logs were added to `lib/engine.ts` for debugging, and there are no compile, runtime, or logic issues. Manual testing is currently in progress.

**Next Step:** Update `views/CharacterSelect.tsx` to include UI for game rule selection.

**Key aspects of the implemented changes include:**
- Added `activeGameRule: z.string()` to the `State` schema in `lib/schemas.ts`.
- Initialized `activeGameRule` to `"default"` in `initialState` in `lib/state.ts`.
- Defined `CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, and the `IGameRuleLogic` interface in `lib/state.ts`.
- Extended the `Plugin` interface with `getGameRuleLogic?(): IGameRuleLogic;` in `lib/state.ts`.
- Implemented `getDefaultGameRuleLogic()` and `getActiveGameRuleLogic()` in `lib/engine.ts`.
- Modified the `next()` function in `lib/engine.ts` to use `getActiveGameRuleLogic()` for protagonist generation, action resolution, and combat narration.
- Modified `generateProtagonistPrompt` in `lib/prompts.ts` to accept `initialProtagonistStats`.
- Modified `narratePrompt` in `lib/prompts.ts` to accept `checkResultStatements`.

**Background:** The previous task involved investigating the current mechanics for enabling/disabling installed plugins. It was determined that plugin enablement is controlled by an `enabled` boolean in the global state, which is persisted and respected by the loading logic, but there is no user-facing UI to manage this. The `rpg-dice-roller` integration and "Re-roll" button functionality have been successfully implemented and verified at runtime.

**Objective:** Implement the "Dynamic Game Rule Selection" feature, allowing the application to dynamically switch between different sets of game rules provided by plugins, influencing core game mechanics like character generation, action resolution (including skill checks), and narration.

**Problem We Are Solving (Refined):**

The core application needs a flexible way to allow game rule plugins to:
1.  Influence the narrative generation of protagonist background, personality, and appearance based on the plugin's internal character interpretations.
2.  Define and resolve game-specific checks (e.g., skill checks, attribute checks) based on the protagonist's actions, without forcing a rigid global character schema.
3.  Augment the core application's narration with results and consequences of these checks, effectively "shielding" the core app from game mechanics details.

**Detailed Plan with Reasoning:** Only provide plan to Human, do NOT edit any files, they will first approve the plan, then you can ask for edit permission once approved.

This feature aims to introduce a robust system for dynamic game rule selection, allowing the application to dynamically switch between different sets of game rules provided
by plugins, influencing core game mechanics like character generation, action resolution (including checks), and narration. The implementation will leverage Waidrin's
existing plugin framework and state management system.

**Original 7 Topics (and their refined details):**

1.  **Update `lib/schemas.ts`:**
    *   **Action:** Add `activeGameRule: z.string()` to the `State` schema.
    *   **Reasoning:** The `State` schema (`lib/schemas.ts`) defines the overall structure of the application's global state. To enable dynamic game rule selection, we need a persistent way to track which game rule is currently active. Adding `activeGameRule` as a `z.string()` ensures that this information is part of the validated global state, allowing it to be stored and retrieved reliably. This is a foundational step for any state-driven feature.
    *   **Refined Detail (Character Schema):** The global `Character` schema will **NOT** be expanded to include detailed RPG attributes (Str, Dex, etc.) or skills. These are managed internally by the plugins.

2.  **Update `lib/state.ts`:**
    *   **Action 2.1:** Initialize `activeGameRule` to `"default"` in `initialState`.
        *   **Reasoning:** The `initialState` in `lib/state.ts` defines the default values for the application's state when it first loads or is reset. Setting `activeGameRule` to `"default"` ensures that the application always starts with a known, fallback game rule if no other rule is explicitly selected or persisted. This provides a stable baseline for the game mechanics.
    *   **Action 2.2:** Define `CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, and the `IGameRuleLogic` interface.
        *   **`IGameRuleLogic` Interface Refinement:**
            *   `getInitialProtagonistStats?(): string;` (Changed from `Partial<Character>`)
                *   **Purpose:** To return a statement that augments the default prompt in `generateProtagonistPrompt`, influencing the protagonist's background, personality, and appearance based on the plugin's internal interpretation of stats.
            *   `getActionChecks?(action: string, context: WritableDraft<State>): CheckDefinition[];` (Changed `actionType` to `action`)
                *   **Purpose:** To interpret the raw action and context (potentially using LLM internally) to derive the necessary `CheckDefinition`s.
            *   `resolveCheck?(check: CheckDefinition, characterStats: Character): string;` (Changed from `CheckResult`)
                *   **Purpose:** To perform a roll against the character's appropriate stat and skill modifier (managed internally by the plugin) and present the result as a statement to influence `narratePrompt`. The `characterStats: Character` parameter will be the global `Character` object, which the plugin will map to its internal representation.
            *   `getNarrationPrompt?(eventType: string, context: WritableDraft<State>, checkResultStatements?: string[]): string;` (Changed `checkResults` to `checkResultStatements` and `CheckResult[]` to `string[]`)
            *   `getCombatRoundNarration?(roundNumber: number, combatLog: string[]): string;` (Changed `combatLog` from `any` to `string[]`)
            *   Other methods (`modifyProtagonistPrompt`, `getAvailableRaces`, `getAvailableClasses`) remain as previously defined.
        *   **Reasoning:** This interface is central to the dynamic game rule system. It formalizes the contract between the core game engine and any game rule plugin. By defining these methods, we create clear extension points for plugins to inject their specific logic for character generation, action resolution, and narration. The optional `?` makes these methods flexible, allowing plugins to implement only the logic they need. This aligns with the plugin framework's goal of extensibility and modularity.
    *   **Action 2.3:** Extend `Plugin` interface with `getGameRuleLogic?(): IGameRuleLogic;`.
        *   **Reasoning:** The `Plugin` interface in `lib/state.ts` defines the capabilities that any plugin can expose to the main application. By adding `getGameRuleLogic?()`, we provide a standard way for plugins to register their `IGameRuleLogic` implementation. The optional `?` ensures that not all plugins are required to provide game rule logic, maintaining flexibility. This is how the core application will discover and access the specific game rule logic provided by an active plugin.

3.  **Update `lib/engine.ts`:**
    *   **Action 3.1:** Implement `getDefaultGameRuleLogic()`.
    *   **Action 3.2:** Implement `getActiveGameRuleLogic()`.
    *   **Action 3.3:** Modify `next()` function to use `getActiveGameRuleLogic()`:
        *   **For protagonist generation:** Call `getActiveGameRuleLogic().getInitialProtagonistStats()` to get a statement that augments the prompt for character generation.
        *   **For action resolution and narration:** When an action is passed to `narratePrompt`, the core application will trigger `getActiveGameRuleLogic().getActionChecks(action, state)` to get `CheckDefinition`s. For each `CheckDefinition`, `getActiveGameRuleLogic().resolveCheck()` will be called to get a result statement. These statements will be incorporated into the `narratePrompt`'s output.
        *   **For combat narration:** Introduce logic to detect if the game is in a "combat" state. If so, call `getActiveGameRuleLogic().getCombatRoundNarration()` instead of the general `getNarrationPrompt()` for turn-based narration.

4.  **Update `views/CharacterSelect.tsx`:**
    *   **Action:** Modify UI for game rule selection and display. This will involve presenting the user with available game rules (either default or from loaded plugins) and allowing them to select one.

5.  **Benefits:** (Remain as previously defined)
6.  **Risks/Considerations:** (Remain as previously defined)
    *   **Error Handling Strategy:**
        *   **Centralized State Rollback (`lib/state.ts`):** The `setAsync` mechanism in `lib/state.ts` provides a robust `try...catch` block for all state updates. If an error occurs during a state update (including those triggered by plugin logic), the state will be rolled back to its last valid committed state, ensuring data consistency. Errors are then re-thrown for higher-level handling.
        *   **Plugin-Internal LLM Error Handling:** For LLM interactions within plugin methods (e.g., `getActionChecks`), the plugin itself is responsible for implementing `try...catch` blocks around LLM API calls and JSON parsing/validation.
            *   If the LLM response is invalid, unparseable, or does not conform to the expected schema, the plugin should **not** throw an error. Instead, it should return a "safe" default (e.g., an empty array for `CheckDefinition[]` from `getActionChecks`).
            *   This allows the core application to continue gracefully without interruption.
            *   Plugins should log these internal errors for debugging purposes.
        *   **Core Application Expectation:** The core application (e.g., in `lib/engine.ts`) will call plugin methods expecting these "safe" defaults in case of internal plugin errors.
        *   **Propagated Errors:** Errors that *do* propagate out of `next()` (e.g., unhandled exceptions from plugin logic, Zod validation failures) will be caught by the top-level `setAsync` mechanism and re-thrown. These should be caught and displayed to the user by the UI.

7.  **How `IGameRuleLogic` influences narration (expanded):** (Updated to reflect the new flow for `getActionChecks` and `resolveCheck` influencing `narratePrompt` via statements.)

**Verification Steps (Post-Implementation):** (Remain as previously defined, but will be interpreted in light of the refined design.)
