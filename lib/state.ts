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
  events: [],
  actions: [],
});

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
