import type { LocationChangeEvent, NarrationEvent, State, Event } from "./state";

/**
 * Represents the level of summarization applied to an event.
 * One means it's an event level summary.
 * Two means it's a scene level summary.
 */
enum SummaryLevel {
  None = 0,
  One = 1,
  Two = 2
}

/**
 * In order to make context fit within our budget, we go through a series of compression strategies.
 * 
 * We start by replacing the oldest events one by one and checking along the way if the context fits.
 * We replace the oldest events with the summary level specified in the strategy until we reach the max percent of
 * events we can compress with the current strategy. At the point we move on the to the next strategy.
 * 
 * Each subsequent strategy keeps the compression of previous strategies and
 * either increases summary level of older events or applies the summary level to newer events.
 */

interface CompressionStrategy {
  summaryLevel: SummaryLevel;
  percent: number;
}

const COMPRESSION_STRATEGIES: CompressionStrategy[] = [
  { summaryLevel: SummaryLevel.One, percent: .5 }, // up to 50% of the oldest events are at least SummaryLevel.One
  { summaryLevel: SummaryLevel.Two, percent: .25 }, // up to 25% of the oldest events are at least SummaryLevel.Two
  { summaryLevel: SummaryLevel.One, percent: .8 }, // up to 80% of the oldest events are at least SummaryLevel.One
  { summaryLevel: SummaryLevel.Two, percent: .5 }, // up to 50% of the oldest events are at least SummaryLevel.Two
  { summaryLevel: SummaryLevel.One, percent: 1 } // all events are least SummaryLevel.One
];


interface ContextUnit {
  type : "location_change" | "narration";
  summaryLevel: SummaryLevel;
  text: string;
  /** The number of tokens in this context unit at the current summary level */
  tokenCount: number;
  /** original event index (0 = oldest) covered by this unit, inclusive */
  startEventIndex: number;
  /** original event index (0 = oldest) covered by this unit, inclusive */
  endEventIndex: number;
}

