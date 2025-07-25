# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-23-add-game-time-tracking-mechanics/spec.md

> Created: 2025-07-23
> Version: 1.0.0

## Test Coverage

### Unit Tests

**`lib/engine.ts`**
- Test that the `next` function advances the game time.
- Test that the `next` function includes the game time in the prompt to the LLM.

### Integration Tests

**Chat View**
- Test that the game time is displayed in the chat view.
- Test that the player can initiate a long or short rest from the main menu.
