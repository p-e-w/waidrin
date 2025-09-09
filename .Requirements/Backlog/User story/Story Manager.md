## Feature Specification: Story Manager: Adventure Module Integration

### 1. Feature Name

Story Manager: Adventure Module Integration

### 2. Problem Statement

To enable the core application to load and progress through pre-defined adventure modules (story outlines). The new `StoryManager` component will interpret these modules, dynamically query game rule plugins for mechanical outcomes, and use these results to guide the narrative flow and user choices, leading the adventure to its conclusion.

### 3. Motivation
The current game flow, primarily driven by the `next` function in `lib/engine.ts`, is largely procedural and generative. It relies heavily on the LLM to create the world, characters, and narrative on the fly. While flexible, this approach makes it challenging to implement structured, pre-authored adventures with specific plot points, puzzles, and encounters that rely on precise rule evaluations.

The `StoryManager` will introduce a "pull" model, where the core application (driven by the module) actively requests rule evaluations from plugins. This allows for:
*   **Author-driven narratives:** Game designers can craft specific plotlines, ensuring a curated experience.
*   **Complex Puzzles/Encounters:** Scenarios can be designed with specific Difficulty Classes (DCs), character interactions, and branching paths that are consistently evaluated.
*   **Consistent Progression:** Ensures the story adheres to a pre-authored arc, while still allowing for dynamic, rule-based outcomes that influence the narrative.

### 4. Proposed Solution

#### 4.1. Core Rule Query Service Interface
A new, standardized interface will be defined within the core application, outlining methods for querying game rule plugins for specific mechanical evaluations (e.g., skill checks, saving throws, character stats).

#### 4.2. Plugin-Side Rule Query Service Implementation
Game rule plugins (e.g., `Game-Rule-DnD5E`) will implement this core interface, providing the concrete logic for evaluating D&D 5e rules when queried by the `StoryManager`.

#### 4.3. New Core Component: Story Manager
A new core component, the `StoryManager`, will be introduced. This component will be responsible for loading adventure modules, tracking the current position within a module, and orchestrating the game flow by interpreting module nodes and querying game rule plugins as needed.

#### 4.4. Adventure Module Definition Format
A structured data format will be defined for authoring adventure modules, allowing for narrative text, player choices, and explicit rule check points.

### 5. Technical Specification

#### 5.1. Core Rule Query Service Interface and Registry
*   **Location:** A new module, e.g., `lib/IRuleQueryService.ts` for the interface and `lib/RuleServiceRegistry.ts` for a registry.
*   **`IRuleQueryService` Structure:**
    ```typescript
    // lib/IRuleQueryService.ts
    export interface IRuleQueryService {
        evaluateSkillCheck(characterId: string, skillName: string, dc: number): Promise<{ success: boolean, totalRoll: number, details: object }>;
        evaluateSavingThrow(characterId: string, attribute: string, dc: number): Promise<{ success: boolean, totalRoll: number, details: object }>;
        // ... other rule evaluation methods (e.g., evaluateAttackRoll, applyDamage, getCharacterStat)
    }
    ```
*   **`RuleServiceRegistry` Structure:**
    ```typescript
    // lib/RuleServiceRegistry.ts
    import type { IRuleQueryService } from "./IRuleQueryService";

    class RuleServiceRegistry {
        private services: Map<string, IRuleQueryService> = new Map();

        register(pluginName: string, service: IRuleQueryService): void {
            this.services.set(pluginName, service);
        }

        get(pluginName: string): IRuleQueryService | undefined {
            return this.services.get(pluginName);
        }
    }
    export const ruleServiceRegistry = new RuleServiceRegistry(); // Singleton instance
    ```
*   **Plugin Registration:** The `app/plugins.ts:Context` class will be extended to allow plugins to register their `IRuleQueryService` implementation with the core `RuleServiceRegistry`.
    ```typescript
    // app/plugins.ts
    // ... existing imports ...
    import { ruleServiceRegistry } from "@/lib/RuleServiceRegistry"; // New import
    import type { IRuleQueryService } from "@/lib/IRuleQueryService"; // New import

    export class Context {
        // ... existing constructor and methods ...

        /**
         * @method registerRuleQueryService
         * @description Registers an implementation of IRuleQueryService with the core.
         * @param {IRuleQueryService} service - The plugin's implementation of the rule query service.
         */
        registerRuleQueryService(service: IRuleQueryService): void {
            ruleServiceRegistry.register(this.pluginName, service);
        }
    }
    ```

