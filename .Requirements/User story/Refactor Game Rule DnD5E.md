## Refactor Specification: Game-Rule-DnD5E Plugin for Dynamic Game Rule Selection

### 1. Feature Name

Refactoring Game-Rule-DnD5E Plugin for Dynamic Game Rule Selection

### 2. Problem Statement

The existing `game-rule-dnd5e` plugin likely contains D&D 5e specific logic implicitly integrated or scattered within its components. With the introduction of the `DynamicGameRuleSelection` feature, there is a need to:

1.  Explicitly encapsulate D&D 5e specific game rule logic within the plugin.
2.  Integrate this logic with the core application's new `IGameRuleLogic` interface.
3.  Manage all D&D 5e specific character attributes (abilities, skills, traits, inventory, etc.) and static game data (all skills, spells, conditions) within the plugin's dedicated namespace in the `pluginData` object, rather than relying on extensions to the core `Character` schema.
4.  Ensure the plugin's UI components (`CharacterUI`) correctly interact with this plugin-managed dynamic data.

### 3. Proposed Solution

The `game-rule-dnd5e` plugin will be refactored to implement the `IGameRuleLogic` interface, providing D&D 5e specific behaviors for character generation and other game mechanics. All extensive D&D 5e related abilities, skills, traits, and static game data will be dynamically stored and managed within the plugin's dedicated namespace in the main application's `pluginData` object. The plugin's `CharacterUI` components will be updated to read from and write to this plugin-managed data.

### 4. Key Design Principle

The core application's `State` schema (defined in `lib/schemas.ts`) will remain generic and will **not** be altered to include plugin-specific functions or data structures (e.g., D&D 5e abilities, Pokémon types). Instead, each game rule plugin is entirely responsible for:

*   Defining its own internal data schemas (e.g., `Dnd5eCharacterDataSchema`, `PokemonCharacterDataSchema`).
*   Storing all its specific data within its dedicated `settings` object (e.g., `state.plugins.find(p => p.name === 'game-rule-dnd5e').settings`).
*   Performing its own type-checking and validation against its internal schemas when interacting with this data.
*   Implementing the `IGameRuleLogic` interface to provide game-specific behaviors, which will then operate on its own managed data within `pluginData`.

This ensures that the core application remains agnostic to the specifics of any particular game system, allowing for seamless switching between vastly different rule sets (e.g., D&D 5e and Pokémon) without requiring changes to the core application's schema or logic.

### 5. Technical Specification

#### 5.1. Affected Files (within `plugins/game-rule-dnd5e/`)

*   `src/main.tsx` (or `main.js`): Will implement `IGameRuleLogic` and manage data initialization.
*   `src/DndStatsConfigPage.jsx`: Will be updated to interact with `pluginData`.
*   New file: `src/schemas.ts` (or similar): To define internal D&D 5e data schemas.
*   New file: `src/constants.ts` (or similar): To store static D&D 5e data (e.g., list of skills, spells).

#### 5.2. Separation of Concerns: Plugin Logic vs. UI Components

It is crucial to maintain a clear separation between the plugin's core logic and its UI components. This design choice is based on the following principles:

