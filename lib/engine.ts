// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { current, isDraft } from "immer";
import { throttle } from "lodash";
import OpenAI from "openai";
import * as z from "zod/v4";
import {
  checkConnectionPrompt,
  checkIfSameLocationPrompt,
  generateActionsPrompt,
  generateNewCharactersPrompt,
  generateNewLocationPrompt,
  generateProtagonistPrompt,
  generateStartingCharactersPrompt,
  generateStartingLocationPrompt,
  generateWorldPrompt,
  narratePrompt,
  type Prompt,
} from "./prompts";
import * as schemas from "./schemas";
import {
  type Actions,
  initialState,
  type LocationChangeEvent,
  type NarrationEvent,
  type State,
  useStateStore,
} from "./state";

// When generating a character, the location isn't determined yet.
const RawCharacter = schemas.Character.omit({ locationIndex: true });

function getState(): State & Actions {
  return useStateStore.getState();
}

let controller = new AbortController();

export function abort(): void {
  controller.abort();
}

export function isAbortError(error: unknown): boolean {
  return error instanceof OpenAI.APIUserAbortError;
}

async function* getResponseStream(prompt: Prompt, params: Record<string, unknown> = {}): AsyncGenerator<string> {
  try {
    const state = getState();
    const client = new OpenAI({
      baseURL: state.apiUrl,
      apiKey: "dummy", // Pollinations doesn't require a real API key
      dangerouslyAllowBrowser: true,
    });

    const stream = await client.chat.completions.create(
      {
        stream: true,
        model: "mistral", // Default to Mistral for Pollinations AI
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        // These are hardcoded because the required number depends on
        // what is being prompted for, which is also hardcoded.
        max_tokens: 4096,
        // Both variants need to be provided, as newer OpenAI models
        // don't support max_tokens, while some inference engines don't
        // support max_completion_tokens.
        max_completion_tokens: 4096,
        ...params,
      },
      { signal: controller.signal },
    );

    for await (const chunk of stream) {
      if (chunk.choices.length === 0) {
        // We must return directly here instead of just breaking the loop,
        // because the OpenAI library calls controller.abort() if streaming
        // is stopped, which would trigger the error-throwing code below.
        return;
      }

      const choice = chunk.choices[0];

      if (choice.delta.content) {
        yield choice.delta.content;
      }

      if (choice.finish_reason) {
        return;
      }
    }

    // The OpenAI library only throws this error if abort() is called
    // during the request itself, not if it is called while the
    // response is being streamed. We throw it manually in this case,
    // so error handling code can easily detect whether an error
    // is the result of a user abort.
    if (stream.controller.signal.aborted) {
      throw new OpenAI.APIUserAbortError();
    }
  } finally {
    // An AbortController cannot be reused after calling abort().
    // Reset the controller so a new one is available for the next operation
    // in case this operation was aborted.
    controller = new AbortController();
  }
}

async function getResponse(
  prompt: Prompt,
  params: Record<string, unknown> = {},
  onToken?: (token: string, count: number) => void,
): Promise<string> {
  const state = getState();

  if (state.logPrompts) {
    console.log(prompt.user);
  }

  if (state.logParams) {
    console.log(isDraft(params) ? current(params) : params);
  }

  let response = "";
  let count = 0;

  // Send empty update at the start of the streaming process
  // to facilitate displaying progress indicators.
  if (onToken) {
    onToken("", 0);
  }

  for await (const token of getResponseStream(prompt, params)) {
    response += token;
    count++;

    if (onToken) {
      onToken(token, count);
    }
  }

  if (state.logResponses) {
    console.log(response);
  }

  return response;
}

async function getResponseAsObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
  prompt: Prompt,
  schema: Schema,
  onToken?: (token: string, count: number) => void,
): Promise<Type> {
  const response = await getResponse(
    prompt,
    {
      ...getState().generationParams,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "FooBar",
          strict: true,
          schema: z.toJSONSchema(schema),
        },
      },
    },
    onToken,
  );

  return schema.parse(JSON.parse(response)) as Type;
}

async function getResponseAsBoolean(
  prompt: Prompt,
  onToken?: (token: string, count: number) => void,
): Promise<boolean> {
  return (await getResponseAsObject(prompt, z.enum(["yes", "no"]), onToken)) === "yes";
}

