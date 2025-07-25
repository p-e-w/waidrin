# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-24-dnd-5e-stats-skills-plugin/spec.md

> Created: 2025-07-24
> Status: Ready for Implementation

## Tasks

- [ ] 1. **Define D&D 5e Schemas and Plugin Hooks (Core Modifications)**
    - [ ] 1.1 Update `lib/schemas.ts` to extend the `Character` schema with `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class`. (Exception: Necessary to define the data structure for D&D 5e attributes within the core state. This is a foundational change to allow the plugin to store its data.)
    - [ ] 1.2 Update `lib/state.ts` to include `on_character_creation` and `on_ability_check` hooks in the `Plugin` interface. (Exception: Essential for the plugin system to expose interaction points for D&D 5e mechanics.)
    - [ ] 1.3 Verify manual tests for schema and plugin hook definitions.

- [ ] 2. **Implement D&D 5e Plugin (Phase 1: Generation & Storage)**
    - [ ] 2.1 Create `plugins/dnd5e-plugin/manifest.json`.
    - [ ] 2.2 Create `plugins/dnd5e-plugin/index.ts` and implement the `on_character_creation` hook.
    - [ ] 2.3 Implement logic within `on_character_creation` to prompt the LLM for D&D 5e attributes and store them in the character object.
    - [ ] 2.4 Verify manual tests for character generation and storage.

- [ ] 3. **Integrate Plugin with Engine (Core Modification)**
    - [ ] 3.1 Modify `lib/engine.ts` to call the `on_character_creation` hook after protagonist and other characters are generated. (Exception: Required for the core game loop to invoke the D&D 5e plugin at the appropriate time during character creation.)
    - [ ] 3.2 Verify manual tests for engine integration.

- [ ] 4. **Adjust LLM Prompts (Core Modification)**
    - [ ] 4.1 Update `lib/prompts.ts` (`generate_protagonist_prompt`, `generate_starting_characters_prompt`) to instruct the LLM to generate D&D 5e attributes in a structured format. (Exception: Necessary to guide the LLM to produce D&D 5e specific data that the plugin can then process.)
    - [ ] 4.2 Verify manual tests for LLM prompting.

- [ ] 5. **Update UI for D&D 5e Attributes Display (Core Modification)**
    - [ ] 5.1 Modify `components/CharacterView.tsx` to display `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class`. (Exception: The UI needs to reflect the new character attributes. While the plugin handles the data, the core UI component is responsible for rendering it.)
    - [ ] 5.2 Verify manual tests for UI display.