*   **`src/main.tsx` (Plugin Entry/Logic):** This file will serve as the plugin's primary entry point and house its core logic. Its responsibilities include:
    *   Initializing the plugin (`init` method).
    *   Providing the `IGameRuleLogic` implementation, which encapsulates D&D 5e specific rules and calculations.
    *   Handling any other top-level plugin lifecycle events or backend-like functionalities (e.g., `onLocationChange`).
    *   React component to rendering the user interface for D&D 5e character configuration and handling user interactions. It will read data from the application state (specifically the plugin's namespace within `pluginData`) and write data back to it.

*   **`src/config.tsx` (UI Component):** This file will contain rule specific config data like attribute schema, class and sub class hierarchy, skill and spell descriptions, etc...

This separation avoids the "God object" anti-pattern, where a single file becomes responsible for too many unrelated tasks. It significantly improves modularity, testability, maintainability, and readability, especially as the D&D 5e plugin grows in complexity to manage extensive game data.

#### 5.2. Detailed Changes

##### 5.2.1. Internal D&D 5e Data Schema (`plugins/game-rule-dnd5e/src/schemas.ts`)

Define comprehensive Zod schemas for all D&D 5e specific character attributes and static game data.

```typescript
// plugins/game-rule-dnd5e/src/schemas.ts (Conceptual)
import * as z from "zod/v4";

export const AbilityScoreSchema = z.object({
  value: z.number().int().min(1).max(30),
  modifier: z.number().int(),
});

export const SkillSchema = z.object({
  proficiency: z.boolean(),
  value: z.number().int(),
});

export const TraitSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const Dnd5eCharacterDataSchema = z.object({
  abilities: z.record(z.enum(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]), AbilityScoreSchema),
  skills: z.record(z.string(), SkillSchema),
  traits: z.array(TraitSchema),
  hitDice: z.record(z.string(), z.number().int()),
  spellSlots: z.record(z.string(), z.number().int()),
  knownSpells: z.array(z.string()),
  inventory: z.array(z.object({ name: z.string(), quantity: z.number().int() })),
  currency: z.record(z.enum(["cp", "sp", "gp", "pp"]), z.number().int()),
  conditions: z.array(z.string()),
});

export const Dnd5eGameDataSchema = z.object({
  allSkills: z.record(z.string(), z.string()),
  allSpells: z.record(z.string(), z.object({ description: z.string(), level: z.number().int() })),
  allConditions: z.array(z.string()),
});

export const Dnd5ePluginStateSchema = z.object({
  characters: z.record(z.string(), Dnd5eCharacterDataSchema),
  gameData: Dnd5eGameDataSchema,
});
```

##### 5.2.2. Plugin's `init()` Method (`plugins/game-rule-dnd5e/src/main.tsx`)

The `init` method will be responsible for initializing the plugin's extensive data structure within `state.pluginData['game-rule-dnd5e']`.

```typescript
// plugins/game-rule-dnd5e/src/main.tsx (Conceptual)
import { getState, type Plugin } from "@/lib/state";
import { Dnd5ePluginStateSchema } from "./schemas";
import { DEFAULT_DND5E_GAME_DATA } from "./constants";

class Dnd5ePlugin implements Plugin {
  async init(settings: Record<string, unknown>, context: Context): Promise<void> {
    // The 'settings' object passed to init already contains the persisted settings
    // or the default values from manifest.json.
    // We just need to ensure any expected variables are properly initialized if not present.

    // Ensure 'characters' and 'gameData' are initialized within the settings
    if (!settings.characters) {
      settings.characters = {};
    }
    if (!settings.gameData) {
      settings.gameData = DEFAULT_DND5E_GAME_DATA;
    }

    // Example: Initialize protagonist-specific data if not present
    // This part would typically happen when a new protagonist is created or selected,
    // not necessarily every time the plugin initializes.
    // For now, we'll keep it conceptual as it depends on how protagonist ID is managed.
    // const protagonistId = stateDraft.protagonist.name; // This would be from the global state, not directly available here
    // if (!settings.characters[protagonistId]) {
    //   settings.characters[protagonistId] = {
    //     abilities: { /* default D&D 5e ability scores */ },
    //     skills: { /* default D&D 5e skills */ },
    //     traits: [],
    //     hitDice: {},
    //     spellSlots: {},
    //     knownSpells: [],
    //     inventory: [],
    //     currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
    //     conditions: [],
    //   };
    // }
  }
}
```

##### 5.2.3. Implementation of `IGameRuleLogic` (`plugins/game-rule-dnd5e/src/main.tsx`)

Create a class that implements `IGameRuleLogic` and provides D&D 5e specific behaviors. This class will interact with the data stored in `state.pluginData['game-rule-dnd5e']`.

```typescript
// plugins/game-rule-dnd5e/src/main.tsx (Conceptual)
import { type IGameRuleLogic, type Character, getState } from "@/lib/state";
import { type Prompt } from "@/lib/prompts";
import { Dnd5eCharacterDataSchema, Dnd5ePluginStateSchema } from "./schemas";

class Dnd5eGameRuleLogic implements IGameRuleLogic {
  private getDnd5ePluginSettings() {
    const state = getState();
    const dnd5ePlugin = state.plugins.find(p => p.name === 'game-rule-dnd5e');
    if (!dnd5ePlugin) {
      console.error("Dnd5e plugin not found in state. This should not happen.");
      return null;
    }
    return dnd5ePlugin.settings as z.infer<typeof Dnd5ePluginStateSchema>;
  }

  getInitialProtagonistStats(): Partial<Character> {
    const dnd5eData = this.getDnd5ePluginSettings();
    if (!dnd5eData) return {};

    const state = getState();
    const protagonistId = state.protagonist.name;
    const characterDnd5eData = dnd5eData.characters[protagonistId];

    if (!characterDnd5eData) return {};

    return {
      // Example: hp calculation based on D&D 5e rules
      // hp: characterDnd5eData.abilities.constitution.modifier * 2 + 10,
    };
  }

  modifyProtagonistPrompt(originalPrompt: Prompt): Prompt {
    const dnd5eData = this.getDnd5ePluginSettings();
    if (!dnd5eData) return originalPrompt;

    const dnd5eGameData = dnd5eData.gameData;

    const dnd5eInstructions = `
      Ensure the character adheres to Dungeons & Dragons 5th Edition rules.
      Include 6 ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) appropriate for a level 1 character.
      Consider common D&D 5e races and classes.
      Proficiencies should be chosen from: ${Object.keys(dnd5eGameData.allSkills).join(', ')}.
    `;
    return {
      system: originalPrompt.system + dnd5eInstructions,
      user: originalPrompt.user,
    };
  }
}

class Dnd5ePlugin implements Plugin {
  getGameRuleLogic(): IGameRuleLogic {
    return new Dnd5eGameRuleLogic();
  }
}
```