#### 5.2. Plugin-Side Rule Query Service Implementation (Example for `Game-Rule-DnD5E` Plugin)
*   **Implementation:** The `Game-Rule-DnD5E` plugin will implement the `IRuleQueryService` interface.
    ```typescript
    // plugins/game-rule-dnd5e/index.ts (conceptual structure)
    import { IRuleQueryService } from "@/lib/IRuleQueryService";
    import { Context } from "@/app/plugins"; // Assuming Context is accessible

    class Dnd5eRuleService implements IRuleQueryService {
        private context: Context; // Store the context to publish events

        constructor(context: Context) {
            this.context = context;
        }

        async evaluateSkillCheck(characterId: string, skillName: string, dc: number): Promise<{ success: boolean, totalRoll: number, details: object }> {
            // ... D&D 5e specific skill check calculation logic ...
            const diceRoll = Math.floor(Math.random() * 20) + 1; // Example raw roll
            const attributeModifier = 3; // Example
            const proficiencyBonus = 2; // Example
            const totalRoll = diceRoll + attributeModifier + proficiencyBonus;
            const success = totalRoll >= dc;

            // Publish events for Feature Spec 1 (Core Narration Extension)
            this.context.publishGameEvent("roll_result", {
                characterId, rollType: "ability_check", skill: skillName, totalRoll, diceRoll,
                modifiers: { attributeModifier, proficiencyBonus }, advantageDisadvantage: "none",
                contextDescription: `attempting a ${skillName} check against DC ${dc}`
            });
            this.context.publishGameEvent("rule_explanation", {
                characterId, ruleId: "PROFICIENCY_BONUS_APPLIED", ruleName: "Proficiency Bonus",
                explanationKey: "proficiency_applied", details: { bonusValue: proficiencyBonus, skillName },
                contextDescription: `${skillName} check`
            });
            if (diceRoll === 20 && success) { // Example critical success
                this.context.publishGameEvent("scenario_signal", {
                    characterId, signalId: "CRITICAL_SUCCESS", impactLevel: "critical",
                    details: { taskType: "skill_check", skillName }, contextDescription: `${skillName} check`
                });
            } else if (diceRoll === 1 && !success) { // Example critical failure
                 this.context.publishGameEvent("scenario_signal", {
                    characterId, signalId: "CRITICAL_FAILURE", impactLevel: "critical",
                    details: { taskType: "skill_check", skillName }, contextDescription: `${skillName} check`
                });
            }

            return { success, totalRoll, details: {} };
        }
        // ... implement other IRuleQueryService methods ...
    }

    // In the plugin's init method (within the plugin's main file, e.g., plugins/game-rule-dnd5e/main.js):
    // export default class GameRuleDnD5EPlugin implements Plugin {
    //     init(settings: Record<string, unknown>, context: Context): Promise<void> {
    //         // ... plugin initialization ...
    //         context.registerRuleQueryService(new Dnd5eRuleService(context));
    //         return Promise.resolve();
    //     }
    //     // ... other plugin methods ...
    // }
    ```

#### 5.3. Adventure Module Definition Format
*   **Location:** A new module, e.g., `lib/AdventureModuleSchema.ts` (using `zod` for schema definition).
*   **Structure (simplified example):**
    ```typescript
    // lib/AdventureModuleSchema.ts
    import * as z from "zod/v4";

    const RuleCheckNode = z.object({
        type: z.literal("rule_check"),
        ruleType: z.enum(["skill_check", "saving_throw", "attack_roll"]),
        pluginName: z.string(), // e.g., "game-rule-dnd5e"
        parameters: z.record(z.string(), z.any()), // Parameters for the IRuleQueryService method call
        onSuccessNodeId: z.string(),
        onFailureNodeId: z.string(),
        onCriticalSuccessNodeId: z.string().optional(), // Optional branching for criticals
        onCriticalFailureNodeId: z.string().optional(), // Optional branching for criticals
    });

    const NarrativeNode = z.object({
        type: z.literal("narrative"),
        text: z.string(), // Pre-authored narrative text
        nextNodeId: z.string().optional(),
    });

    const ChoiceNode = z.object({
        type: z.literal("choice"),
        text: z.string(), // Text presenting the choice
        options: z.array(z.object({
            text: z.string(), // Text for the choice option
            nextNodeId: z.string(),
        })),
    });

    // Define other node types as needed (e.g., 'encounter', 'puzzle', 'item_gain')

    const ModuleNode = z.discriminatedUnion("type", [
        RuleCheckNode,
        NarrativeNode,
        ChoiceNode,
        // ... add other defined node types here
    ]);

    export const AdventureModuleSchema = z.object({
        id: z.string(),
        title: z.string(),
        startNodeId: z.string(),
        nodes: z.record(z.string(), ModuleNode), // A map where keys are node IDs and values are ModuleNode objects
    });
    ```

