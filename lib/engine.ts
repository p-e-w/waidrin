// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { current } from "immer";
import { throttle } from "lodash";
import * as z from "zod/v4";
import { getBackend } from "./backend";
import {
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
import { getState, initialState, type Location, type LocationChangeEvent, type NarrationEvent } from "./state";
//Test-plugin helper function use
//import { WritableDraft } from "immer";
//import { StoredState } from "./state";

/**
 * @constant RawCharacter
 * @description A Zod schema for a character, omitting the `locationIndex` as it's not determined during initial generation.
 */
const RawCharacter = schemas.Character.omit({ locationIndex: true });

/**
 * @function getBoolean
 * @description Retrieves a boolean value ("yes" or "no") from the backend based on a prompt.
 * @param {Prompt} prompt - The prompt to send to the backend.
 * @param {(token: string, count: number) => void} [onToken] - Optional callback for token updates.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the response is "yes", `false` otherwise.
 */
async function getBoolean(prompt: Prompt, onToken?: (token: string, count: number) => void): Promise<boolean> {
  return (await getBackend().getObject(prompt, z.enum(["yes", "no"]), onToken)) === "yes";
}

/**
 * @function next
 * @description Advances the game state based on the current view and user action.
 * This is the core game loop function, handling transitions between different game stages
 * like connection, genre selection, character generation, scenario setup, and chat.
 * @param {string} [action] - The user's action, if applicable (e.g., in the chat view).
 *   This parameter is used when the user performs an action in the 'chat' view,
 *   which then influences the subsequent narration.
 * @param {(title: string, message: string, tokenCount: number) => void} [onProgress] - Optional callback for progress updates during long operations.
 *   This callback is invoked to provide real-time feedback to the user about the
 *   current operation (e.g., "Generating world", "Tokens generated: X").
 * @returns {Promise<void>} A promise that resolves when the state has been updated
 *   and the game has advanced to the next logical step.
 */
export async function next(
  action?: string,
  onProgress?: (title: string, message: string, tokenCount: number) => void,
): Promise<void> {
  // Retrieve the singleton backend instance. The backend is responsible for
  // communicating with the AI model and performing generation tasks.
  const backend = getBackend();

  // Initiate an asynchronous state update. All modifications within this block
  // are applied to an Immer draft of the state, ensuring immutability.
  // The state is only committed to the global store once this async function completes.
  await getState().setAsync(async (state) => {
    // Declare a variable to hold the current step description. This is used
    // by the `onProgress` callback to inform the user about the ongoing operation.
    let step: [string, string];

    /* Helper function to get tstCount for logging
    *const getTstCount = (currentState: WritableDraft<StoredState>) => {
    *  const testPlugin = currentState.plugins.find(p => p.name === "test-plugin");
    *  return testPlugin?.settings?.tstCount as number | undefined;
    *};
    */

    //console.log("ENGINE: next() - Start of setAsync. Initial tstCount:", getTstCount(state));

    /**
     * @constant onToken
     * @description Throttled callback for updating progress indicators during token streaming.
     *   This function is called whenever a new token (word/character) is received from the backend.
     *   It updates the `onProgress` callback with the current step and token count.
     */
    const onToken = throttle(
      (_token: string, count: number) => {
        // Check if an `onProgress` callback was provided to the `next` function.
        if (onProgress) {
          // Invoke the `onProgress` callback with the current step description
          // and the accumulated token count. This allows the UI to display
          // real-time progress updates.
          onProgress(step[0], step[1], count);
        }
      },
      // The throttling interval is determined by `state.updateInterval`,
      // preventing excessive UI updates during rapid token streaming.
      state.updateInterval,
      // `leading: true` ensures the function is called immediately on the first token.
      // `trailing: true` ensures the function is called after the last token.
      { leading: true, trailing: true },
    );

    /**
     * @constant updateState
     * @description Throttled function to update the global state.
     *   This function is used to commit partial state changes (e.g., streaming narration text)
     *   to the global Zustand store. It takes a snapshot of the current Immer draft (`state`)
     *   and applies it to the store, triggering UI re-renders.
     */
    const updateState = throttle(
      () => {
        // TODO: Can the call to current() be removed?
        // `current(state)` creates an immutable snapshot of the current Immer draft.
        // This snapshot is then used to update the global Zustand store.
        // This ensures that UI components subscribed to the state receive the latest updates.
        getState().set(current(state));
        //console.log("ENGINE: updateState() - Committing state. tstCount:", getTstCount(state));
      },
      // The throttling interval is determined by `state.updateInterval`,
      // preventing excessive state updates during rapid changes.
      state.updateInterval,
      // `leading: true` ensures the function is called immediately on the first update.
      // `trailing: true` ensures the function is called after the last update.
      { leading: true, trailing: true },
    );

    /**
     * @function onLocationChange
     * @description Triggers plugin-specific actions when the game location changes.
     *   This function iterates through all enabled plugins and invokes their `onLocationChange` hook,
     *   allowing plugins to react to location changes and update their internal state or settings.
     * @param {Location} newLocation - The new location object to which the game is transitioning.
     * @returns {Promise<void>} A promise that resolves when all plugin `onLocationChange` hooks have completed.
     */
    const onLocationChange = async (newLocation: Location) => {
      // Iterate over each plugin currently loaded in the application state.
      for (const plugin of state.plugins) {
        // Check if the plugin is enabled, if its instance exists, and if it has
        // an `onLocationChange` method defined.
        if (plugin.enabled && plugin.plugin && plugin.plugin.onLocationChange) {
          // Await the execution of the plugin's `onLocationChange` method.
          // This ensures that all plugin-specific logic for location changes
          // is completed before proceeding.
          await plugin.plugin.onLocationChange(newLocation, state);
          //console.log(`ENGINE: onLocationChange - Plugin ${plugin.name} onLocationChange executed.`);
        }
      }
    };

    /**
     * @function narrate
     * @description Generates and processes narration based on the current game state and an optional action.
     *   This function interacts with the backend to get narration text, updates the game's event log,
     *   and identifies/introduces characters mentioned in the narration.
     * @param {string} [action] - The action taken by the protagonist, if any.
     *   This action influences the content of the generated narration.
     * @returns {Promise<void>} A promise that resolves when narration generation and processing is complete.
     */
    const narrate = async (action?: string) => {
      // Initialize a new NarrationEvent object. This object will store the generated
      // narration text and associated metadata.
      const event: NarrationEvent = {
        type: "narration", // Specifies the type of event as narration.
        text: "", // Placeholder for the generated narration text.
        locationIndex: state.protagonist.locationIndex, // Records the location where the narration occurs.
        referencedCharacterIndices: [], // Will store indices of characters mentioned in the narration.
      };

      // Add the newly created narration event to the global list of events in the state.
      state.events.push(event);

      // Update the `step` variable to indicate that narration is in progress.
      step = ["Narrating", ""];
      // Request narration text from the backend. The `getNarration` method streams
      // tokens, and the callback updates the `event.text` and triggers UI updates.
      event.text = await backend.getNarration(narratePrompt(state, action), (token: string, count: number) => {
        // Append the received token to the narration text.
        event.text += token;
        // Call the throttled `onToken` function to update progress indicators.
        onToken(token, count);
        // Call the throttled `updateState` function to commit partial narration
        // to the global state, enabling real-time streaming in the UI.
        updateState();
      });

      // Initialize a Set to store unique indices of characters referenced in the narration.
      const referencedCharacterIndices = new Set<number>();

      // Character names in the text are surrounded with double asterisks
      // in accordance with the prompt instructions. This loop extracts them.
      for (const match of event.text.matchAll(/\*\*(.+?)(?:'s?)?\*\*/g)) {
        // Extract the character name from the regex match.
        const name = match[1];

        // Iterate through all characters in the game state to find a match.
        for (const [index, character] of state.characters.entries()) {
          // Check if the extracted name matches a character's full name or first name.
          if (character.name === name || character.name.split(" ")[0] === name) {
            // Add the character's index to the set of referenced characters.
            referencedCharacterIndices.add(index);
            // Break the inner loop as the character has been found.
            break;
          }
        }
      }

      // Convert the Set of referenced character indices to an array and assign it to the event.
      event.referencedCharacterIndices = Array.from(referencedCharacterIndices);

      // Create a Set of character indices that have already been introduced in previous events.
      const introducedCharacterIndices = new Set(
        state.events.filter((event) => event.type === "character_introduction").map((event) => event.characterIndex),
      );

      // Iterate through the characters referenced in the current narration.
      for (const characterIndex of event.referencedCharacterIndices) {
        // If a referenced character has not yet been introduced,
        if (!introducedCharacterIndices.has(characterIndex)) {
          // Add a new 'character_introduction' event to the state.
          state.events.push({
            type: "character_introduction",
            characterIndex,
          });
          // Update the global state to reflect the new introduction event.
          updateState();
        }
      }
    };

    try {
      // Validate the current state against its schema before processing.
      // This prevents wasting time and tokens on requests for invalid states
      // and ensures data integrity throughout the game loop.
      schemas.State.parse(state);

      // Handle state transitions based on the current view.
      if (state.view === "welcome") {
        // If the current view is 'welcome', transition to the 'connection' view.
        state.view = "connection";
      } else if (state.view === "connection") {
        // If the current view is 'connection', perform a backend connectivity check.
        // Update the `step` to inform the user about the connection check.
        step = ["Checking connection", "If this takes longer than a few seconds, there is probably something wrong"];
        // Attempt to retrieve a test object from the backend to verify connectivity and schema support.
        const testObject = await backend.getObject({ system: "test", user: "test" }, z.literal("waidrin"), onToken);
        // If the backend's response does not match the expected literal "waidrin",
        // it indicates a problem with backend schema constraints or connectivity.
        if (testObject !== "waidrin") {
          throw new Error("Backend does not support schema constraints");
        }
        // If the connection check is successful, transition to the 'genre' view.
        state.view = "genre";
      } else if (state.view === "genre") {
        // If the current view is 'genre', transition directly to the 'character' view.
        // This implies that genre selection is complete or skipped.
        state.view = "character";
      } else if (state.view === "character") {
        // If the current view is 'character', proceed with world and protagonist generation.

        // Update `step` to indicate world generation is in progress.
        step = ["Generating world", "This typically takes between 10 and 30 seconds"];
        // Request the backend to generate the game world based on the current state.
        // The generated world object is then assigned to `state.world`.
        state.world = await backend.getObject(generateWorldPrompt, schemas.World, onToken);

        // Update `step` to indicate protagonist generation is in progress.
        step = ["Generating protagonist", "This typically takes between 10 and 30 seconds"];
        // Request the backend to generate the protagonist character.
        // The generated character object is assigned to `state.protagonist`.
        state.protagonist = await backend.getObject(generateProtagonistPrompt(state), RawCharacter, onToken);
        // Initialize the protagonist's location to the first location (index 0).
        state.protagonist.locationIndex = 0;

        // After world and protagonist generation, transition to the 'scenario' view.
        state.view = "scenario";
      } else if (state.view === "scenario") {
        // If the current view is 'scenario', proceed with generating the starting location and characters.

        // Update `step` to indicate starting location generation.
        step = ["Generating starting location", "This typically takes between 10 and 30 seconds"];
        // Request the backend to generate the initial game location.
        const location = await backend.getObject(generateStartingLocationPrompt(state), schemas.Location, onToken);

        // Trigger the `onLocationChange` hook for all plugins with the newly generated location.
        // This allows plugins to react to the initial location setup.
        await onLocationChange(location);


        // Add the generated location to the game's list of locations.
        state.locations = [location];
        // Get the index of the newly added location.
        const locationIndex = state.locations.length - 1;
        // Set the protagonist's current location to the newly generated one.
        state.protagonist.locationIndex = locationIndex;

        // Update `step` to indicate character generation.
        step = ["Generating characters", "This typically takes between 30 seconds and 1 minute"];
        // Request the backend to generate a set of starting characters.
        const characters = await backend.getObject(
          generateStartingCharactersPrompt(state),
          RawCharacter.array().length(5),
          onToken,
        );
        // Assign the generated characters to the state, setting their initial location.
        state.characters = characters.map((character) => ({ ...character, locationIndex }));

        // Initialize the game's event log with the first location change event.
        state.events = [
          {
            type: "location_change",
            locationIndex,
            presentCharacterIndices: state.characters.map((_, index) => index),
          },
        ];

        // After scenario setup, transition to the 'chat' view, which is the main game loop.
        state.view = "chat";
      } else if (state.view === "chat") {
        // If the current view is 'chat', this is the main game loop where interactions occur.

        // Clear any previous actions from the state.
        state.actions = [];
        // Update the global state to reflect the cleared actions.
        updateState();

        // If an `action` was provided (e.g., by the user in the chat input),
        if (action) {
          // Add the user's action as a new event to the state.
          state.events.push({
            type: "action",
            action,
          });
          // Update the global state to reflect the new action event.
          updateState();
        }

        // Generate and process narration based on the current state and user action.
        await narrate(action);

        // Check if the location should change based on the current state.
        step = ["Checking for location change", "This typically takes a few seconds"];
        if (!(await getBoolean(checkIfSameLocationPrompt(state), onToken))) {
          // If the backend indicates a location change is needed, define the schema for the new location info.
          const schema = z.object({
            newLocation: schemas.Location, // The new location object.
            accompanyingCharacters: z.enum(state.characters.map((character) => character.name)).array(), // Characters accompanying the protagonist.
          });

          // Update `step` to indicate new location generation.
          step = ["Generating location", "This typically takes between 10 and 30 seconds"];
          // Request the backend to generate the new location and accompanying characters.
          const newLocationInfo = await backend.getObject(generateNewLocationPrompt(state), schema, onToken);

          // Trigger the `onLocationChange` hook for all plugins with the newly generated location.
          //console.log("ENGINE: next() - Before subsequent onLocationChange. tstCount:", getTstCount(state));
          await onLocationChange(newLocationInfo.newLocation);
          //console.log("ENGINE: next() - After subsequent onLocationChange. tstCount:", getTstCount(state));

          // Add the new location to the game's list of locations.
          state.locations.push(newLocationInfo.newLocation);
          // Get the index of the newly added location.
          const locationIndex = state.locations.length - 1;
          // Update the protagonist's location to the new one.
          state.protagonist.locationIndex = locationIndex;

          // Determine which characters are accompanying the protagonist to the new location.
          const accompanyingCharacterIndices = state.characters
            .map((character, index) => (newLocationInfo.accompanyingCharacters.includes(character.name) ? index : -1))
            .filter((index) => index >= 0);

          // Update the location index for all accompanying characters.
          for (const index of accompanyingCharacterIndices) {
            state.characters[index].locationIndex = locationIndex;
          }

          // Prepare the prompt for generating new characters at the new location.
          // This must be called *before* adding the location change event to the state
          // to ensure the prompt reflects the state *before* the event is added.
          const generateCharactersPrompt = generateNewCharactersPrompt(state, newLocationInfo.accompanyingCharacters);

          // Create a new location change event.
          const event: LocationChangeEvent = {
            type: "location_change",
            locationIndex,
            presentCharacterIndices: accompanyingCharacterIndices,
          };

          // Add the location change event to the state.
          state.events.push(event);
          // Update the global state to reflect the new event.
          updateState();

          // Update `step` to indicate new character generation.
          step = ["Generating characters", "This typically takes between 30 seconds and 1 minute"];
          // Request the backend to generate new characters for the new location.
          const characters = await backend.getObject(generateCharactersPrompt, RawCharacter.array().length(5), onToken);
          // Add the newly generated characters to the state, assigning them to the new location.
          state.characters.push(...characters.map((character) => ({ ...character, locationIndex })));

          // Add the indices of the newly generated characters to the location change event.
          for (let i = state.characters.length - characters.length; i < state.characters.length; i++) {
            event.presentCharacterIndices.push(i);
          }

          //console.log("ENGINE: next() - Before narrate (subsequent). tstCount:", getTstCount(state));
          // Generate narration for the new location and characters.
          await narrate();
          //console.log("ENGINE: next() - After narrate (subsequent). tstCount:", getTstCount(state));
        }

        // Update `step` to indicate action generation.
        step = ["Generating actions", "This typically takes a few seconds"];
        // Request the backend to generate a list of possible actions for the current state.
        state.actions = await backend.getObject(
          generateActionsPrompt(state),
          schemas.Action.array().length(3),
          onToken,
        );
      } else {
        // If `state.view` has an unexpected or invalid value, throw an error.
        throw new Error(`Invalid value for state.view: ${state.view}`);
      }

      // Validate the final state before returning to prevent
      // invalid states from being committed to the store.
      schemas.State.parse(state);
    } finally {
      // This `finally` block ensures that cleanup operations are performed
      // regardless of whether an error occurred in the `try` block.

      // Cancel any pending throttled `onToken` updates.
      // This prevents partial updates from confusing the frontend
      // if the function returns before all tokens are processed.
      onToken.cancel();
      // Cancel any pending throttled `updateState` updates.
      // This prevents partial state commits if the function returns prematurely.
      updateState.cancel();
    }
  });
}

/**
 * @function back
 * @description Navigates the game state back to the previous view, if possible.
 * @returns {void}
 */
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

/**
 * @function reset
 * @description Resets the game state to its initial configuration.
 * @returns {void}
 */
export function reset(): void {
  getState().set(initialState);
}

/**
 * @function abort
 * @description Aborts any ongoing backend operations.
 * @returns {void}
 */
export function abort(): void {
  getBackend().abort();
}

/**
 * @function isAbortError
 * @description Checks if a given error is an abort error from the backend.
 * @param {unknown} error - The error to check.
 * @returns {boolean} True if the error is an abort error, false otherwise.
 */
export function isAbortError(error: unknown): boolean {
  return getBackend().isAbortError(error);
}
