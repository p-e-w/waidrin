// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Mutex } from "async-mutex";
import { createDraft, finishDraft, type WritableDraft } from "immer";
import type * as z from "zod/v4";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import * as schemas from "./schemas";

export type View = z.infer<typeof schemas.View>;
export type World = z.infer<typeof schemas.World>;
export type Gender = z.infer<typeof schemas.Gender>;
export type Race = z.infer<typeof schemas.Race>;
export type Character = z.infer<typeof schemas.Character>;
export type LocationType = z.infer<typeof schemas.LocationType>;
export type Location = z.infer<typeof schemas.Location>;
export type SexualContentLevel = z.infer<typeof schemas.SexualContentLevel>;
export type ViolentContentLevel = z.infer<typeof schemas.ViolentContentLevel>;
export type ActionEvent = z.infer<typeof schemas.ActionEvent>;
export type NarrationEvent = z.infer<typeof schemas.NarrationEvent>;
export type CharacterIntroductionEvent = z.infer<typeof schemas.CharacterIntroductionEvent>;
export type LocationChangeEvent = z.infer<typeof schemas.LocationChangeEvent>;
export type Event = z.infer<typeof schemas.Event>;
export type State = z.infer<typeof schemas.State>;

export const initialState: State = schemas.State.parse({
  apiUrl: process.env.NEXT_PUBLIC_POLLINATIONS_API_URL || "https://text.pollinations.ai/openai",
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

const setAsyncMutex = new Mutex();

export interface Actions {
  set: (
    nextStateOrUpdater: State | Partial<State> | ((state: WritableDraft<State>) => void),
    shouldReplace?: false,
  ) => void;
  setAsync: (updater: (state: WritableDraft<State>) => Promise<void>) => Promise<void>;
}

export const useStateStore = create<State & Actions>()(
  persist(
    immer((set, get) => ({
      ...initialState,
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
    },
  ),
);
