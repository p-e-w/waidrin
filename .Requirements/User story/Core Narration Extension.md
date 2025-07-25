## Feature Specification: Core Narration Extension

### 1. Feature Name

Core Narration Extension: Dynamic Narrative Integration

### 2. Problem Statement

To enhance the core application's narrative generation capabilities by allowing game rule plugins to feed real-time, game-mechanic-driven data and signals directly into the narration process. This aims to create a more immersive and responsive player experience by weaving specific game outcomes (like dice rolls and rule applications) into the story.

### 3. Motivation
Currently, the core application's narration, primarily managed by the `narrate` function within `lib/engine.ts` and utilizing `lib/prompts.ts:narratePrompt`, constructs LLM prompts based on the `state.events` history. While `state.events` captures high-level actions, narration blocks, character introductions, and location changes, it lacks granular detail about the *mechanics* of game events. For instance, it doesn't explicitly convey the specific result of a dice roll, the application of a proficiency bonus, or the precise reason for an advantage/disadvantage.

By enabling game rule plugins (such as `Game-Rule-DnD5E`) to push this mechanical information to the core, the narration can become significantly richer. It will be able to explain *how* and *why* certain narrative outcomes occur, rather than just *what* happened. This directly addresses the need for the narration to interpret and narrate the story based on rule mechanics, providing a more transparent and engaging experience for the player.

### 4. Proposed Solution

