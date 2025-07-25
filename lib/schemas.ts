// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as z from "zod/v4";

/**
 * @constant Text
 * @description Zod schema for a non-empty, trimmed string.
 */
const Text = z.string().trim().nonempty();

/**
 * @constant Name
 * @description Zod schema for a name, with a maximum length of 100 characters.
 */
const Name = Text.max(100);

/**
 * @constant Description
 * @description Zod schema for a description, with a maximum length of 2000 characters.
 */
const Description = Text.max(2000);

/**
 * @constant Action
 * @description Zod schema for an action, with a maximum length of 200 characters.
 */
export const Action = Text.max(200);

/**
 * @constant Index
 * @description Zod schema for an integer index.
 */
const Index = z.int();

/**
 * @constant RequestParams
 * @description Zod schema for a record of string keys to unknown values, used for request parameters.
 */
const RequestParams = z.record(z.string(), z.unknown());

/**
 * @constant View
 * @description Zod enum schema for different views in the application.
 */
export const View = z.enum(["welcome", "connection", "genre", "character", "scenario", "chat"]);

/**
 * @constant World
 * @description Zod schema for a game world, including its name and description.
 */
export const World = z.object({
  name: Name,
  description: Description,
});

/**
 * @constant Gender
 * @description Zod enum schema for character gender.
 */
export const Gender = z.enum(["male", "female"]);

/**
 * @constant Race
 * @description Zod enum schema for character race.
 */
export const Race = z.enum(["human", "elf", "dwarf"]);

/**
 * @constant Character
 * @description Zod schema for a game character, including name, gender, race, biography, and location index.
 */
export const Character = z.object({
  name: Name,
  gender: Gender,
  race: Race,
  biography: Description,
  locationIndex: Index,
});

/**
 * @constant LocationType
 * @description Zod enum schema for different types of locations.
 */
export const LocationType = z.enum(["tavern", "market", "road"]);

/**
 * @constant Location
 * @description Zod schema for a game location, including name, type, and description.
 */
export const Location = z.object({
  name: Name,
  type: LocationType,
  description: Description,
});

/**
 * @constant SexualContentLevel
 * @description Zod enum schema for different levels of sexual content.
 */
export const SexualContentLevel = z.enum(["regular", "explicit", "actively_explicit"]);

/**
 * @constant ViolentContentLevel
 * @description Zod enum schema for different levels of violent content.
 */
export const ViolentContentLevel = z.enum(["regular", "graphic", "pervasive"]);

/**
 * @constant ActionEvent
 * @description Zod schema for an action event, containing the type and the action itself.
 */
export const ActionEvent = z.object({
  type: z.literal("action"),
  action: Action,
});

/**
 * @constant NarrationEvent
 * @description Zod schema for a narration event, including text, location index, and referenced character indices.
 */
export const NarrationEvent = z.object({
  type: z.literal("narration"),
  text: Text.max(5000),
  locationIndex: Index,
  referencedCharacterIndices: Index.array(),
});

/**
 * @constant CharacterIntroductionEvent
 * @description Zod schema for a character introduction event, containing the type and the character index.
 */
export const CharacterIntroductionEvent = z.object({
  type: z.literal("character_introduction"),
  characterIndex: Index,
});

/**
 * @constant LocationChangeEvent
 * @description Zod schema for a location change event, including the new location index and present character indices.
 */
export const LocationChangeEvent = z.object({
  type: z.literal("location_change"),
  locationIndex: Index,
  presentCharacterIndices: Index.array(),
});

/**
 * @constant Event
 * @description Zod discriminated union schema for all possible event types.
 */
export const Event = z.discriminatedUnion("type", [
  ActionEvent,
  NarrationEvent,
  CharacterIntroductionEvent,
  LocationChangeEvent,
]);

/**
 * @constant State
 * @description Zod schema for the entire application state.
 */
export const State = z.object({
  apiUrl: z.url(),
  apiKey: z.string().trim(),
  model: z.string().trim(),
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
