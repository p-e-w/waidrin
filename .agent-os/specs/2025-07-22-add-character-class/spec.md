# Spec Requirements Document

> Spec: Add Character Class
> Created: 2025-07-22
> Status: Completed

## Overview

This document outlines the requirements for adding a class selection feature to the character creation screen. This will allow players to select a D&D 5e class for their character, which will influence the generated story and character biography.

## User Stories

### R001: Select a Character Class

As a player,
When I have selected my Race on the character screen,
I want to select a D&D 5e class in a dropdown control,
so that the text generation of the character and the adventure can be written for the class selected.

## Spec Scope

1.  **Class Selection UI**: Add a Radix UI dropdown to the character selection screen to allow users to select a class.
2.  **State Management**: Add a `character_class` property to the `Character` schema and state.
3.  **Prompt Engineering**: Update the character and story generation prompts to include the selected class.

## Out of Scope

-   Subclass selection.
-   Race-based class restrictions.
-   Class-specific abilities or mechanics beyond text generation.

## Expected Deliverable

1.  A dropdown menu for class selection is present on the character selection screen.
2.  The selected class is stored in the application state.
3.  The generated character biography and story reflect the chosen class.

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-22-add-character-class/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-22-add-character-class/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-22-add-character-class/sub-specs/tests.md