##### 5.2.4. `CharacterUI` Interaction with `pluginData` (`plugins/game-rule-dnd5e/src/DndStatsConfigPage.jsx`)

The `CharacterUI` components will be updated to read from and write to the plugin's specific data within `state.pluginData`.

```javascript
// plugins/game-rule-dnd5e/src/DndStatsConfigPage.jsx (Conceptual)
import React from 'react';
import { useStateStore } from '@/lib/state';
import { usePluginsStateStore } from '@/app/plugins';
import { Dnd5ePluginStateSchema } from './schemas';

export default function DndStatsConfigPage() {
  const { protagonist, set } = useStateStore();

  // Access the D&D 5e plugin's settings directly from the state
  const dnd5ePluginSettings = useStateStore.getState().plugins.find(p => p.name === 'game-rule-dnd5e')?.settings as z.infer<typeof Dnd5ePluginStateSchema>;

  const dnd5eData = dnd5ePluginSettings?.characters[protagonist.name];

  if (!dnd5eData) {
    return <div>Loading D&D 5e data...</div>;
  }

  const handleAbilityChange = (ability: string, value: number) => {
    set((stateDraft) => {
      const dnd5ePluginDraft = stateDraft.plugins.find(p => p.name === 'game-rule-dnd5e');
      if (dnd5ePluginDraft && dnd5ePluginDraft.settings && dnd5ePluginDraft.settings.characters && dnd5ePluginDraft.settings.characters[protagonist.name]) {
        const characterData = dnd5ePluginDraft.settings.characters[protagonist.name] as z.infer<typeof Dnd5eCharacterDataSchema>;
        characterData.abilities[ability].value = value;
        characterData.abilities[ability].modifier = Math.floor((value - 10) / 2);
      }
    });
  };

  return (
    <div>
      <h3>D&D 5e Character Details</h3>
      {Object.entries(dnd5eData.abilities).map(([ability, data]) => (
        <div key={ability}>
          <label>{ability.charAt(0).toUpperCase() + ability.slice(1)}:</label>
          <input
            type="number"
            value={data.value}
            onChange={(e) => handleAbilityChange(ability, parseInt(e.target.value))}
          />
          <span> (Modifier: {data.modifier})</span>
        </div>
      ))}
    </div>
  );
}
```

### 6. Benefits

*   **Complete D&D 5e Encapsulation:** All D&D 5e specific logic and data are now fully contained within the plugin, promoting modularity.
*   **Clear Interface:** The `IGameRuleLogic` provides a well-defined contract for how the D&D 5e plugin interacts with the core engine.
*   **Scalability:** The `pluginData` object allows for virtually unlimited expansion of D&D 5e specific data without impacting the core application's schema.
*   **Type Safety (within Plugin):** The plugin can leverage its own internal Zod schemas for robust type-checking and validation of its complex D&D 5e data structures.
*   **Seamless Switching:** The core application can switch to other game rules (e.g., Pokémon) without any D&D 5e specific code interfering, as all its data and logic are isolated.

### 7. Risks/Considerations

*   **Data Migration:** If the internal D&D 5e data schema changes in future plugin versions, a robust migration strategy will be needed within the plugin's `init` method to handle existing saved game data.
*   **Performance:** Managing very large and complex data structures within `pluginData` could have performance implications, especially during state updates. Optimization strategies (e.g., partial updates, memoization) might be necessary.
*   **Plugin Complexity:** The plugin itself becomes more complex due to managing its own schemas, data initialization, and interactions with `pluginData`.
*   **Debugging:** Debugging issues related to plugin-specific data might require inspecting the `pluginData` object directly and understanding the plugin's internal schemas.
