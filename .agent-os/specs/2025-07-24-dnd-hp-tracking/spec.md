# Spec Requirements Document

> Spec: D&D HP Tracking Plugin
> Created: 2025-07-24
> Status: Planning

## Overview

Implement a D&D 5th Edition-style Hit Point (HP) tracking system for characters, allowing for dynamic changes based on in-game events and introducing a game-over condition upon reaching 0 HP. This will enhance the realism and challenge of the text-based RPG experience.

## User Stories

### HP Tracking for Protagonist

As a player,
when my character takes damage or receives healing,
I want their HP to be updated accordingly,
so that I can track their health status and the game can react to it.

### Game Over on 0 HP

As a player,
when my character's HP drops to 0 or below,
I want the game to end with a narration of their demise,
so that there is a clear consequence for critical health loss.

## Spec Scope

1.  **Character HP Attributes** - Add `maxHp` and `currentHp` to the `Character` schema.
2.  **Initial HP Calculation** - Implement logic to calculate initial HP for the protagonist based on D&D 5e rules (class Hit Die + Constitution modifier).
3.  **HP Change Event** - Define a new event type (`HpChangeEvent`) to represent changes in character HP (damage or healing).
4.  **HP Update Mechanism** - Implement a mechanism within the game engine to process `HpChangeEvent`s and update character HP.
5.  **Game Over Condition** - Introduce a check for protagonist HP <= 0, triggering a game-over state and a narrative conclusion.
6.  **LLM Integration for HP Changes** - Instruct the LLM to generate `HpChangeEvent`s based on narrative context (e.g., combat, healing spells).

## Out of Scope

-   HP tracking for NPCs (Non-Player Characters).
-   Complex combat mechanics (e.g., initiative, attack rolls, saving throws).
-   Leveling up and associated HP increases.
-   Short/Long Rest HP recovery mechanics (beyond simply advancing game time).
-   Detailed HP display in the UI beyond the current health status.

## Expected Deliverable

1.  The protagonist's HP is correctly initialized at the start of a new game.
2.  The game engine can process events that modify the protagonist's HP.
3.  The game correctly identifies when the protagonist's HP reaches 0 or below and triggers a game-over state.
4.  The LLM can be prompted to generate HP changes based on narrative events.
