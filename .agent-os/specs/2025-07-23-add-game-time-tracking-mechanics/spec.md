# Spec Requirements Document

> Spec: Add Game Time Tracking Mechanics
> Created: 2025-07-23
> Status: Implemented

## Overview

Implement a system to track in-game time based on D&D 5e conventions, allowing for more immersive and mechanically rich roleplaying experiences, including proper rest mechanics.

## User Stories

### Game Time Advancement

As a player, when I pick or enter an action, I want the system to advance game time based on the action and game situation (distinguishing between combat, exploration, and travel), so that the system can include game time impact in the prompting and text generation and I can use long / short rest game mechanics.

### Initial Game Time and Time of Day

As a player, I want the game to start with an initial date and time of day (e.g., morning, afternoon, evening, night) determined by the LLM based on the initial narrative, and for the LLM to consider the current time of day in its narrations, so that the game feels more immersive and dynamic.

## Spec Scope

1.  **Initial Game Time:** The game will start with an initial date and time of day (morning, afternoon, evening, night) determined by the LLM based on the initial narrative.
2.  **Time Advancement:** The system will advance game time (including date and time of day) in minutes based on player actions, with the duration determined by the LLM following D&D 5e guidelines.
3.  **Time in Narration:** The current game time (date and time of day) will be formatted (e.g., "Day 1, 14:30, Evening") and included in the prompt to the LLM for text generation, and the LLM should consider the time of day in its narrations.
4.  **Rest Mechanics:** The system will support:
    *   **Short Rest**: Advances time by 1 hour.
    *   **Long Rest**: Advances time by 8 hours.

## Out of Scope

*   Complex time-based events and quests (e.g., a ritual that finishes at a specific time).
*   Real-time time progression.
*   Tracking spell or effect durations.

## Expected Deliverable

1.  The game time is advanced when a player performs an action, with the duration determined by the LLM.
2.  The current game time is displayed to the player in a user-friendly format.
3.  The player can initiate a long or short rest, which advances the game clock by the correct duration.

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/sub-specs/tests.md

