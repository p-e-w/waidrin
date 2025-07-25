# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-24-dnd-5e-stats-skills-plugin/spec.md

> Created: 2025-07-24
> Version: 1.0.0

## Test Coverage (Manual Scenarios)

### Character Generation and Storage

**Scenario: Protagonist Character Generation**
*   **Given** the game is in the 'character' view (after genre selection).
*   **When** the user proceeds to the 'scenario' view, triggering protagonist generation.
*   **Then** the D&D 5e plugin's `on_character_creation` hook should be invoked for the protagonist.
    *   **And** the protagonist object in the game state should contain `ability_scores` (strength, dexterity, constitution, intelligence, wisdom, charisma) with values between 1 and 30.
    *   **And** the protagonist object should contain `skills` (acrobatics, animal_handling, arcana, athletics, deception, history, insight, intimidation, investigation, medicine, nature, perception, performance, persuasion, religion, sleight_of_hand, stealth, survival) with values between 0 and 20.
    *   **And** the protagonist object should contain `hp` (current hit points), `max_hp` (maximum hit points), and `armor_class` with appropriate integer values.

**Scenario: Additional Character Generation**
*   **Given** the game is in the 'scenario' view and the protagonist has been generated.
*   **When** the user proceeds to the 'chat' view, triggering the generation of starting characters for the location.
*   **Then** the D&D 5e plugin's `on_character_creation` hook should be invoked for each new character.
    *   **And** each new character object in the game state should contain `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class` with valid D&D 5e ranges.

**Scenario: LLM Prompting for D&D 5e Attributes**
*   **Given** the `generate_protagonist_prompt` function is called.
*   **When** the prompt is sent to the LLM.
*   **Then** the LLM's response should contain structured data (e.g., JSON) for the protagonist's `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class`.
    *   **And** the D&D 5e plugin should successfully parse this data and apply it to the character object.
*   **Given** the `generate_starting_characters_prompt` function is called.
*   **When** the prompt is sent to the LLM.
*   **Then** the LLM's response should contain structured data for each new character's `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class`.
    *   **And** the D&D 5e plugin should successfully parse this data and apply it to each character object.

### UI Display of D&D 5e Attributes

**Scenario: Protagonist Attributes Display**
*   **Given** a protagonist character has been generated with D&D 5e attributes.
*   **When** the `CharacterView` component is rendered (e.g., in the chat view or character selection).
*   **Then** the UI should display the protagonist's `ability_scores` (Strength, Dexterity, etc.).
    *   **And** the UI should display the protagonist's `skills` (Acrobatics, Stealth, etc.).
    *   **And** the UI should display the protagonist's `hp`, `max_hp`, and `armor_class`.

**Scenario: Other Character Attributes Display**
*   **Given** other characters have been generated with D&D 5e attributes.
*   **When** their `CharacterView` component is rendered (e.g., when hovering over their name in narration).
*   **Then** the UI should display their `ability_scores`, `skills`, `hp`, `max_hp`, and `armor_class`.