export function getContext(state: State, tokenBudget: number): string {
  // we filter down to only narration and location change events,
  // because the other event types like character_introduction are implied in the narration
  const events = state.events.filter(event => event.type === "narration" || event.type === "location_change");
  
  if (events.length === 0) {
    return "";
  }

  // Create initial context units
  let contextUnits = createInitialContextUnits(events, state);
  // if no compression is needed just return the context
  if (isContextWithinBudget(contextUnits, tokenBudget)) return convertContextUnitsToText(contextUnits);

  // Reverse to get oldest last prior to compression
  // (since we'll be removing oldest events first and removing from the end is more efficient)
  contextUnits.reverse();
  
  // Apply compression strategies until we fit within budget
  for (const strategy of COMPRESSION_STRATEGIES) {
    contextUnits = applyCompressionStrategy(contextUnits, strategy, events, tokenBudget);

    if (isContextWithinBudget(contextUnits, tokenBudget)) {
      break;
    }
  }
  
  // Reverse to get chronological order for output
  contextUnits.reverse();
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
        summaryLevel: SummaryLevel.None,
        text,
        tokenCount: getApproximateTokenCount(text),
        startEventIndex: i,
        endEventIndex: i
      });
    } else if (event.type === "location_change") {
      const text = convertLocationChangeEventToText(event, state);
      units.push({
        type: "location_change",
        summaryLevel: SummaryLevel.None,
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
 * Apply a compression strategy to events in the context until the token budget is met or we've reached the maximum number of
 * events to compress with the strategy.
 * @param contextUnits The context units to compress.
 * @param strategy The compression strategy to apply.
 * @param events The original events.
 * @param tokenBudget The token budget.
 * @returns The compressed context units.
 */
function applyCompressionStrategy(
  contextUnits: ContextUnit[], 
  strategy: CompressionStrategy, 
  events: (NarrationEvent | LocationChangeEvent)[], 
  tokenBudget: number
): ContextUnit[] {
  const numTotalEvents = events.length;
  const maxEventsToCompress = Math.floor(numTotalEvents * strategy.percent);
  
  // to calculate the percentage of events compressed, we'll store the index of the latest event compressed at
  // the level required by the strategy.
  // ex: if we have 100 events and latestEventCompressedIndex is 30, we've compressed 30% of the events
  let latestEventCompressedIndex = 0;
  
  // Work from oldest to newest, applying the summary level that's needed
  // until we reach the max percent of events we can compress with this strategy.
  for (let i = contextUnits.length - 1; i >= 0 && latestEventCompressedIndex < maxEventsToCompress - 1; i--) {
    if (contextUnits[i].summaryLevel < strategy.summaryLevel) {
      if (strategy.summaryLevel === SummaryLevel.One) {
        contextUnits[i] = compressToEventSummary(contextUnits[i], events);
      } else if (strategy.summaryLevel === SummaryLevel.Two) {
        const compressed = compressToSceneSummary(contextUnits, i, events);
        if (compressed) {
          // Replace the units that were compressed into a scene summary
          contextUnits.splice(compressed.removeStart, compressed.removeCount, compressed.unit);
          // Adjust index since we modified the array
          i = compressed.removeStart;
        }
      }
      // after applying a compression to an event, check if we're under budget
      if (isContextWithinBudget(contextUnits, tokenBudget)) {
        return contextUnits;
      }
    }
    latestEventCompressedIndex = contextUnits[i].endEventIndex;
  }
  
  return contextUnits;
}

/**
 * Replace an event with its summary
 */
function compressToEventSummary(
  unit: ContextUnit, 
  events: (NarrationEvent | LocationChangeEvent)[], 
): ContextUnit {
  if (unit.type === "location_change") {
    // Skip location change events for event-level summaries
    return unit;
  }
  
  const event = events[unit.startEventIndex] as NarrationEvent;
  if (event.summary) {
    return {
      ...unit,
      summaryLevel: SummaryLevel.One,
      text: event.summary,
      tokenCount: getApproximateTokenCount(event.summary)
    };
  }
  
  // No summary available, return original
  return unit;
}

/**
 * Replace a series of events in a scene with the scene summary from the location change event that ends the scene.
 * @param contextUnits All current context units.
 * @param unitIndex The index of the unit to start compressing from (should be within the scene to compress).
 * @param events The original events.
 * @returns The compressed context unit, which index to remove from, and how many to remove.
 */
function compressToSceneSummary(
  contextUnits: ContextUnit[], 
  unitIndex: number, 
  events: (NarrationEvent | LocationChangeEvent)[], 
): { unit: ContextUnit; removeStart: number; removeCount: number } | null {
  // Remember: contextUnits are in reverse chronological order (oldest at end)
  // Find the location change that starts the scene containing this unit
  let sceneStartIndex = -1;
  
  // Look backwards (towards older events) to find the scene start
  for (let i = unitIndex; i < contextUnits.length; i++) {
    if (contextUnits[i].type === "location_change") {
      sceneStartIndex = i;
      break;
    }
  }
  
  if (sceneStartIndex === -1) {
    return null; // No scene start found
  }
  
  // Find where this scene ends by looking forward (towards newer events)
  let sceneEndIndex = unitIndex;
  for (let i = unitIndex - 1; i >= 0; i--) {
    if (contextUnits[i].type === "location_change") {
      sceneEndIndex = i + 1; // Scene ends just before this location change
      break;
    }
  }
  
  if (sceneEndIndex <= 0) {
    sceneEndIndex = 0; // Scene goes to the newest events
  }
  
  // Get the location change event that ends this scene (contains the scene summary)
  // This is the location change AFTER the scene start in the original chronological order
  const sceneStartEventIndex = contextUnits[sceneStartIndex].startEventIndex;
  const nextLocationChangeEvent = findNextLocationChangeEvent(events, sceneStartEventIndex);
  
  if (!nextLocationChangeEvent || !nextLocationChangeEvent.summary) {
    return null; // No scene summary available
  }
  
  // Create the scene summary unit
  const sceneSummaryUnit: ContextUnit = {
    type: "location_change", 
    summaryLevel: SummaryLevel.Two,
    text: nextLocationChangeEvent.summary,
    tokenCount: getApproximateTokenCount(nextLocationChangeEvent.summary),
    startEventIndex: contextUnits[sceneStartIndex].startEventIndex,
    endEventIndex: contextUnits[sceneEndIndex].endEventIndex
  };
  
  return {
    unit: sceneSummaryUnit,
    removeStart: sceneEndIndex,
    removeCount: sceneStartIndex - sceneEndIndex + 1
  };
}

/**
 * Find the next location change event after a given index to start looking from.
 * @param events The list of events to search.
 * @param afterIndex The index to start searching from (exclusive).
 * @returns The next location change event, or null if not found.
 */
function findNextLocationChangeEvent(
  events: (NarrationEvent | LocationChangeEvent)[], 
  afterIndex: number
): LocationChangeEvent | null {
  for (let i = afterIndex + 1; i < events.length; i++) {
    if (events[i].type === "location_change") {
      return events[i] as LocationChangeEvent;
    }
  }
  return null;
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
};