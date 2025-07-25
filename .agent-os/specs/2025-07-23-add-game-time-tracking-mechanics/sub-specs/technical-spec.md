# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/spec.md

> Created: 2025-07-23
> Version: 1.1.0

## Technical Requirements

*   **Game Time Storage**:
    *   Game time will be stored in the application state as a single integer representing the total number of minutes passed since the start of the game (e.g., `gameTime: 1440` for the start of Day 2).
    *   A helper function will be created to format this integer into a user-friendly string (e.g., "Day 2, 00:00").

*   **Time Advancement Logic**:
    *   The LLM will determine the amount of time that has passed for each action.
    *   The prompt sent to the LLM will be enhanced to ask for a time duration in minutes. It will include guidance based on D&D 5e conventions:
        *   **Combat Actions**: Typically take less than a minute (part of a 6-second round).
        *   **Exploration/Detailed Actions**: (e.g., searching a room, picking a lock) Typically take around 10 minutes.
        *   **Travel/Significant Actions**: Can take hours.
    *   The LLM response will be parsed to extract the number of minutes passed, which will be added to the `gameTime` state.

*   **Rest Mechanics**:
    *   The player can initiate a rest from the main menu.
    *   **Short Rest**: Advances game time by **60 minutes**.
    *   **Long Rest**: Advances game time by **480 minutes** (8 hours).

## Approach Options

**Option A:** Add a `gameTime` attribute to the `State` interface in `lib/state.ts`.
- Pros: Simple to implement.
- Cons: None.

**Option B:** Create a new `TimeManager` class to handle all time-related logic.
- Pros: Encapsulates all time-related logic in one place.
- Cons: More complex to implement.

**Selected Approach:** Option A

**Rationale:** Option A is simpler to implement and is sufficient for the current requirements. A formatting utility function can handle display logic without needing a full class.

## External Dependencies

None.
