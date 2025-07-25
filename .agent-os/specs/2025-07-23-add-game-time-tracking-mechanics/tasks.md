# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/spec.md

> Created: 2025-07-23
> Status: Ready for Implementation

## Tasks

- [x] 1. Update `gameTime` to include date and time of day
  - [x] 1.1 Modify `State` interface in `lib/state.ts` to use a more comprehensive time tracking (e.g., `Date` object or a custom time object with date, hour, minute).
  - [x] 1.2 Update initial state in `lib/state.ts` to set the initial date and time based on LLM.
  - [x] 1.3 Write tests for the updated `gameTime` structure.
  - [x] 1.4 Verify all tests pass.

- [x] 2. Update `next` function to advance game time (including date and time of day)
  - [x] 2.1 Update `next` function in `lib/engine.ts` to advance game time, considering date and time of day.
  - [x] 2.2 Write tests for the updated `next` function.
  - [x] 2.3 Verify all tests pass.

- [x] 3. Ensure LLM considers time of day in narration
  - [x] 3.1 Modify `narratePrompt` in `lib/prompts.ts` to include the current time of day (morning, afternoon, evening, night) in the prompt.
  - [x] 3.2 Write tests to verify the LLM considers time of day in narration.
  - [x] 3.3 Verify all tests pass.

- [x] 4. Display game time (date and time of day) in the UI
  - [x] 4.1 Update `Chat.tsx` to display the full game time (date and time of day).
  - [x] 4.2 Write tests for displaying the full game time.
  - [x] 4.3 Verify all tests pass.

- [x] 5. Add rest mechanics
  - [x] 5.1 Add rest options to `MainMenu.tsx`.
  - [x] 5.2 Implement rest logic in `lib/engine.ts` to advance game time (including date and time of day) for short and long rests.
  - [x] 5.3 Write tests for rest mechanics.
  - [x] 5.4 Verify all tests pass.
