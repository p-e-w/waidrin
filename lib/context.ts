import type { LocationChangeEvent, NarrationEvent, State } from "./state";

interface ContextUnit {
  type : "location_change" | "narration";
  text: string;
  /** The number of tokens in this context unit */
  tokenCount: number;
  /** original event index (0 = oldest) covered by this unit, inclusive */
  startEventIndex: number;
  /** original event index (0 = oldest) covered by this unit, inclusive */
  endEventIndex: number;
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

  // Create initial context units
  let contextUnits = createInitialContextUnits(events, state);
  
  // Step 1: Try full text without summaries
  if (isContextWithinBudget(contextUnits, tokenBudget)) {
    return convertContextUnitsToText(contextUnits);
  }

  // Step 2: Replace oldest narration events with their summaries one by one
  contextUnits = replaceNarrationEventsWithSummaries(contextUnits, events, tokenBudget);
  if (isContextWithinBudget(contextUnits, tokenBudget)) {
    return convertContextUnitsToText(contextUnits);
  }

  // Step 3: Replace oldest scenes with their scene summaries (except latest scene)
  contextUnits = replaceScenesWithSummaries(contextUnits, events, tokenBudget);
  if (isContextWithinBudget(contextUnits, tokenBudget)) {
    return convertContextUnitsToText(contextUnits);
  }

  // Step 4: Remove oldest scenes until we're under budget
  contextUnits = removeOldestScenes(contextUnits, tokenBudget);

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
        startEventIndex: i,
        endEventIndex: i
      });
    } else if (event.type === "location_change") {
      const text = convertLocationChangeEventToText(event, state);
      units.push({
        type: "location_change",
        text,
        tokenCount: getApproximateTokenCount(text),
        startEventIndex: i,
        endEventIndex: i
      });
    }
  });

  return units;
}

/**
 * Replace oldest narration events with their summaries one by one until under budget.
 * @param contextUnits The current context units.
 * @param events The original events array.
 * @param tokenBudget The token budget.
 * @returns Updated context units.
 */
function replaceNarrationEventsWithSummaries(
  contextUnits: ContextUnit[], 
  events: (NarrationEvent | LocationChangeEvent)[], 
  tokenBudget: number
): ContextUnit[] {
  const units = [...contextUnits];
  
  for (let i = 0; i < units.length; i++) {
    if (isContextWithinBudget(units, tokenBudget)) {
      break;
    }
    
    if (units[i].type === "narration") {
      // replace the narration text with its summary
      const originalEvent = events[units[i].startEventIndex] as NarrationEvent;
      if (originalEvent.summary) {
        units[i] = {
          ...units[i],
          text: originalEvent.summary,
          tokenCount: getApproximateTokenCount(originalEvent.summary)
        };
      }
    }
  }
  
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
    // Find the earliest unsummarized location change
    // This marks that start of the scene we're summarizing
    if (units[sceneIndex].type !== "location_change") {
      sceneIndex++;
      continue;
    }
    
    // Find the next location change after sceneIndex
    // that next location change marks the end of this scene we're summarizing
    let endSceneLocationChangeIndex = -1;
    for (let i = sceneIndex + 1; i < units.length; i++) {
      if (units[i].type === "location_change") {
        endSceneLocationChangeIndex = i;
        break;
      }
    }
    
    // If no next location change found,
    // means the scene never ended and we're at the latest scene - stop here
    if (endSceneLocationChangeIndex === -1) {
      break;
    }

    // Get the scene summary (always stored on the location change event marking the end of the scene)
    const endSceneLocationChangeEventIndex = units[endSceneLocationChangeIndex].startEventIndex;
    const endSceneLocationChangeEvent = events[endSceneLocationChangeEventIndex] as LocationChangeEvent;
    
    if (endSceneLocationChangeEvent.summary) {
      // Replace everything from sceneIndex to right before endSceneLocationChangeIndex with the summary
      const summaryUnit: ContextUnit = {
        type: "location_change",
        text: endSceneLocationChangeEvent.summary,
        tokenCount: getApproximateTokenCount(endSceneLocationChangeEvent.summary),
        startEventIndex: units[sceneIndex].startEventIndex,
        endEventIndex: units[endSceneLocationChangeIndex - 1].endEventIndex
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
 * At this point, all scenes have been replaced with their summaries,
 * so we just remove context units from the beginning until we fit the budget.
 * @param contextUnits The current context units.
 * @param tokenBudget The token budget.
 * @returns Updated context units.
 */
function removeOldestScenes(contextUnits: ContextUnit[], tokenBudget: number): ContextUnit[] {
  let units = [...contextUnits];
  
  while (units.length > 0 && !isContextWithinBudget(units, tokenBudget)) {
    units = units.slice(1); // Remove the first (oldest) context unit
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
function convertLocationChangeEventToText(event: LocationChangeEvent, state: State): string {
  const location = state.locations[event.locationIndex];
  
  return `-----

LOCATION CHANGE

${state.protagonist.name} is entering ${location.name}. ${location.description}

The following characters are present at ${location.name}:

${event.presentCharacterIndices
  .map((index) => {
    const character = state.characters[index];
    return `${character.name}: ${character.biography}`;
  })
  .join("\n\n")}

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
