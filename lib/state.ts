// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Mutex } from "async-mutex";
import { createDraft, finishDraft, type WritableDraft } from "immer";
import type * as z from "zod/v4";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Backend } from "./backend";
import * as schemas from "./schemas";
import { Prompt } from "./prompts";

/**
 * @typedef {z.infer<typeof schemas.View>} View
 * @description Type definition for the application's view state.
 */
export type View = z.infer<typeof schemas.View>;
/**
 * @typedef {z.infer<typeof schemas.World>} World
 * @description Type definition for the game world.
 */
export type World = z.infer<typeof schemas.World>;
/**
 * @typedef {z.infer<typeof schemas.Gender>} Gender
 * @description Type definition for character gender.
 */
export type Gender = z.infer<typeof schemas.Gender>;
/**
 * @typedef {z.infer<typeof schemas.Race>} Race
 * @description Type definition for character race.
 */
export type Race = z.infer<typeof schemas.Race>;
/**
 * @typedef {z.infer<typeof schemas.Character>} Character
 * @description Type definition for a game character.
 */
export type Character = z.infer<typeof schemas.Character>;
/**
 * @typedef {z.infer<typeof schemas.LocationType>} LocationType
 * @description Type definition for location types.
 */
export type LocationType = z.infer<typeof schemas.LocationType>;
/**
 * @typedef {z.infer<typeof schemas.Location>} Location
 * @description Type definition for a game location.
 */
export type Location = z.infer<typeof schemas.Location>;
/**
 * @typedef {z.infer<typeof schemas.SexualContentLevel>} SexualContentLevel
 * @description Type definition for sexual content levels.
 */
export type SexualContentLevel = z.infer<typeof schemas.SexualContentLevel>;
/**
 * @typedef {z.infer<typeof schemas.ViolentContentLevel>} ViolentContentLevel
 * @description Type definition for violent content levels.
 */
export type ViolentContentLevel = z.infer<typeof schemas.ViolentContentLevel>;
/**
 * @typedef {z.infer<typeof schemas.ActionEvent>} ActionEvent
 * @description Type definition for an action event.
 */
export type ActionEvent = z.infer<typeof schemas.ActionEvent>;
/**
 * @typedef {z.infer<typeof schemas.NarrationEvent>} NarrationEvent
 * @description Type definition for a narration event.
 */
export type NarrationEvent = z.infer<typeof schemas.NarrationEvent>;
/**
 * @typedef {z.infer<typeof schemas.CharacterIntroductionEvent>} CharacterIntroductionEvent
 * @description Type definition for a character introduction event.
 */
export type CharacterIntroductionEvent = z.infer<typeof schemas.CharacterIntroductionEvent>;
/**
 * @typedef {z.infer<typeof schemas.LocationChangeEvent>} LocationChangeEvent
 * @description Type definition for a location change event.
 */
export type LocationChangeEvent = z.infer<typeof schemas.LocationChangeEvent>;
/**
 * @typedef {z.infer<typeof schemas.Event>} Event
 * @description Type definition for a generic game event.
 */
export type Event = z.infer<typeof schemas.Event>;
/**
 * @typedef {z.infer<typeof schemas.State>} State
 * @description Type definition for the overall application state.
 */
export type State = z.infer<typeof schemas.State>;

/**
 * @constant initialState
 * @description The initial state of the application, parsed from the schema.
 */
export const initialState: State = schemas.State.parse({
  apiUrl: "http://localhost:5001/v1/",
  apiKey: "",
  model: "",
  generationParams: {
    temperature: 0.5,
  },
  narrationParams: {
    temperature: 0.6,
    min_p: 0.03,
    dry_multiplier: 0.8,
  },
  updateInterval: 200,
  logPrompts: false,
  logParams: false,
  logResponses: false,
  view: "welcome",
  world: {
    name: "[name]",
    description: "[description]",
  },
  locations: [],
  characters: [],
  protagonist: {
    name: "[name]",
    gender: "male",
    race: "human",
    biography: "[biography]",
    locationIndex: 0,
  },
  hiddenDestiny: false,
  betrayal: false,
  oppositeSexMagnet: false,
  sameSexMagnet: false,
  sexualContentLevel: "regular",
  violentContentLevel: "regular",
  isCombat: false,
  events: [],
  actions: [],
});

/**
 * @interface CheckDefinition
 * @description Defines the parameters for a specific check (e.g., a skill check, an attribute check).
 */
export interface CheckDefinition {
  type: string; // e.g., "strength", "stealth", "perception"
  difficultyClass: number; // The target number to beat for a successful check.
  modifiers?: string[]; // Optional: The character attribute and modifiers relevant to the check (e.g., "strength", "dexterity").
}

/**
 * @interface CheckResult
 * @description Captures the outcome of a CheckDefinition being resolved.
 */
export interface CheckResult {
  success: boolean; // True if the check was successful, false otherwise.
  message: string; // A descriptive message about the check's outcome.
  roll?: number; // Optional: The result of the dice roll, if applicable.
}