#### 5.4. New Core Component: Story Manager
*   **Location:** A new module, e.g., `lib/StoryManager.ts`.
*   **Responsibilities:**
    *   **Module Loading:** Provides a method to load an `AdventureModule` (e.g., `loadModule(moduleId: string)`). This would involve fetching and parsing the module data according to `AdventureModuleSchema`.
    *   **Current Node Tracking:** Internally maintains the `current_node_id` within the loaded module.
    *   **Progression Logic (`progressStory` method):** This will be the main method called by `lib/engine.ts:next` to advance the game.
        1.  Fetches the `current_node` from the loaded module based on `current_node_id`.
        2.  **If `narrative` node:**
            *   Creates a `NarrationEvent` (from `lib/state.ts`) with the node's `text`.
            *   Adds this `NarrationEvent` to `state.events`.
            *   Updates `current_node_id` to `nextNodeId`.
        3.  **If `choice` node:**
            *   Presents the choices to the user (e.g., by updating `state.actions` with the choice options, and setting a flag for the UI to render a choice prompt).
            *   Waits for user input (the chosen option's `text` or `index`).
            *   Based on the user's choice, determines the `nextNodeId` and updates `current_node_id`.
        4.  **If `rule_check` node:**
            *   Retrieves the appropriate `IRuleQueryService` from `ruleServiceRegistry` using `node.pluginName`.
            *   Calls the relevant method on the service (e.g., `evaluateSkillCheck`) with `node.parameters`.
            *   Based on the `Promise` result (`success`, `totalRoll`, `details`), determines the `nextNodeId` (prioritizing `onCriticalSuccessNodeId`/`onCriticalFailureNodeId` if applicable, then `onSuccessNodeId`/`onFailureNodeId`).
            *   Updates `current_node_id`.
            *   Crucially, it will also trigger `scenario_signal` events (from Feature Spec 1) via the `eventBus` to inform the `NarrativeProcessor` about the outcome of the rule check, allowing for dynamic narrative generation around the rule check itself.
    *   **Integration with `lib/engine.ts:next`:** The `lib/engine.ts:next` function will be refactored to delegate story progression to the `StoryManager`. Instead of directly calling `backend.getNarration` for general narration, it will call `storyManager.progressStory()`.

### 6. Impact on Existing Components

*   **`app/page.tsx`:** The `Chat` view will interact with the `StoryManager` for actions and progression, rather than directly with `lib/engine.ts:next`'s internal logic for narration/action generation. The `ActionChoice` component will need to be adapted to handle choices provided by the `StoryManager` (from `ChoiceNode`s) in addition to LLM-generated actions.
*   **`app/plugins.ts`:** The `Context` class will be extended to include the `registerRuleQueryService` method.
*   **`lib/engine.ts`:** Will be significantly refactored. The core logic for `next` will primarily become an orchestrator that calls `storyManager.progressStory()`. It will still handle overall state transitions (`view` changes) and error handling. The `narrate` helper function might be removed or simplified, as narration will be driven by the `StoryManager` and `NarrativeProcessor`.
*   **`lib/prompts.ts`:** `narratePrompt` will be enhanced to accept mechanical context (from Feature Spec 1). New prompts might be needed for the `StoryManager` to request specific narrative snippets from the LLM based on module content (e.g., if a `NarrativeNode` has a placeholder that needs LLM expansion).
*   **`lib/state.ts`:** The `State` schema will need to be extended to include `currentModuleId` and `currentModuleNodeId` to persist the `StoryManager`'s state across sessions.
*   **`lib/backend.ts`:** Remains largely unchanged, as it provides the LLM interface.
*   **Plugins (e.g., `Game-Rule-DnD5E`):** Will implement the `IRuleQueryService` interface and register it during their initialization.

### 7. Open Questions / Future Considerations

*   **Module Loading Strategy:** How will adventure modules be loaded? From local files, a remote server, or bundled with the application? This impacts deployment and content management.
*   **Module Authoring Tools:** How will adventure modules be created? A dedicated editor or simple text files? This impacts the ease of content creation.
*   **LLM Role in Story Manager:** While the `StoryManager` primarily uses pre-authored text, the LLM could still be leveraged for dynamic descriptions within `NarrativeNode`s (e.g., filling in details based on character traits or previous events).
*   **Conflict Resolution:** What happens if a plugin's rule evaluation conflicts with a pre-authored module's expectation (e.g., a module expects a specific outcome, but the dice roll says otherwise)? The module's logic should take precedence for progression, but the narrative should reflect the actual rule outcome.
*   **User Input for Rule Checks:** How will the system handle user input that directly influences a rule check (e.g., "I want to try to persuade him" vs. "I want to attack him")? This needs to be integrated into the `choice` nodes or a new `action_prompt` node type in the module.
