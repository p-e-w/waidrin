// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  bubbltaco

import type { LocationChangeEvent, NarrationEvent, State } from "./state";

// Type that represents each scene in context
interface Scene {
  // text for the entire scene
  text: string;
  // the summary for the scene
  summary?: string;
  // whether to use the scene summary in the context or not
  summarize: boolean;
}

/**
 * Get the context of events given the current state and token budget that we need to fit within.
 * @param state The current state.
 * @param tokenBudget The token budget.
 * @returns The context as a string.
 */
export function getContext(state: State, tokenBudget: number): string {
  // we filter down to only narration and location change events,
  // because the other event types like character_introduction are implied in the narration
  const events = state.events.filter(event => event.type === "narration" || event.type === "location_change");
  
  if (events.length === 0) {
    return "";
  }

  // Create initial context
  let context = createInitialContext(events, state);
  
  // Step 1: Try full text without summaries
  if (isContextWithinBudget(context, tokenBudget)) {
    return convertContextToText(context);
  }

  // Step 2: Replace oldest scenes with their scene summaries (except latest scene)
  context = replaceScenesWithSummaries(context, tokenBudget);
  if (isContextWithinBudget(context, tokenBudget)) {
    return convertContextToText(context);
  }

  // Step 3: Remove oldest scenes until we're under budget
  context = removeOldestScenes(context, tokenBudget);
  // if we're still not able to fit within budget (just the current scene takes up more than the budget) throw an error
  if (!isContextWithinBudget(context, tokenBudget)) {
    throw new Error("Unable to fit context within token budget even after summarization");
  }

  return convertContextToText(context);
}

/**
 * Create the initial context without any compression.
 * @param events events that should go in the context
 * @param state current state
 * @returns 
 */
function createInitialContext(events: (NarrationEvent | LocationChangeEvent)[], state: State): Scene[] {
  const scenes: Scene[] = [];

  if (events.length === 0) {
    return scenes;
  }

  // We go through all the events, as we encounter location changes, we create a new scene
  let currentSceneEvents: (NarrationEvent | LocationChangeEvent)[] = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.type === "location_change") {
      // If we have accumulated events from a previous scene, create a scene for them
      if (currentSceneEvents.length > 0) {
        const sceneText = createSceneText(currentSceneEvents, state);
        scenes.push({
          text: sceneText,
          summary: event.summary, // the summary for the previous scene is stored in this location change event
          summarize: false // Initially all scenes use full text
        });
      }

      // Start a new scene with this location change
      currentSceneEvents = [event];
    } else if (event.type === "narration") {
      // Add narration events to the current scene
      currentSceneEvents.push(event);
    }
  }

  // Handle the final scene (if there are remaining events)
  if (currentSceneEvents.length > 0) {
    const sceneText = createSceneText(currentSceneEvents, state);
    scenes.push({
      text: sceneText,
      summary: undefined, // The last scene doesn't have a summary yet
      summarize: false
    });
  }

  return scenes;
}

/**
 * Convert a sequence of events for a single scene into text.
 * @param events The events that make up the scene
 * @param state The current state
 * @returns The text representation of the scene
 */
function createSceneText(events: (NarrationEvent | LocationChangeEvent)[], state: State): string {
  const sceneParts: string[] = [];

  for (const event of events) {
    if (event.type === "location_change") {
      sceneParts.push(convertLocationChangeEventToText(event, state));
    } else if (event.type === "narration") {
      sceneParts.push(event.text);
    }
  }

  return sceneParts.join("\n\n");
}

/**
 * Replace oldest scenes with their scene summaries (except the latest scene).
 * @param context The current context.
 * @param tokenBudget The token budget.
 * @returns Updated context.
 */
function replaceScenesWithSummaries(
  context: Scene[], 
  tokenBudget: number
): Scene[] {
  const scenes = [...context];
  
  // Go through each scene (except the last one) and switch to summary if available
  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].summary && !scenes[i].summarize) {
      scenes[i] = { ...scenes[i], summarize: true };
      
      // Check if we're now within budget
      if (isContextWithinBudget(scenes, tokenBudget)) {
        break;
      }
    }
  }
  
  return scenes;
}

/**
 * Remove oldest scenes until we're under the token budget.
 * Assume that at this point, all scenes except the most recent have been replaced with their summaries,
 * So this will keep removing the oldest summaries until the most recent scene.
 * @param context The current context.
 * @param tokenBudget The token budget.
 * @returns Updated context.
 */
function removeOldestScenes(context: Scene[], tokenBudget: number): Scene[] {
  let scenes = [...context];

  // Remove oldest scenes until we fit within budget or only have the current scene left
  while (scenes.length > 1 && !isContextWithinBudget(scenes, tokenBudget)) {
    scenes = scenes.slice(1); // Remove the oldest scene (first element)
  }

  return scenes;
}

/**
 * Check if the current context is within the token budget.
 * @param context The context to check.
 * @param tokenBudget The token budget to compare against.
 * @returns True if the context is within budget, false otherwise.
 */
function isContextWithinBudget(context: Scene[], tokenBudget: number): boolean {
  const totalTokens = context.reduce(
    (sum: number, scene) => sum + getApproximateTokenCount((scene.summarize && scene.summary) ? scene.summary : scene.text),
    0
  );
  return totalTokens <= tokenBudget;
}

/**
 * Converts a location change event to text.
 * @param event The location change event to convert.
 * @param state The current state
 * @returns A string describing the location change event.
 */
export function convertLocationChangeEventToText(event: LocationChangeEvent, state: State): string {
  const location = state.locations[event.locationIndex];
  const cast = event.presentCharacterIndices
  .map((index) => {
    const character = state.characters[index];
    return `${character.name}: ${character.biography}`;
  })
  .join("\n\n")
  
  return `-----

LOCATION CHANGE

${state.protagonist.name} is entering ${location.name}. ${location.description}

The following characters are present at ${location.name}:

${cast}

-----`;
}

/**
 * Converts an array of scenes representing the context to text.
 * @param scenes The context to convert.
 * @returns A string representation of the context.
 */
function convertContextToText(scenes: Scene[]): string {
  return scenes.map(scene => (scene.summarize && scene.summary) ? scene.summary : scene.text).join("\n\n");
}

/**
 * Estimates the number of tokens in a text string assuming 3 characters per token and rounding up.
 * @param text The text to analyze.
 * @returns The estimated token count.
 */
export function getApproximateTokenCount(text: string): number {
  const numCharacters = text.length;
  return Math.ceil(numCharacters / 3);
}
