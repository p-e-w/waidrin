// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  bubbltaco

import type { LocationChangeEvent, NarrationEvent, State } from "./state";

// We'll use context unit types to build our context and replace parts of it with summaries as needed.
interface LocationChangeContextUnit {
  type: "location_change";
  text: string;
  tokenCount: number;
  summary?: string;
}
interface NarrationContextUnit {
  type: "narration";
  text: string;
  tokenCount: number;
}
interface SummaryContextUnit {
  type: "summary";
  text: string;
  tokenCount: number;
}
type ContextUnit = LocationChangeContextUnit | NarrationContextUnit | SummaryContextUnit;

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

  // Create initial context units
  let contextUnits = createInitialContextUnits(events, state);
  
  // Step 1: Try full text without summaries
  if (isContextWithinBudget(contextUnits, tokenBudget)) {
    return convertContextUnitsToText(contextUnits);
  }

  // Step 2: Replace oldest scenes with their scene summaries (except latest scene)
  contextUnits = replaceScenesWithSummaries(contextUnits, events, tokenBudget);
  if (isContextWithinBudget(contextUnits, tokenBudget)) {
    return convertContextUnitsToText(contextUnits);
  }

  // Step 3: Remove oldest scenes until we're under budget
  contextUnits = removeOldestScenes(contextUnits, tokenBudget);
  // if we're still not able to fit within budget (just the current scene takes up more than the budget) throw an error
  if (!isContextWithinBudget(contextUnits, tokenBudget)) {
    throw new Error("Unable to fit context within token budget even after summarization");
  }

  return convertContextUnitsToText(contextUnits);
}

/**
 * Create the initial context without any compression.
 * @param events events that should go in the context
 * @param state current state
 * @returns 
 */
function createInitialContextUnits(events: (NarrationEvent | LocationChangeEvent)[], state: State): ContextUnit[] {
  const units: ContextUnit[] = [];

  events.forEach((event, i) => {
    if (event.type === "narration") {
      const text = event.text;
      units.push({
        type: "narration",
        text,
        tokenCount: getApproximateTokenCount(text),
      });
    } else if (event.type === "location_change") {
      const text = convertLocationChangeEventToText(event, state);
      units.push({
        type: "location_change",
        text,
        tokenCount: getApproximateTokenCount(text),
        summary: event.summary,
      });
    }
  });

  return units;
}

/**
 * Replace oldest scenes with their scene summaries (except the latest scene).
 * We consider a location_change to mark the start of a scene.
 * Then the next location_change marks the end of that scene and the start of the next scene.
 * So when we summarize, we replace all events including the starting location_change up to right before the ending location_change
 * with the scene summary.
 * @param contextUnits The current context units.
 * @param events The original events array.
 * @param tokenBudget The token budget.
 * @returns Updated context units.
 */
function replaceScenesWithSummaries(
  contextUnits: ContextUnit[], 
  events: (NarrationEvent | LocationChangeEvent)[], 
  tokenBudget: number
): ContextUnit[] {
  let units = [...contextUnits];
  let sceneIndex = 0;
  
  while (sceneIndex < units.length && !isContextWithinBudget(units, tokenBudget)) {
    // Find the earliest location change
    // This marks that start of the scene we're summarizing
    if (units[sceneIndex].type !== "location_change") {
      sceneIndex++;
      continue;
    }
    
    // Find the next location change after sceneIndex
    // that next location change marks the end of this scene we're summarizing
    let endSceneLocationChange: LocationChangeContextUnit | null = null;
    let endSceneLocationChangeIndex = -1;
    for (let i = sceneIndex + 1; i < units.length; i++) {
      const contextUnit = units[i];
      if (contextUnit.type === "location_change") {
        endSceneLocationChange = contextUnit;
        endSceneLocationChangeIndex = i;
        break;
      }
    }
    
    // If no next location change found,
    // means the scene never ended and we're at the latest scene - stop here
    if (!endSceneLocationChange) {
      break;
    }

    // Get the scene summary (always stored on the location change event marking the end of the scene)
    const sceneSummary = endSceneLocationChange.summary;
    if (sceneSummary) {
      // Replace everything from sceneIndex to right before endSceneLocationChangeIndex with the summary
      const summaryUnit: SummaryContextUnit = {
        type: "summary",
        text: sceneSummary,
        tokenCount: getApproximateTokenCount(sceneSummary),
      };
      
      // Replace the scene units with the summary unit
      units = [
        ...units.slice(0, sceneIndex),
        summaryUnit,
        ...units.slice(endSceneLocationChangeIndex)
      ];
    }
    
    // Move to the next scene (which is now at sceneIndex + 1)
    sceneIndex++;
  }
  
  return units;
}

/**
 * Remove oldest scenes until we're under the token budget.
 * Assume that at this point, all scenes except the most recent have been replaced with their summaries,
 * So this will keep removing the oldest summaries until it runs into the most recent non-summary event.
 * @param contextUnits The current context units.
 * @param tokenBudget The token budget.
 * @returns Updated context units.
 */
function removeOldestScenes(contextUnits: ContextUnit[], tokenBudget: number): ContextUnit[] {
  let units = [...contextUnits];
  
  while (units.length > 0 && !isContextWithinBudget(units, tokenBudget)) {
    // If the first event is a summary, remove it
    if (units[0].type === "summary") {
      units = units.slice(1);
    } else {
      // If the first event is not a summary, we've reached the most recent scene - stop
      break;
    }
  }

  return units;
}

/**
 * Check if the current context is within the token budget.
 * @param contextUnits The context units to check.
 * @param tokenBudget The token budget to compare against.
 * @returns True if the context is within budget, false otherwise.
 */
function isContextWithinBudget(contextUnits: ContextUnit[], tokenBudget: number): boolean {
  const totalTokens = contextUnits.reduce((sum: number, unit: ContextUnit) => sum + unit.tokenCount, 0);
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
 * Converts an array of context units representing the context to text.
 * @param units The context units to convert.
 * @returns A string representation of the context.
 */
function convertContextUnitsToText(units: ContextUnit[]): string {
  return units.map(unit => unit.text).join("\n\n");
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