export async function next(
  action?: string,
  onProgress?: (title: string, message: string, tokenCount: number) => void,
): Promise<void> {
  await getState().setAsync(async (state) => {
    let step: [string, string];

    const onToken = throttle(
      (_token: string, count: number) => {
        if (onProgress) {
          onProgress(step[0], step[1], count);
        }
      },
      state.updateInterval,
      { leading: true, trailing: true },
    );

    const updateState = throttle(
      () => {
        // TODO: Can the call to current() be removed?
        getState().set(current(state));
      },
      state.updateInterval,
      { leading: true, trailing: true },
    );

    const narrate = async (action?: string) => {
      const event: NarrationEvent = {
        type: "narration",
        text: "",
        locationIndex: state.protagonist.locationIndex,
        referencedCharacterIndices: [],
      };

      state.events.push(event);

      step = ["Narrating", ""];
      event.text = await getResponse(
        narratePrompt(state, action),
        state.narrationParams,
        (token: string, count: number) => {
          event.text += token;
          onToken(token, count);
          updateState();
        },
      );

      const referencedCharacterIndices = new Set<number>();

      // Character names in the text are surrounded with double asterisks
      // in accordance with the prompt instructions.
      for (const match of event.text.matchAll(/\*\*(.+?)(?:'s?)?\*\*/g)) {
        const name = match[1];

        for (const [index, character] of state.characters.entries()) {
          if (character.name === name || character.name.split(" ")[0] === name) {
            referencedCharacterIndices.add(index);
            break;
          }
        }
      }

      event.referencedCharacterIndices = Array.from(referencedCharacterIndices);

      const introducedCharacterIndices = new Set(
        state.events.filter((event) => event.type === "character_introduction").map((event) => event.characterIndex),
      );

      for (const characterIndex of event.referencedCharacterIndices) {
        if (!introducedCharacterIndices.has(characterIndex)) {
          state.events.push({
            type: "character_introduction",
            characterIndex,
          });
          updateState();
        }
      }
    };

    try {
      // Validate state before processing to avoid wasting
      // time and tokens on requests for invalid states.
      schemas.State.parse(state);

      if (state.view === "welcome") {
        state.view = "connection";
      } else if (state.view === "connection") {
        step = ["Checking connection", "If this takes longer than a few seconds, there is probably something wrong"];
        await getResponse(checkConnectionPrompt, {}, onToken);

        state.view = "genre";
      } else if (state.view === "genre") {
        state.view = "character";
      } else if (state.view === "character") {
        step = ["Generating world", "This typically takes between 10 and 30 seconds"];
        state.world = await getResponseAsObject(generateWorldPrompt, schemas.World, onToken);

        step = ["Generating protagonist", "This typically takes between 10 and 30 seconds"];
        state.protagonist = await getResponseAsObject(generateProtagonistPrompt(state), RawCharacter, onToken);
        state.protagonist.locationIndex = 0;

        state.view = "scenario";
      } else if (state.view === "scenario") {
        step = ["Generating starting location", "This typically takes between 10 and 30 seconds"];
        state.locations = [await getResponseAsObject(generateStartingLocationPrompt(state), schemas.Location, onToken)];
        const locationIndex = state.locations.length - 1;
        state.protagonist.locationIndex = locationIndex;

        step = ["Generating characters", "This typically takes between 30 seconds and 1 minute"];
        const characters = await getResponseAsObject(
          generateStartingCharactersPrompt(state),
          RawCharacter.array().length(5),
          onToken,
        );
        state.characters = characters.map((character) => ({ ...character, locationIndex }));

        state.events = [
          {
            type: "location_change",
            locationIndex,
            presentCharacterIndices: state.characters.map((_, index) => index),
          },
        ];

        state.view = "chat";
      } else if (state.view === "chat") {
        state.actions = [];
        updateState();

        if (action) {
          state.events.push({
            type: "action",
            action,
          });
          updateState();
        }

        await narrate(action);

        step = ["Checking for location change", "This typically takes a few seconds"];
        if (!(await getResponseAsBoolean(checkIfSameLocationPrompt(state), onToken))) {
          const schema = z.object({
            newLocation: schemas.Location,
            accompanyingCharacters: z.enum(state.characters.map((character) => character.name)).array(),
          });

          step = ["Generating location", "This typically takes between 10 and 30 seconds"];
          const newLocationInfo = await getResponseAsObject(generateNewLocationPrompt(state), schema, onToken);

          state.locations.push(newLocationInfo.newLocation);
          const locationIndex = state.locations.length - 1;
          state.protagonist.locationIndex = locationIndex;

          const accompanyingCharacterIndices = state.characters
            .map((character, index) => (newLocationInfo.accompanyingCharacters.includes(character.name) ? index : -1))
            .filter((index) => index >= 0);

          for (const index of accompanyingCharacterIndices) {
            state.characters[index].locationIndex = locationIndex;
          }

          // Must be called *before* adding the location change event to the state!
          const generateCharactersPrompt = generateNewCharactersPrompt(state, newLocationInfo.accompanyingCharacters);

          const event: LocationChangeEvent = {
            type: "location_change",
            locationIndex,
            presentCharacterIndices: accompanyingCharacterIndices,
          };

          state.events.push(event);
          updateState();

          step = ["Generating characters", "This typically takes between 30 seconds and 1 minute"];
          const characters = await getResponseAsObject(
            generateCharactersPrompt,
            RawCharacter.array().length(5),
            onToken,
          );
          state.characters.push(...characters.map((character) => ({ ...character, locationIndex })));

          for (let i = state.characters.length - characters.length; i < state.characters.length; i++) {
            event.presentCharacterIndices.push(i);
          }

          await narrate();
        }

        step = ["Generating actions", "This typically takes a few seconds"];
        state.actions = await getResponseAsObject(
          generateActionsPrompt(state),
          schemas.Action.array().length(3),
          onToken,
        );
      } else {
        throw new Error(`Invalid value for state.view: ${state.view}`);
      }

      // Validate state before returning to prevent
      // invalid states being committed to the store.
      schemas.State.parse(state);
    } finally {
      // Cancel any pending partial updates to avoid confusing the frontend
      // by a partial update arriving after the function returns.
      onToken.cancel();
      updateState.cancel();
    }
  });
}

export function back(): void {
  getState().set((state) => {
    if (state.view === "welcome") {
      // No previous state exists.
    } else if (state.view === "connection") {
      state.view = "welcome";
    } else if (state.view === "genre") {
      state.view = "connection";
    } else if (state.view === "character") {
      state.view = "genre";
    } else if (state.view === "scenario") {
      state.view = "character";
    } else if (state.view === "chat") {
      // Chat states cannot be unambiguously reversed.
    } else {
      throw new Error(`Invalid value for state.view: ${state.view}`);
    }
  });
}

export function reset(): void {
  getState().set(initialState);
}
