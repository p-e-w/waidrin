// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as z from "zod/v4";

const Text = z.string().trim().nonempty();

const Name = Text.max(100);

const Description = Text.max(2000);

export const Action = Text.max(200);

const Index = z.int();

const RequestParams = z.record(z.string(), z.unknown());

export const View = z.enum(["welcome", "connection", "genre", "character", "scenario", "chat"]);

export const ConnectionType = z.enum(["llamacpp", "openrouter"]);

export const Model = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  provider: z.string(),
  contextLength: z.number().optional(),
  pricing: z
    .object({
      input: z.number(),
      output: z.number(),
    })
    .optional(),
});

export const OpenRouterConfig = z.object({
  apiKey: z.string().optional(),
  selectedModel: z.string().optional(),
});

export const ProviderConfigs = z.object({
  llamacpp: z.object({
    apiUrl: z.string().url(),
  }),
  openrouter: z.object({
    apiKey: z.string().optional(),
    selectedModel: z.string().optional(),
  }),
});

export const World = z.object({
  name: Name,
  description: Description,
});

export const Gender = z.enum(["male", "female"]);

export const Race = z.enum(["human", "elf", "dwarf"]);

export const Character = z.object({
  name: Name,
  gender: Gender,
  race: Race,
  biography: Description,
  locationIndex: Index,
});

export const LocationType = z.enum(["tavern", "market", "road"]);

export const Location = z.object({
  name: Name,
  type: LocationType,
  description: Description,
});

export const SexualContentLevel = z.enum(["regular", "explicit", "actively_explicit"]);

export const ViolentContentLevel = z.enum(["regular", "graphic", "pervasive"]);

export const ActionEvent = z.object({
  type: z.literal("action"),
  action: Action,
});

export const NarrationEvent = z.object({
  type: z.literal("narration"),
  text: Text.max(5000),
  locationIndex: Index,
  referencedCharacterIndices: Index.array(),
});

export const CharacterIntroductionEvent = z.object({
  type: z.literal("character_introduction"),
  characterIndex: Index,
});

export const LocationChangeEvent = z.object({
  type: z.literal("location_change"),
  locationIndex: Index,
  presentCharacterIndices: Index.array(),
});

export const Event = z.discriminatedUnion("type", [
  ActionEvent,
  NarrationEvent,
  CharacterIntroductionEvent,
  LocationChangeEvent,
]);

export const State = z.object({
  apiUrl: z.url(),
  connectionType: ConnectionType,
  openRouterConfig: OpenRouterConfig,
  providerConfigs: ProviderConfigs,
  availableModels: Model.array(),
  generationParams: RequestParams,
  narrationParams: RequestParams,
  updateInterval: z.int(),
  logPrompts: z.boolean(),
  logParams: z.boolean(),
  logResponses: z.boolean(),
  view: View,
  world: World,
  locations: Location.array(),
  characters: Character.array(),
  protagonist: Character,
  hiddenDestiny: z.boolean(),
  betrayal: z.boolean(),
  oppositeSexMagnet: z.boolean(),
  sameSexMagnet: z.boolean(),
  sexualContentLevel: SexualContentLevel,
  violentContentLevel: ViolentContentLevel,
  events: Event.array(),
  actions: Action.array(),
});