/**
 * @interface RaceDefinition
 * @description Expands on simply listing race names, including a description for lore and narrative material.
 */
export interface RaceDefinition {
  name: string;
  description: string; // Lore or narrative material for the race
}

/**
 * @interface ClassDefinition
 * @description Provides a class name and a description for lore and narrative material.
 */
export interface ClassDefinition {
  name: string;
  description: string; // Lore or narrative material for the class
}

/**
 * @interface IGameRuleLogic
 * @description Defines a set of optional methods that any game rule (either the default or a plugin-provided one) can implement.
 */
export interface IGameRuleLogic {
  /**
   * @method getInitialProtagonistStats
   * @description Provides a statement that augments the default prompt in `generateProtagonistPrompt`, influencing the protagonist's background, personality, and appearance based on the plugin's internal interpretation of stats.
   * This statement will be inserted into the `generateProtagonistPrompt` at a designated placeholder (e.g., `[PLUGIN_PROTAGONIST_DESCRIPTION]`).
   * (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
   * @returns {string} A statement to augment the protagonist generation prompt.
   */
  getInitialProtagonistStats?(): Promise<string>;

  /**
   * @method modifyProtagonistPrompt
   * @description Alters the PC's background to better suit the game world (e.g., magic is very rare or this game world is mostly water).
   * @param {Prompt} originalPrompt - The original prompt for protagonist generation is read from core application and used as the basis to construct a modified prompt.
   * (Note: The `Prompt` type is defined in `lib/prompts.ts` and has `system: string; user: string;` properties.)
   * @returns {Prompt} The modified prompt.
   */
  modifyProtagonistPrompt?(originalPrompt: Prompt): Prompt;

  /**
   * @method getAvailableRaces
   * @description Provides a list of available races for character creation, including lore for narration.
   * This can impact the character's backstory and story plots due to different race dynamics and world setting.
   * @returns {RaceDefinition[]} An array of race definitions.
   */
  getAvailableRaces?(): RaceDefinition[];

  /**
   * @method getAvailableClasses
   * @description Provides a list of available classes for character creation, including lore for narration.
   * This can influence the narration by providing game world flavor or attitude towards the PC's class (much like how people treat a doctor vs. a janitor).
   * @returns {ClassDefinition[]} An array of class definitions.
   */
  getAvailableClasses?(): ClassDefinition[];

  /**
   * @method getActionChecks
   * @description Specifies what checks are required for a given action, based on the action and current context.
   * This method is triggered when an action is passed to `narratePrompt`.
   * Its implementation will typically involve constructing an LLM prompt, making an API call, and parsing/validating the LLM's JSON response against the `CheckDefinition` schema.
   * @param {string} action - The raw action string performed by the protagonist.
   * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
   * @returns {Promise<CheckDefinition[]>} A promise that resolves to an array of check definitions. If the LLM response is invalid or unparseable, an empty array should be returned as a graceful fallback.
   */
  getActionChecks?(action: string, context: WritableDraft<State>): Promise<CheckDefinition[]>;

  /**
   * @method resolveCheck
   * @description Resolves a game rule check, utilizing rpg-dice-roller, and returns the result as a statement.
   * The plugin will use its internal rules to determine the character's appropriate stat and skill modifier.
   * This statement will be incorporated into the `narratePrompt`'s output, typically after the action description.
   * @param {CheckDefinition} check - The definition of the check to resolve.
   * @param {Character} characterStats - The global `Character` object. The plugin will map this to its internal representation of the character's stats.
   *   (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
   * @returns {string} A statement describing the check's result and any consequences.
   */
  resolveCheck?(check: CheckDefinition, characterStats: Character): string;

  /**
   * @method getNarrationPrompt
   * @description Generates a narration prompt, influenced by the outcome of performed checks and consequences (e.g., HP, item, relationship, story/plot branch changes).
   * @param {string} eventType - The type of event triggering narration.
   * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
   * @param {string[]} [checkResultStatements] - Optional: Statements describing results of checks performed for the event, provided by `resolveCheck`.
   * @param {string} [action] - Optional: The action that triggered the narration.
   * @returns {Promise<string[]>} The generated narration prompt.
   */
  getNarrationPrompt?(eventType: string, context: WritableDraft<State>, checkResultStatements?: string[], action?: string): Promise<string[]>;

  /**
   * @method getCombatRoundNarration
   * @description A dedicated method for handling narration during combat rounds, allowing for different narrative structures and details compared to general scene narration.
   * @param {number} roundNumber - The current combat round number.
   * @param {string[]} combatLog - A minimal log of events that occurred in the combat round, e.g., ["Protagonist attacks Goblin for 5 damage.", "Goblin misses Protagonist."].
   * @returns {string} The narration for the combat round.
   */
  getCombatRoundNarration?(roundNumber: number, combatLog: string[]): string;
}

/**
 * @interface Plugin
 * @description Defines the partial interface for a plugin, including optional methods for initialization, backend retrieval, and location change handling.
 */
