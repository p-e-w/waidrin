# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-24-dnd-hp-tracking/spec.md

> Created: 2025-07-24
> Version: 1.0.0

## Technical Requirements

-   **Character Schema Modification**: Add `maxHp: z.number().int().min(0)` and `currentHp: z.number().int()` to the `Character` schema in `lib/schemas.ts`.
-   **HpChangeEvent Definition**: Define a new Zod object `HpChangeEvent` in `lib/schemas.ts` with fields for `type: z.literal("hp_change")`, `characterIndex: Index`, `amount: z.number().int()`, and `reason: Text.max(200).optional()`.
-   **Event Union Update**: Add `HpChangeEvent` to the `Event` discriminated union in `lib/schemas.ts`.
-   **Initial HP Calculation**: Implement a function in `lib/state.ts` to calculate initial `maxHp` and `currentHp` for the protagonist based on their `character_class` and `constitution` modifier, adhering to D&D 5e rules (1st level: max Hit Die roll + Con modifier).
-   **Game Engine Integration**: Modify the `next` function in `lib/engine.ts` to:
    -   Process `HpChangeEvent`s: When an `HpChangeEvent` is encountered in the event stream, update the `currentHp` of the specified character.
    -   Check for Game Over: After processing any `HpChangeEvent` that affects the protagonist, check if `protagonist.currentHp <= 0`. If true, transition to a game-over state and trigger a final narration.
-   **LLM Prompting for HP Changes**: Update relevant prompts (e.g., `narratePrompt`) in `lib/prompts.ts` to encourage the LLM to generate `HpChangeEvent`s in JSON format when characters take damage or are healed. This will likely involve adding a new parameter to `narratePrompt` to indicate if HP changes are expected.
-   **Plugin Structure**: Create a new plugin directory `plugins/hp-tracking-plugin` with `manifest.json` and `main.js`.
    -   `manifest.json`: Define plugin metadata.
    -   `main.js`: Contain logic for handling HP changes, potentially including a custom prompt for the LLM to generate HP changes based on narrative context.

## Approach Options

**Option A: Direct HP Modification in Engine (Selected)**
-   **Description:** The `next` function in `lib/engine.ts` will directly handle the parsing of `HpChangeEvent`s from the LLM's narration and update the protagonist's HP. Game over logic will also reside here.
-   **Pros:** Simpler initial implementation, keeps core game logic centralized.
-   **Cons:** Tightly couples HP logic to the main game loop, less flexible for complex HP rules or multiple characters later.

**Option B: Plugin-Driven HP Modification**
-   **Description:** The `hp-tracking-plugin` would contain the logic for parsing HP changes from narration and updating character HP. The `next` function would call a plugin method to handle HP events.
-   **Pros:** More modular, better separation of concerns, easier to extend for multiple characters or different HP systems in the future.
-   **Cons:** Requires more initial setup for plugin communication, potentially more complex data flow.

**Rationale:** Option A is selected for its simplicity and directness given the current scope (protagonist only, basic HP tracking). While Option B offers better modularity, the immediate goal is to get a functional HP system in place. Future iterations can refactor towards a more plugin-driven approach if the complexity of HP rules or character management increases.

## External Dependencies

-   No new external libraries or packages are anticipated for this feature. All necessary functionalities can be implemented using existing dependencies (Zod for schema validation, Zustand for state management).
