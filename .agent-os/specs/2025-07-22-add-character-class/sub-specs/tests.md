# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-22-add-character-class/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## Test Coverage

### Unit Tests

**CharacterSelect.tsx**
-   Verify that the class dropdown is rendered.
-   Verify that selecting a class updates the application state.

**lib/engine.ts**
-   Verify that the `generateProtagonistPrompt` includes the selected class.

### Integration Tests

-   Verify that the entire character creation flow works as expected with the new class selection feature.