export type Plugin = Partial<{
  /**
   * @method init
   * @description Initializes the plugin with provided settings and context.
   * The context is determined by the environment in which the plugin runs,
   * e.g. a frontend that provides methods for adding custom components.
   * @param {Record<string, unknown>} settings - The settings for the plugin.
   * @param {unknown} context - The context object provided by the environment.
   * @returns {Promise<void>}
   */
  init(settings: Record<string, unknown>, context: unknown): Promise<void>;

  /**
   * @method getBackends
   * @description Retrieves a map of backend instances provided by the plugin.
   * @returns {Promise<Record<string, Backend>>} A promise that resolves to a record of backend names to Backend instances.
   */
  getBackends(): Promise<Record<string, Backend>>;

  /**
   * @method onLocationChange
   * @description Callback function triggered when the game location changes.
   * @param {Location} newLocation - The new location object.
   * @param {WritableDraft<State>} state - The writable draft of the current application state.
   * @returns {Promise<void>}
   */
  onLocationChange(newLocation: Location, state: WritableDraft<State>): Promise<void>;

  /**
   * @method getGameRuleLogic
   * @description Retrieves the game rule logic implementation provided by the plugin.
   * @returns {IGameRuleLogic} An instance of the game rule logic.
   */
  getGameRuleLogic?(): IGameRuleLogic;
}>;

/**
 * @interface PluginWrapper
 * @description Represents a plugin wrapped with its metadata and instance.
 * @property {string} name - The name of the plugin.
 * @property {boolean} enabled - Indicates if the plugin is enabled.
 * @property {Record<string, unknown>} settings - The settings for the plugin.
 * @property {Plugin} plugin - The plugin instance.
 */
export interface PluginWrapper {
  name: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  plugin: Plugin;
  selectedPlugin?: boolean;
}

/**
 * @interface Plugins
 * @description Defines the structure for managing multiple plugins within the application state.
 * @property {PluginWrapper[]} plugins - An array of wrapped plugin instances.
 * @property {Record<string, Backend>} backends - A record of backend names to Backend instances.
 * @property {string} activeBackend - The name of the currently active backend.
 */
export interface Plugins {
  plugins: PluginWrapper[];
  backends: Record<string, Backend>;
  activeBackend: string;
}

/**
 * @interface Actions
 * @description Defines the actions available for modifying the application state.
 * @property {(nextStateOrUpdater: StoredState | Partial<StoredState> | ((state: WritableDraft<StoredState>) => void), shouldReplace?: false) => void} set - Function to set or update the state.
 * @property {(updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>} setAsync - Function to asynchronously update the state.
 */
export interface Actions {
  set: (
    nextStateOrUpdater: StoredState | Partial<StoredState> | ((state: WritableDraft<StoredState>) => void),
    shouldReplace?: false,
  ) => void;
  setAsync: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>;
}

/**
 * @typedef {State & Plugins & Actions} StoredState
 * @description Combines the main application state, plugin state, and available actions into a single type.
 */
export type StoredState = State & Plugins & Actions;

/**
 * @constant setAsyncMutex
 * @description A mutex to ensure exclusive access during asynchronous state updates.
 */
const setAsyncMutex = new Mutex();

/**
 * @constant useStateStore
 * @description The Zustand store for managing the application's state.
 * It uses `immer` for immutable updates and `persist` for state persistence.
 */
export const useStateStore = create<StoredState>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      plugins: [],
      backends: {},
      activeBackend: "default",
      set: set,
      setAsync: async (updater) => {
        await setAsyncMutex.runExclusive(async () => {
          // According to https://immerjs.github.io/immer/async/, this is an "anti-pattern", because
          // "updates [...] that happen during the async process, would be "missed" by the draft".
          // However, for our use case, this is actually exactly what we want, because it prevents
          // manual updates during state machine operations from producing inconsistent states.
          const state = get();
          const draft = createDraft(state);

          try {
            await updater(draft);
          } catch (error) {
            // Roll back any changes the updater may have written to the state store.
            set(state);
            // Re-throw the error to be handled by higher-level logic.
            throw error;
          }

          const newState = finishDraft(draft);
          set(newState);
        });
      },
    })),
    {
      name: "state",
      partialize: (state) => {
        // Don't persist functions and class instances.
        const persistedState: Partial<StoredState> = { ...state };

        persistedState.plugins = state.plugins.map((plugin) => {
          const persistedPlugin: Partial<PluginWrapper> = { ...plugin };
          delete persistedPlugin.plugin;
          return persistedPlugin as PluginWrapper;
        });

        delete persistedState.backends;
        delete persistedState.set;
        delete persistedState.setAsync;

        return persistedState;
      },
    },
  ),
);

/**
 * @function getState
 * @description Retrieves the current state from the `useStateStore`.
 * @returns {StoredState} The current application state.
 */
export function getState(): StoredState {
  return useStateStore.getState();
}
