# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-22-add-character-class/spec.md

> Created: 2025-07-22
> Status: Ready for Implementation

## Tasks

- [x] 1. **Update State and Schemas for Character Class**
    - [x] 1.1 Add a `Class` enum to `lib/schemas.ts` with the 12 D&D classes.
    - [x] 1.2 Add a `class` property to the `Character` schema in `lib/schemas.ts`.
    - [x] 1.3 Update the `initialState` in `lib/state.ts` to include a default class for the protagonist.

- [x] 2. **Implement Class Selection UI in Character Creation**
    - [x] 2.1 Add a new Radix UI Select component to `views/CharacterSelect.tsx` for class selection.
    - [x] 2.2 The component should be populated with the classes from the new `Class` enum.
    - [x] 2.3 The component's value should be bound to the `protagonist.class` property in the Zustand store.

- [x] 3. **Integrate Class into Character Generation Logic**
    - [x] 3.1 Modify the `generateProtagonistPrompt` function in `lib/prompts.ts` to include the selected character class.

- [x] 4. **Verification**
    - [x] 4.1 Manually test the character creation flow to ensure the class selection works as expected.
    - [x] 4.2 Verify that the generated character biography reflects the chosen class.