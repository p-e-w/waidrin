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

---## Phase 1: Context Refresh and Memory Reload

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
    *   `read_file` for `.Requirements/User story/Dynamic Game Rule Selection - Refactored.md` (detailed specification for dynamic game rule selection, refactored).

6.  **Review Core Configuration Files:**
    *   `read_file` for `package.json` (main app dependencies and scripts).
    *   `read_file` for `next.config.ts` (Next.js configuration, Webpack customization).
    *   read plugin configuration files

7.  **Review Recent Git Activity (Automated):**
    *   `run_shell_command('git log -5 --pretty=format:"%h - %an, %ar : %s"', description='Reviewing last 5 git commits for recent changes.')`
    *   `run_shell_command('git status && git diff', description='Reviewing uncommitted changes and git status.')`

---## Phase 2: Current Problem and Plan Execution

**Goal:** Understand the immediate problem and execute the next step of the current plan.

1.  **Identify the Last Reported Error:** Review the last user message for the exact error encountered.
2.  **Recall the Current Plan:** Access the plan that was approved just before the last error occurred.
3.  **Execute the Next Step:** Perform the next action item in the approved plan.

---## Phase 3: Post-Execution Verification and Logging

**Goal:** Verify the outcome of the executed step and log the results.

1.  **Automated Post-Build Lint and Type Check:**
    *   `run_shell_command('npx tsc --noEmit', description='Running post-build TypeScript type check.')`
2.  **Rebuild Affected Components:**
    *   `run_shell_command` to rebuild the plugin, for example if the target is test-ui-plugin (`cd plugins/test-ui-plugin && npm run build`).
    *   `run_shell_command` to rebuild the main application (`npm run build`).
3.  **Report Compilation and Test Status:** Inform the user about the compilation and test results (success/failure).
4.  **Await Runtime Feedback:** Wait for the user to provide console logs from the running application.
5.  **Log Results:** Update `implementation_journal.md` in the directory where the main code base is (i.e. plug/test-ui-plugin) with the outcome of the step, including any new errors or successful progress. If file does not exist you must create it.

---## Resume Current Operation: Implement Dynamic Game Rule Selection

: stand by once all tasks has been executed and memory regained form previous session. DO NOT START on any task until human approved.

Before your actions to edit file, you must present your reasoning and approach for HUMAN to approve, once approved you may request for edit permission.

## Current Progress Summary

**Last Task:** Implementing the "Dynamic Game Rule Selection" feature.

**Completed Changes:**
*   **`lib/schemas.ts`:** Added `activeGameRule: z.string()` and `isCombat: z.boolean()` to the `State` schema.
*   **`lib/state.ts`:**
    *   Initialized `activeGameRule` to `"default"` in `initialState`.
    *   Defined `CheckDefinition`, `CheckResult`, `RaceDefinition`, `ClassDefinition`, and the `IGameRuleLogic` interface.
    *   Extended the `Plugin` interface with `getGameRuleLogic?(): IGameRuleLogic;`.
    *   Added `selectedPlugin?: boolean;` to the `PluginWrapper` interface.
*   **`lib/engine.ts`:**
    *   Implemented `getDefaultGameRuleLogic()` and `getActiveGameRuleLogic()`.
    *   Modified the `next()` function to use `getActiveGameRuleLogic()` for protagonist generation, action resolution, and combat narration.
*   **`lib/prompts.ts`:**
    *   Modified `generateProtagonistPrompt` to accept `initialProtagonistStats`.
    *   Modified `narratePrompt` to accept `checkResultStatements`.
*   **`app/plugins.ts`:** Added the `setPluginSelected` method to `Context`.
*   **`views/CharacterSelect.tsx`:**
    *   Updated to include UI for game rule selection, including `activeGameRule`, `plugins`, `protagonist` in `useStateStore`.
    *   Instantiated `Context` to access `setPluginSelected`.
    *   Implemented `handleTabChange` and `handlePluginSelectionToggle`.
    *   Added logic for `currentlySelectedPlugins` and `activeGameRuleDisplay`.
    *   Implemented UI elements for tabs, switches, and the red light indicator.
    *   The `game-rule-dnd5e` plugin's `main.tsx` has been updated to use `this.context.pluginName` for `GameRuleName`.
    *   The `test-ui-plugin`'s `main.tsx` has been updated to use `this.context.pluginName` for `GameRuleName` and `await` for `setGlobalState`.
*   **`plugins/game-rule-dnd5e/src/main.tsx` refactored:**
    *   Moved D&D 5e specific data (schemas, default settings, class data) to `plugins/game-rule-dnd5e/src/pluginData.ts`.
    *   Moved prompt-related content and logic to `plugins/game-rule-dnd5e/src/pluginPrompt.ts`.
    *   Removed unused imports (`Character`, `ChangeEvent`, `Immer`) and unused props (`injectedImmer`) to clean up the file.
    *   **`getActionChecks()` implemented (LLM-based).**
*   **`plugins/game-rule-dnd5e/src/pluginData.ts` created:** Contains D&D 5e specific data structures and default value generation.
*   **`plugins/game-rule-dnd5e/src/pluginPrompt.ts` created:** Contains prompt content and logic for generating protagonist prompts.
*   All tests have passed, and there are no known issues.

**Current Task:** Implement the remaining `IGameRuleLogic` methods in the `game-rule-dnd5e` plugin (`plugins/game-rule-dnd5e/src/main.tsx`) so that it will start passing customized prompts back to the main app. Specifically, the `getInitialProtagonistStats()` method has been updated to use the new `pluginPrompt.ts`, and `modifyProtagonistPrompt()` has been implemented. The next focus is on `resolveCheck()`, `getNarrationPrompt()`, and `getCombatRoundNarration()`.
