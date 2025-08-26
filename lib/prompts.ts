// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { convertLocationChangeEventToText, getApproximateTokenCount, getContext } from "./context";
import * as schemas from "./schemas";
import type { LocationChangeEvent, State } from "./state";

export interface Prompt {
  system: string;
  user: string;
}

function normalize(text: string): string {
  // Normalize prompt text by collapsing single newlines.
  // This allows for cleaner-looking strings in code,
  // while still producing regular single-line prompts.
  const singleNewline = /(?<!\n)\n(?!\n)/g;
  return text.replaceAll(singleNewline, " ").trim();
}

function makePrompt(userPrompt: string): Prompt {
  return {
    system: "You are the game master of a text-based fantasy role-playing game.",
    user: normalize(userPrompt),
  };
}

export const generateWorldPrompt = makePrompt(`
Create a fictional world for a fantasy adventure RPG and return its name
and a short description (100 words maximum) as a JSON object.
Do not use a cliched name like 'Eldoria'.
The world is populated by humans, elves, and dwarves.
`);

export function generateProtagonistPrompt(state: State): Prompt {
  return makePrompt(`
Create a ${state.protagonist.gender} ${state.protagonist.race} protagonist
for a fantasy adventure set in the world of ${state.world.name}.

${state.world.description}

Return the character description as a JSON object. Include a short biography (100 words maximum).
`);
}

export function generateStartingLocationPrompt(state: State): Prompt {
  return makePrompt(`
Create a starting location for a fantasy adventure set in the world of ${state.world.name}.

${state.world.description}

Return the name and type of the location, and a short description (100 words maximum), as a JSON object.
Choose from the following location types: ${Object.values(schemas.LocationType.enum).join(", ")}
`);
}

export function generateStartingCharactersPrompt(state: State): Prompt {
  const location = state.locations[state.protagonist.locationIndex];

  return makePrompt(`
This is the start of a fantasy adventure set in the world of ${state.world.name}. ${state.world.description}

The protagonist is ${state.protagonist.name}. ${state.protagonist.biography}

${state.protagonist.name} is about to enter ${location.name}. ${location.description}

Create 5 characters that ${state.protagonist.name} might encounter at ${location.name}.
Return the character descriptions as an array of JSON objects.
Include a short biography (100 words maximum) for each character.
`);
}

const makeMainPromptPreamble = (
  state: State,
): string => `This is a fantasy adventure RPG set in the world of ${state.world.name}. ${state.world.description}

The protagonist (who you should refer to as "you" in your narration, as the adventure happens from their perspective)
is ${state.protagonist.name}. ${state.protagonist.biography}`;

function makeMainPrompt(prompt: string, state: State, tokenBudget: number): Prompt {
  const promptPreamble = makeMainPromptPreamble(state);

  // get the tokens used by the prompt and the preamble
  const normalizedPrompt = normalize(prompt);
  const promptTokens = getApproximateTokenCount(normalizedPrompt);
  const preambleTokens = getApproximateTokenCount(promptPreamble);

  // get the context based on the token budget minus the prompt and preamble tokens
  const contextTokenBudget = tokenBudget - promptTokens - preambleTokens;
  const context = getContext(state, contextTokenBudget);

  return makePrompt(`
${promptPreamble}

Here is what has happened so far:
${context}



${normalizedPrompt}
`);
}

export function narratePrompt(state: State, tokenBudget: number, action?: string): Prompt {
  return makeMainPrompt(
    `
${action ? `The protagonist (${state.protagonist.name}) has chosen to do the following: ${action}.` : ""}
Narrate what happens next, using novel-style prose, in the present tense.
Prioritize dialogue over descriptions.
Do not mention more than 2 different characters in your narration.
Refer to characters using their first names.
Make all character names bold by surrounding them with double asterisks (**Name**).
Write 2-3 paragraphs (no more than 200 words in total).
Stop when it is the protagonist's turn to speak or act.
Remember to refer to the protagonist (${state.protagonist.name}) as "you" in your narration.
Do not explicitly ask the protagonist for a response at the end; they already know what is expected of them.
`,
    state,
    tokenBudget,
  );
}

export function generateActionsPrompt(state: State, tokenBudget: number): Prompt {
  return makeMainPrompt(
    `
Suggest 3 options for what the protagonist (${state.protagonist.name}) could do or say next.
Each option should be a single, short sentence that starts with a verb.
Return the options as a JSON array of strings.
`,
    state,
    tokenBudget,
  );
}

export function checkIfSameLocationPrompt(state: State, tokenBudget: number): Prompt {
  return makeMainPrompt(
    `
Is the protagonist (${state.protagonist.name}) still at ${state.locations[state.protagonist.locationIndex].name}?
Answer with "yes" or "no".
`,
    state,
    tokenBudget,
  );
}

export function generateNewLocationPrompt(state: State, tokenBudget: number): Prompt {
  return makeMainPrompt(
    `
The protagonist (${state.protagonist.name}) has left ${state.locations[state.protagonist.locationIndex].name}.
Return the name and type of their new location, and a short description (100 words maximum), as a JSON object.
Also include the names of the characters that are going to accompany ${state.protagonist.name} there, if any.
`,
    state,
    tokenBudget,
  );
}

// Must be called *before* adding the location change event to the state!
export function generateNewCharactersPrompt(
  state: State,
  accompanyingCharacters: string[],
  tokenBudget: number,
): Prompt {
  const location = state.locations[state.protagonist.locationIndex];

  return makeMainPrompt(
    `
The protagonist (${state.protagonist.name}) is about to enter ${location.name}. ${location.description}

${accompanyingCharacters.length > 0 ? `${state.protagonist.name} is accompanied by the following characters: ${accompanyingCharacters.join(", ")}.` : ""}

Create 5 additional, new characters that ${state.protagonist.name} might encounter at ${location.name}.
Do not reuse characters that have already appeared in the story.
Return the character descriptions as an array of JSON objects.
Include a short biography (100 words maximum) for each character.
`,
    state,
    tokenBudget,
  );
}

export function summarizeScenePrompt(state: State): Prompt {
  const protagonistName = state.protagonist.name;

  // Find the start of the current scene (most recent location change in state).
  let sceneStartIndex = -1;
  for (let i = state.events.length - 1; i >= 0; i--) {
    if (state.events[i].type === "location_change") {
      sceneStartIndex = i;
      break;
    }
  }

  // Build location + cast context from that location change
  const mostRecentLocationChangeEvent = state.events[sceneStartIndex];
  const sceneContext = convertLocationChangeEventToText(mostRecentLocationChangeEvent as LocationChangeEvent, state);

  // Gather all narration texts from this scene (after the last location change).
  const narrationTexts = state.events
    .slice(sceneStartIndex + 1)
    .map((ev) => (ev.type === "narration" ? ev.text : null))
    .filter((t): t is string => !!t)
    .join("\n\n");

  const userPrompt = `
${makeMainPromptPreamble(state)}

You will create a compact memory of the just-completed scene. This memory is used as long-term context for future generations.
Write a 1-2 paragraph scene summary (no more than 300 words in total).
Use proper names and refer to the protagonist as "you".
Capture only plot-relevant facts that will matter later such as:
what ${protagonistName} does/learns/decides,
changes to location, inventory, injuries, or relationships,
discoveries/clues,
unresolved goals, promises, threats, or deadlines.
Do not quote dialogue, add new facts, or include stylistic prose.
Return only the summary with no preamble, labels, markdown or quotes.

Here's the context for the scene to summarize:

${sceneContext}

Here's the scene to summarize:

${narrationTexts}
`;

  return makePrompt(userPrompt);
}