#### 4.1. Introduction of a Core Event Bus
A new, central `EventBus` will be introduced within the core application. This `EventBus` will serve as a loosely coupled communication channel, allowing various components (including plugins) to publish events, and other components (specifically the core's narrative generation logic) to subscribe to and consume these events.

#### 4.2. Plugin-Side Event Emission
Game rule plugins will be extended to emit specific, structured events to the core `EventBus` whenever relevant game mechanics are processed or outcomes are determined. This will be facilitated through an extension of the `Context` object provided to plugins.

#### 4.3. Core Narrative Generation Enhancement
The core application's narrative generation logic (within `lib/engine.ts` and `lib/prompts.ts`) will be enhanced to subscribe to these new events. Upon receiving an event, it will incorporate the mechanical details into the LLM prompt, guiding the LLM to generate a more informed and detailed narrative.

### 5. Technical Specification

#### 5.1. Core Event Bus Implementation
*   **Location:** A new module, e.g., `lib/EventBus.ts`.
*   **Structure:**
    ```typescript
    // lib/EventBus.ts
    type EventCallback = (payload: any) => void;

    class EventBus {
        private subscribers: Map<string, EventCallback[]> = new Map();

        publish(eventType: string, payload: any): void {
            const callbacks = this.subscribers.get(eventType);
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        callback(payload);
                    } catch (error) {
                        console.error(`Error in EventBus subscriber for ${eventType}:`, error);
                    }
                });
            }
        }

        subscribe(eventType: string, callback: EventCallback): void {
            if (!this.subscribers.has(eventType)) {
                this.subscribers.set(eventType, []);
            }
            this.subscribers.get(eventType)?.push(callback);
        }

        unsubscribe(eventType: string, callback: EventCallback): void {
            const callbacks = this.subscribers.get(eventType);
            if (callbacks) {
                this.subscribers.set(eventType, callbacks.filter(cb => cb !== callback));
            }
        }
    }

    export const eventBus = new EventBus(); // Singleton instance
    ```
*   **Accessibility:** The `eventBus` singleton instance will be made accessible to components that need to publish or subscribe. For plugins, it will be passed as part of the `Context` object.

#### 5.2. Plugin-Side Event Emission (Example for `Game-Rule-DnD5E` Plugin)
*   **Context Extension:** The `app/plugins.ts:Context` class will be extended to provide a method for plugins to publish events to the core `EventBus`.
    ```typescript
    // app/plugins.ts
    // ... existing imports and interfaces ...
    import { eventBus } from "@/lib/EventBus"; // New import

    export class Context {
        // ... existing constructor and methods ...

        /**
         * @method publishGameEvent
         * @description Publishes a game-specific event to the core EventBus.
         * @param {string} eventType - The type of event (e.g., "roll_result", "rule_explanation", "scenario_signal").
         * @param {object} payload - The structured data associated with the event.
         */
        publishGameEvent(eventType: string, payload: object): void {
            eventBus.publish(eventType, payload);
        }
    }
    ```
*   **Event Hotspots within Plugins:** Within the `Game-Rule-DnD5E` plugin's internal logic (e.g., where dice rolls are resolved, character features are activated, or rule calculations are performed), calls to `this.context.publishGameEvent` will be added.
    *   **`roll_result` Event Payload Schema:**
        ```typescript
        interface RollResultPayload {
            characterId: string; // ID of the character performing the roll
            rollType: "ability_check" | "attack_roll" | "saving_throw";
            attribute?: string; // e.g., "Strength", "Dexterity" (for ability checks/saves)
            skill?: string;     // e.g., "Stealth", "Perception" (for skill checks)
            totalRoll: number;  // Final result after all modifiers
            diceRoll: number;   // Raw d20 result
            modifiers: {
                attributeModifier: number;
                proficiencyBonus?: number;
                other?: number; // Any other situational modifiers
            };
            advantageDisadvantage: "advantage" | "disadvantage" | "none";
            contextDescription: string; // Brief, human-readable description of the roll's purpose
        }
        ```
    *   **`rule_explanation` Event Payload Schema:**
        ```typescript
        interface RuleExplanationPayload {
            characterId: string; // ID of the character affected
            ruleId: string;      // Unique identifier for the rule (e.g., "PROFICIENCY_BONUS_APPLIED", "RECKLESS_ATTACK_EFFECT")
            ruleName: string;    // Human-readable name of the rule (e.g., "Proficiency Bonus", "Reckless Attack")
            explanationKey: string; // A key referencing a pre-defined narrative template or a short explanation string
            details?: Record<string, any>; // Additional context-specific data (e.g., { bonusValue: 2 })
            contextDescription: string; // Brief description of the game situation where the rule was applied
        }
        ```
    *   **`scenario_signal` Event Payload Schema:**
        ```typescript
        interface ScenarioSignalPayload {
            characterId?: string; // ID of the character primarily involved (optional)
            signalId: string;    // Unique identifier for the narrative signal (e.g., "CRITICAL_SUCCESS", "CRITICAL_FAILURE", "MAJOR_SPELL_EFFECT")
            impactLevel: "minor" | "moderate" | "major" | "critical"; // Indicates narrative weight
            details?: Record<string, any>; // Contextual data for narrative generation (e.g., { taskType: "persuasion" })
            contextDescription: string; // Brief description of the game situation that led to the signal
        }
        ```

#### 5.3. Core Narrative Generation Enhancement
*   **Location:** The `lib/engine.ts:narrate` function and the `lib/prompts.ts:narratePrompt` function.
*   **Mechanism:**
    1.  **Event Collection:** A temporary buffer will be introduced within `lib/engine.ts` (or a new `lib/NarrativeEventCollector.ts` module) to collect all game events published by plugins *during a single game turn/narration cycle*. This buffer will be cleared at the beginning of each new narration cycle.
    2.  **Prompt Augmentation:** The `lib/engine.ts:narrate` function will be modified to gather all events from this buffer. These collected events will then be passed as an additional argument to the `lib/prompts.ts:narratePrompt` function.
    3.  **LLM Prompt Construction:** The `lib/prompts.ts:narratePrompt` function will be updated to accept this new `gameEvents` argument. It will then dynamically incorporate the details from these events into the LLM's system or user prompt. This will guide the LLM to generate a narrative that explicitly includes roll results, rule explanations, and the narrative impact of significant signals.

*   **Conceptual `narratePrompt` Modification:**
    ```typescript
    // lib/prompts.ts
    export function narratePrompt(state: State, action?: string, gameEvents?: any[]): Prompt {
        let mechanicalContext = "";
        if (gameEvents && gameEvents.length > 0) {
            mechanicalContext = "\n\n--- Game Mechanics & Results ---\n";
            gameEvents.forEach(event => {
                // Logic to format each event type into a string for the LLM
                // Example: if (event.type === "roll_result") { mechanicalContext += `Roll: ${event.contextDescription} -> ${event.totalRoll}\n`; }
                // ... (detailed formatting based on payload schemas) ...
            });
            mechanicalContext += "------------------------------\n\n";
        }

        return makeMainPrompt(
            `
            ${action ? `The protagonist (${state.protagonist.name}) has chosen to do the following: ${action}.` : ""}
            ${mechanicalContext} // Inject the generated mechanical context here
            Narrate what happens next, using novel-style prose, in the present tense.
            // ... rest of existing prompt instructions ...
            `,
            state,
        );
    }
    ```

### 6. Impact on Existing Components

*   **`app/page.tsx`:** No direct impact on the UI rendering logic. The `EventView` component will continue to render `NarrationEvent`s, but the content of these `NarrationEvent`s (generated by the LLM) will now be richer and more detailed due to the injected mechanical context.
*   **`app/plugins.ts`:** The `Context` class will be extended to include the `publishGameEvent` method.
*   **`lib/engine.ts`:** The `narrate` function will be significantly modified to manage the collection of game events from the `EventBus` and pass them to the `narratePrompt`. It will also be responsible for clearing the event buffer at the start of each narration cycle.
*   **`lib/prompts.ts`:** The `narratePrompt` function will be updated to accept and incorporate the new game event data into the LLM prompt.
*   **`lib/state.ts`:** No direct changes to the `State` schema are immediately required, as the mechanical events are passed directly to the LLM prompt rather than being stored persistently in `state.events` as new event types.
*   **`lib/backend.ts`:** Remains unchanged, as its role is solely to provide the LLM interface.
*   **Plugins (e.g., `Game-Rule-DnD5E`):** Will require internal modifications to call `this.context.publishGameEvent` at appropriate points within their rule processing logic.
