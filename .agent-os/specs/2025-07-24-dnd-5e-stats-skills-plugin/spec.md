# Spec Requirements Document

> Spec: D&D 5e Stats and Skills Plugin
> Created: 2025-07-24
> Status: Planning

## Overview

Implement a plugin to integrate Dungeons & Dragons 5th Edition (D&D 5e) character statistics and skill mechanics into the Waidrin RPG engine. This will enable the generation, storage, and utilization of D&D 5e ability scores, skills, HP, and Armor Class for characters, and provide a framework for performing ability/skill checks.

## User Stories

### Character Generation with D&D 5e Attributes

As a player, I want my character to have D&D 5e ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) and skills (Acrobatics, Stealth, etc.), so that the game can use these attributes for mechanics and narration.

### Ability and Skill Checks

As a player, I want the game to perform D&D 5e-style ability and skill checks, including dice rolls, modifiers, and determination of success/failure with critical outcomes, so that my character's actions are resolved according to D&D 5e rules.

### Visual Display of D&D 5e Attributes

As a player, I want to see my character's D&D 5e ability scores, skills, HP, and Armor Class displayed in the UI, so that I can easily track my character's capabilities.

## Spec Scope

1.  **Plugin Definition**: Define new plugin hooks in `lib/state.ts` for character attribute initialization and ability/skill checks.
2.  **Character Schema Extension**: Modify the `Character` schema in `lib/schemas.ts` to include D&D 5e ability scores (base scores only), skills (base scores only), HP, Max HP, and Armor Class.
3.  **D&D 5e Plugin Implementation (Phase 1 - Generation/Storage)**: Create a new plugin (`plugins/dnd5e-plugin`) that implements the `onCharacterCreation` hook to generate and store D&D 5e ability scores, skills, HP, and Armor Class for new characters.
4.  **Engine Integration (Phase 1)**: Modify `lib/engine.ts` to call the `onCharacterCreation` plugin hook during character generation.
5.  **Prompt Adjustment (Phase 1)**: Update `lib/prompts.ts` to guide the LLM in generating D&D 5e-compatible character descriptions including ability scores and skills.
6.  **UI Display (Phase 1)**: Implement the visual display of D&D 5e ability scores, skills, HP, and Armor Class within the character view in the UI.

## Out of Scope

-   Full D&D 5e combat system implementation.
-   Complex D&D 5e character creation (e.g., classes, subclasses, feats, spells).
-   Automatic calculation of modifiers and proficiency bonuses for display (only base scores will be stored and displayed in Phase 1).

## Expected Deliverable

1.  A functional D&D 5e plugin that successfully generates and stores D&D 5e ability scores, skills, HP, and Armor Class for newly created characters.
2.  The character view in the UI will display the generated D&D 5e attributes.
3.  The game engine will correctly invoke the `onCharacterCreation` hook during character generation.
4.  The LLM will generate character descriptions that include D&D 5e attributes as requested by the prompts.

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-24-dnd-5e-stats-skills-plugin/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-24-dnd-5e-stats-skills-plugin/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-24-dnd-5e-stats-skills-plugin/sub-specs/tests.md