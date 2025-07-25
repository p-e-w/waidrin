# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-24-dnd-hp-tracking/spec.md

> Created: 2025-07-24
> Version: 1.0.0

## Manual Test Cases (Scenarios)

### Scenario: Protagonist Takes Damage

**Given** a game in progress with the protagonist at full HP (e.g., 10/10 HP).
**When** an action is selected or a custom action is entered that should lead to the protagonist taking damage (e.g., "Attack the goblin", "Walk through the thorny bush").
**Then** the narration should describe the protagonist taking damage.
**And** the protagonist's current HP should be reduced by a reasonable amount (e.g., 10/10 -> 7/10).
**And** the game should continue if the protagonist's HP is still above 0.

### Scenario: Protagonist Receives Healing

**Given** a game in progress with the protagonist at partial HP (e.g., 5/10 HP).
**When** an action is selected or a custom action is entered that should lead to the protagonist receiving healing (e.g., "Use a healing potion", "Ask the cleric for help").
**Then** the narration should describe the protagonist being healed.
**And** the protagonist's current HP should be increased by a reasonable amount (e.g., 5/10 -> 8/10).
**And** the protagonist's current HP should not exceed their maximum HP (e.g., if 9/10 HP and healed for 5, HP becomes 10/10, not 14/10).

### Scenario: Protagonist Dies from Damage

**Given** a game in progress with the protagonist at very low HP (e.g., 2/10 HP).
**When** an action is selected or a custom action is entered that should lead to the protagonist taking lethal damage (e.g., "Jump into the lava pit", "Fight the dragon alone").
**Then** the narration should describe the protagonist taking damage.
**And** the protagonist's current HP should drop to 0 or below (e.g., 2/10 -> -3/10).
**And** the game should transition to a game-over state.
**And** the narration should clearly describe the protagonist's death.

### Scenario: Protagonist Starts New Game with Correct Initial HP

**Given** the game is at the welcome screen or has been reset.
**When** a new game is started (progressing through genre, character, and scenario selection).
**Then** the protagonist's `maxHp` and `currentHp` should be correctly calculated based on their selected class and Constitution score (e.g., Fighter with 14 Con should have 10 + 2 = 12 HP).
**And** the initial HP should be displayed (if a UI element for HP is added later, otherwise this is an internal check).
