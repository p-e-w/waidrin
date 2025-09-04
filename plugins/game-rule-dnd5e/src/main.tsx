// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  chengkaichee@gmail.com

/**
 * @file This file defines the D&D Character Stats plugin.
 * It provides a React component for configuring D&D-style character stats
 * and integrates with the main application's plugin system to persist these settings.
 */

// Type-only imports for shared libraries and core types.
// These imports are crucial for TypeScript type checking but are removed during the build process
// to prevent bundling these libraries within the plugin, thus avoiding the "two Reacts" problem.
import type { WritableDraft } from "immer";
import type { Plugin, PluginWrapper, StoredState, IGameRuleLogic, CheckDefinition } from "@/lib/state";
import type { Context } from "@/app/plugins";
import type { Prompt } from "@/lib/prompts";

import type * as RadixThemes from '@radix-ui/themes';
import type { useShallow } from 'zustand/shallow';
import { DnDStats, generateDefaultDnDStats, DnDClassData, DnDStatsSchema, resolveCheck as getResolveCheck, Combatant } from "./pluginData";
import { getBackstory, modifyProtagonistPromptForDnd, getChecksPrompt, getConsequenceGuidancePrompt, getDndNarrationGuidance } from "./pluginPrompt";
import * as z from "zod/v4";
import { narratePrompt } from "@/lib/prompts"; // Import narratePrompt
import type { Character, State, CheckResolutionResult } from "@/lib/state"; // Import Character and State


// Declare a module-level React variable.
// This variable will be assigned the main application's React instance during plugin initialization.
// This is essential for JSX transformation and ensuring all React operations within the plugin
// use the same React instance as the main application, preventing "two Reacts" issues.
let React: typeof import('react');

/**
 * Props for the DndStatsCharacterUIPage component.
 */
interface DndStatsCharacterUIPageProps {
  injectedReact: typeof React;
  
  injectedRadixThemes: typeof RadixThemes;
  getGlobalState: () => StoredState;
  onSave: (newSettings: DnDStats) => Promise<void>;
  injectedUseShallow: typeof useShallow;
  injectedRpgDiceRoller: typeof import('@dice-roller/rpg-dice-roller');
}

/**
 * @component DndStatsCharacterUIPage
 * @description The main UI component for D&D Character Stats, intended to be
 * injected into the application's Character Select screen.
 */
const DndStatsCharacterUIPage = ({
  injectedReact,
  injectedRadixThemes,
  getGlobalState,
  onSave,
  injectedUseShallow,
  injectedRpgDiceRoller,
}: DndStatsCharacterUIPageProps) => {
  const pluginSettings = injectedReact.useMemo(() => {
    const state = getGlobalState();
    const plugin = state.plugins.find((p: PluginWrapper) => p.name === "game-rule-dnd5e");
    const settingsToUse = plugin ? (plugin.settings as DnDStats) : generateDefaultDnDStats(injectedRpgDiceRoller);
    return settingsToUse;
  }, [getGlobalState, injectedRpgDiceRoller]);

  const [currentSettings, setCurrentSettings] = injectedReact.useState<DnDStats>(pluginSettings);
  injectedReact.useEffect(() => {
    setCurrentSettings(pluginSettings);
  }, [pluginSettings]);

  const handleChange = (key: keyof DnDStats, value: string | number) => {
    setCurrentSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = async () => {
    await onSave(currentSettings);
    // After saving, explicitly update currentSettings from the global state
    const state = getGlobalState();
    const plugin = state.plugins.find((p: PluginWrapper) => p.name === "game-rule-dnd5e");
    if (plugin) {
      setCurrentSettings(plugin.settings as DnDStats);
    }
  };

  const availableSubclasses = DnDClassData[currentSettings.dndClass] || [];

  return (
    <injectedRadixThemes.Theme>
      <injectedRadixThemes.Box p="4">
        <injectedRadixThemes.Text size="6" mb="4">D&D 5E Character Stats</injectedRadixThemes.Text>

        <injectedRadixThemes.Grid columns="2" gap="3" mb="3">
          {/* Core Attributes (Strength, Dexterity, etc.) */}
          {Object.keys(DnDStatsSchema.shape).filter(key =>
            key !== 'dndClass' && key !== 'dndSubclass' && key !== 'plotType' && key !== 'encounter' && key !== 'backstory' &&
            key !== 'hp' && key !== 'hpMax' && key !== 'dndExp' && key !== 'dndLevel' // Exclude these from this specific loop
          ).map((key) => (
            <injectedRadixThemes.Flex direction="column" gap="2" key={key}>
              <injectedRadixThemes.Text size="3" weight="bold">{key.charAt(0).toUpperCase() + key.slice(1)}:</injectedRadixThemes.Text>
              <injectedRadixThemes.TextField.Root
                size="3"
                type="number"
                value={currentSettings[key as keyof DnDStats] as number}
                onChange={(e) => handleChange(key as keyof DnDStats, parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </injectedRadixThemes.Flex>
          ))}

          {/* HP */}
          <injectedRadixThemes.Flex direction="column" gap="2">
            <injectedRadixThemes.Text size="3" weight="bold">HP:</injectedRadixThemes.Text>
            <injectedRadixThemes.TextField.Root
              size="3"
              type="number"
              value={currentSettings.hp}
              onChange={(e) => handleChange('hp', parseInt(e.target.value))}
              min="1"
            />
          </injectedRadixThemes.Flex>

          {/* Max HP */}
          <injectedRadixThemes.Flex direction="column" gap="2">
            <injectedRadixThemes.Text size="3" weight="bold">Max HP:</injectedRadixThemes.Text>
            <injectedRadixThemes.TextField.Root
              size="3"
              type="number"
              value={currentSettings.hpMax}
              onChange={(e) => handleChange('hpMax', parseInt(e.target.value))}
              min="1"
            />
          </injectedRadixThemes.Flex>

          {/* Experience Points */}
          <injectedRadixThemes.Flex direction="column" gap="2">
            <injectedRadixThemes.Text size="3" weight="bold">Experience Points:</injectedRadixThemes.Text>
            <injectedRadixThemes.TextField.Root
              size="3"
              type="number"
              value={currentSettings.dndExp}
              onChange={(e) => handleChange('dndExp', parseInt(e.target.value))}
              min="0"
            />
          </injectedRadixThemes.Flex>

          {/* Level */}
          <injectedRadixThemes.Flex direction="column" gap="2">
            <injectedRadixThemes.Text size="3" weight="bold">Level:</injectedRadixThemes.Text>
            <injectedRadixThemes.TextField.Root
              size="3"
              type="number"
              value={currentSettings.dndLevel}
              onChange={(e) => handleChange('dndLevel', parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </injectedRadixThemes.Flex>

          {/* Class Selector */}
          <injectedRadixThemes.Flex direction="column" gap="2">
            <injectedRadixThemes.Text size="3" weight="bold">Class:</injectedRadixThemes.Text>
            <injectedRadixThemes.Select.Root            
              size="3"
              value={currentSettings.dndClass}
              onValueChange={(value) => handleChange('dndClass', value)}
            >
              <injectedRadixThemes.Select.Trigger />
              <injectedRadixThemes.Select.Content>
                {Object.keys(DnDClassData).map((className) => (
                  <injectedRadixThemes.Select.Item value={className} key={className}>
                    {className}
                  </injectedRadixThemes.Select.Item>
                ))}
              </injectedRadixThemes.Select.Content>
            </injectedRadixThemes.Select.Root>
          </injectedRadixThemes.Flex>

          {/* Subclass Selector (conditional) */}
          {currentSettings.dndClass && (
            <injectedRadixThemes.Flex direction="column" gap="2">
              <injectedRadixThemes.Text size="3" weight="bold">Subclass:</injectedRadixThemes.Text>
              <injectedRadixThemes.Select.Root
                size="3"
                value={currentSettings.dndSubclass}
                onValueChange={(value) => handleChange('dndSubclass', value)}
              >
                <injectedRadixThemes.Select.Trigger />
                <injectedRadixThemes.Select.Content>
                  {availableSubclasses.map((subclassName) => (
                    <injectedRadixThemes.Select.Item value={subclassName} key={subclassName}>
                      {subclassName}
                    </injectedRadixThemes.Select.Item>
                  ))}
                </injectedRadixThemes.Select.Content>
              </injectedRadixThemes.Select.Root>
            </injectedRadixThemes.Flex>
          )}

        </injectedRadixThemes.Grid>

        {/* Backstory (outside the grid, full width) */}
        <injectedRadixThemes.Flex direction="column" gap="2" mb="3">
          <injectedRadixThemes.Text size="3" weight="bold">Backstory:</injectedRadixThemes.Text>
          <injectedRadixThemes.TextArea
            size="3"
            value={currentSettings.backstory || ""}
            onChange={(e) => handleChange('backstory', e.target.value)}
            rows={5} // Adjust as needed
            placeholder="Enter prompt guidance for your character's backstory... or leave it blank for the system generate one for you. 
 Use simple sentences to highlight the attribute score's interpretation and to describe your character's background, personality, and motivations."
          />
        </injectedRadixThemes.Flex>

        {/* Buttons (right-aligned) */}
        <injectedRadixThemes.Flex gap="2" mt="4" justify="end"> {/* Added Flex container for buttons and aligned to end */}
          <injectedRadixThemes.Button size="4" onClick={handleApply}>Apply Changes</injectedRadixThemes.Button>
          <injectedRadixThemes.Button size="4" onClick={() => setCurrentSettings(generateDefaultDnDStats(injectedRpgDiceRoller))} variant="outline">Re-roll</injectedRadixThemes.Button> {/* Added Re-roll button */}
        </injectedRadixThemes.Flex>
      </injectedRadixThemes.Box>
    </injectedRadixThemes.Theme>
  );
};

/**
 * Main plugin class for D&D Character Stats.
 * Implements the Plugin interface to integrate with the Waidrin application.
 */
export default class DndStatsPlugin implements Plugin, IGameRuleLogic {
  private context: Context | undefined; // The plugin's context provided by the application
  private settings: DnDStats | undefined; // The plugin's settings

  /**
   * Initializes the plugin with its settings and context.
   * Parses and validates incoming settings using DnDStatsSchema,
   * merging them with default values.
   * @param settings - The settings object provided by the application.
   * @param context - The plugin context, providing access to application functionalities.
   */
  async init(settings: Record<string, unknown>, context: Context): Promise<void> {
    this.context = context;
    //console.log("DndStatsPlugin - init settings parameter:", settings);
    // Parse and validate settings, applying defaults for missing properties
    this.settings = DnDStatsSchema.parse({ ...generateDefaultDnDStats(this.context.rpgDiceRoller), ...settings });
    //console.log("DndStatsPlugin - this.settings (after parse):", this.settings);

    // Assign the main application's React instance to the module-level React variable.
    // This is critical for all JSX within this plugin to use the correct React instance.
    React = this.context.react;

    // Register the D&D 5E tab in the CharacterSelect screen
    this.context.addCharacterUI(
      this.context.pluginName, // Changed from "D&D 5E" to this.context.pluginName
      <span>D&D 5E</span>, // GameRuleTab: The ReactNode for the tab trigger.
      <DndStatsCharacterUIPage
        injectedReact={this.context.react}
        injectedRadixThemes={this.context.radixThemes}
        getGlobalState={this.context.getGlobalState}
        injectedUseShallow={this.context.useShallow}
        injectedRpgDiceRoller={this.context.rpgDiceRoller}
        onSave={async (newSettings) => {
          let finalSettings = { ...newSettings }; // Start with a copy of newSettings

          // Check if backstory is empty or blank
          if (!newSettings.backstory || newSettings.backstory.trim() === "") {
            // Only generate if backstory is empty
            const pc = this.context!.getGlobalState(); // Get current global state for prompt
            const prompt = getBackstory(newSettings, pc); // Use newSettings for stats

            try {
              const generatedBackstory = await this.context!.getBackend().getNarration(prompt, (token, count) => {
                this.context!.updateProgress("Generating Backstory", "Please wait while your character is going through early life...", count, true);
              });

              finalSettings = { ...newSettings, backstory: generatedBackstory };
              this.context!.updateProgress("Backstory Generated", "Your character's history is ready!", -1, false);
              console.log("DEBUG: getBackstory returned:", generatedBackstory);

              } catch (error) {
                // TODO: Handle error if not user abort, and display console.error("Error generating backstory:", error);
                this.context!.updateProgress("Backstory Generation Aborted", "User aborted operation during generation.", -1, false);
              }
          }

          this.context!.appStateManager.savePluginSettings(this.context!.pluginName, finalSettings);
          this.settings = { ...this.settings, ...finalSettings }; // Update local copy
        }}
      />
    );
  }

  getGameRuleLogic(): IGameRuleLogic {
    return this;
  }

  getBiographyGuidance(): string { // No longer async, returns string directly
    if (!this.settings) { // No need for context here
        return "";
    }
    return this.settings.backstory || ""; // Return saved backstory
  }
  
  /**
   * @method modifyProtagonistPrompt
   * @description To-do: This is a place holder to rewrite the Biography prompt, currently we are just passing guidance to main app based on character stats based on game rules.
   */
  modifyProtagonistPrompt(originalPrompt: Prompt): Prompt {
    return modifyProtagonistPromptForDnd(originalPrompt);
  }

  /**
   * @method getActionChecks
   * @description Specifies what checks are required for a given action, based on the action and current context.
   * This method is triggered when an action is passed to `narratePrompt`.
   * Its implementation will typically involve constructing an LLM prompt, making an API call, and parsing/validating the LLM's JSON response against the `CheckDefinition` schema.
   * @param {string} action - The raw action string performed by the protagonist.
   * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
   * @returns {Promise<CheckDefinition[]>} A promise that resolves to an array of check definitions. If the LLM response is invalid or unparseable, an empty array should be returned as a graceful fallback.
   */
  async getActionChecks(action: string, context: WritableDraft<StoredState>): Promise<CheckDefinition[]> {
    if (!this.context || !this.settings) {
      console.error("Context or settings not available for getActionChecks.");
      return [];
    }

    const PCStats = this.settings as DnDStats;
    const checksPrompt = getChecksPrompt(action, PCStats.plotType);
    //console.log("Generated checksPrompt:", checksPrompt);

    try {
      // Define a Zod schema for an array of CheckDefinition
      const CheckDefinitionSchema = z.object({
        type: z.string(),
        difficultyClass: z.number().int(),
        modifiers: z.array(z.string()).optional(),
      });
      const CheckDefinitionsArraySchema = z.array(CheckDefinitionSchema);

      let checks = await this.context.getBackend().getObject(checksPrompt, CheckDefinitionsArraySchema);

      // Filter out initiative checks if already in combat
      if (PCStats.plotType === "combat") {
          checks = checks.filter(check => check.type !== "initiative");
      }
      return checks;
    } catch (error) {
      console.error("Error getting action checks from LLM:", error);
      return []; // Graceful fallback
    }
  }

  /**
   * @method resolveCheck
   * @description Resolves a game rule check, utilizing rpg-dice-roller, and returns the result as a statement.
   * The plugin will use its internal rules to determine the character`s appropriate stat and skill modifier.
   *    * This statement will be incorporated into the `narratePrompt`'s output, typically after the action description.
   *    * @param {CheckDefinition} check - The definition of the check to resolve.
   *    * @param {Character} characterData - The global `Character` object. The plugin will map this to its internal representation of the character's stats.
   *    *   (Note: The `Character` type is defined in `lib/schemas.ts` and includes properties like `name`, `gender`, `race`, `biography`, `locationIndex`.)
   *    * @returns {string} A statement describing the check's result and any consequences.
   */
  async resolveCheck(check: CheckDefinition, characterData: Character, context: WritableDraft<State>, action?: string): Promise<CheckResolutionResult> {
    if (!this.settings || !this.context) {
      return { resultStatement: `Check for ${check.type} could not be resolved due to missing context or settings.`, consequenceLog: [] };
    }
    const PCStats = this.settings as DnDStats;
    const rpgDiceRoller = this.context.rpgDiceRoller;

    let resultStatement = getResolveCheck(check, characterData, PCStats, rpgDiceRoller);
    let consequenceLog: string[] = [];

    // Example: If it's an initiative check, trigger combat initialization
    if (check.type === "initiative") {
      this.handleConsequence("initiative_triggered", [resultStatement], action);
      consequenceLog.push("Combat initiated! Initiative order determined.");
    }
    // To-Do: Add more complex logic here for other check types (e.g., attack, spell, dash, disengage, dodge, help, hide, ready, search, use an object)
    // where you would calculate damage, apply status effects, etc., and call handleConsequence.

    return { resultStatement, consequenceLog };
  }

  /**
   * @method getNarrativeGuidance
   * @description Generates a narration prompt, influenced by the outcome of performed checks and consequences (e.g., HP, item, relationship, story/plot branch changes).
   * @param {string} eventType - The type of event triggering narration.
   * @param {WritableDraft<State>} context - The current game state. (Note: Direct mutation of this `WritableDraft` object is the intended way to update state.)
   * @param {string[]} [checkResultStatements] - Optional: Statements describing results of checks performed for the event, provided by `resolveCheck`.
   * @param {string} [action] - Optional: The action that triggered the narration.
   * @returns {Promise<string[]>} The generated narration prompt.
   */
  async getNarrativeGuidance(eventType: string, context: WritableDraft<State>, checkResolutionResults?: CheckResolutionResult[], action?: string): Promise<string[]> {
    if (!this.context || !this.settings) {
      console.error("Context or settings not available for getNarrativeGuidance.");
      return [];
    }

    const PCStats = this.settings as DnDStats;

    // Handle location change narration specifically
    if (!action && (!checkResolutionResults || checkResolutionResults.length === 0)) {
      let previousLocationName = `a location from protagonist's backstory: ${this.settings.backstory || ""}`;
      let newLocationName = "new plot line location";
      let newLocationDescription = "";
      let presentCharactersInfo = "";

      // Find the most recent LocationChangeEvent
      for (let i = context.events.length - 1; i >= 0; i--) {
        const event = context.events[i];
        if (event.type === "location_change") {
          newLocationName = context.locations[event.locationIndex].name;
          newLocationDescription = context.locations[event.locationIndex].description;
          
          // Try to find the previous location from the event history
          // This is a heuristic and might not always be accurate if events are reordered or missing
          if (i > 0) {
            for (let j = i - 1; j >= 0; j--) {
              const prevEvent = context.events[j];
              if (prevEvent.type === "location_change") {
                previousLocationName = context.locations[prevEvent.locationIndex].name;
                break;
              } else if (prevEvent.type === "narration" && prevEvent.locationIndex !== undefined) {
                // If a narration event has a location index, it might indicate the previous location
                previousLocationName = context.locations[prevEvent.locationIndex].name;
                break;
              }
            }
          }

          if (event.presentCharacterIndices && event.presentCharacterIndices.length > 0) {
            presentCharactersInfo = `Present characters: ${event.presentCharacterIndices.map(idx => context.characters[idx].name).join(", ")}.`;
          }
          break;
        }
      }

      const locationChangePrompt: Prompt = {
        system: "You are an expert DM in Dungeons & Dragons 5th Edition in the narrative style of famous DM Matt Mercer. Maintain story continuity. Focus on the protagonist's journey and goals.",
        user: `The protagonist has moved from ${previousLocationName} to ${newLocationName}. ${newLocationDescription}. There are ${presentCharactersInfo} in this new location.
        Narrate this transition. Emphasize the reason for the new scene in the continuity of the story (e.g., continuing a quest, seeking something, fleeing). 
        Describe the new location and its immediate relevance to the protagonist's ongoing plot or implied goal in 250 words or less.
        Ensure your narration aligns with D&D 5e fantasy themes, character abilities, and typical role-playing scenarios that the famous DM Matt Mercer would narrate.`,
      };
      const narration = await this.context.getBackend().getNarration(locationChangePrompt);
      console.log ("Guidance for New Location Prompt:", locationChangePrompt);
      return [narration];
    }

    // Logic for other event types (user actions, combat, etc.)
    let sceneNarration = ""; // This will be populated by the original logic below
    // Find the most recent narration event
    for (let i = context.events.length - 1; i >= 0; i--) {
      const event = context.events[i];
      if (event.type === "narration") {
        sceneNarration = event.text;
        break; // Found, no need to continue
      }
    }

    let combatNarration = "";
    if (PCStats.plotType === "combat" && PCStats.encounter) {
      combatNarration = `Combat Round ${PCStats.encounter.roundNumber}. Combat Log: ${PCStats.encounter.combatLog.map(log => log.replace(/\\n/g, ' ')).join("; ")}.`;
    }

    // 1. Get consequence guidance from internal LLM call
    const checkResultStatements = checkResolutionResults?.map(cr => cr.resultStatement) || [];
    const internalGuidancePrompt = getConsequenceGuidancePrompt(sceneNarration, action || "", checkResultStatements);
    const consequenceGuidance = await this.context.getBackend().getNarration(internalGuidancePrompt);

    // 2. Get general D&D style guidance
    //To-Do: add rules for timing
    const dndStyleGuidance = getDndNarrationGuidance(eventType);

    // 3. Combine guidance into a string array
    const consolidatedGuidance = `${consequenceGuidance}\n\n${dndStyleGuidance}\n\n${combatNarration}`;
    console.log ("Consolidated Guidance for Narration Prompt:", consolidatedGuidance);

    // Return the consolidated guidance as a string array
    return [consolidatedGuidance];
  }

  /**
   * @method handleConsequence
   * @description Applies state changes based on the outcome of a check or event.
   * This method is called internally by `resolveCheck` and is solely responsible for modifying the plugin's internal state.
   * @param {string} eventType - The type of event triggering the consequence (e.g., "damage_dealt", "status_effect_applied").
   * @param {string[]} [checkResultStatements] - Optional: Statements describing results of checks that led to this consequence.
   * @param {string} [action] - Optional: The action that triggered the consequence.
   * @returns {void}
   */
  async handleConsequence(eventType: string, checkResultStatements?: string[], action?: string): Promise<void> {
    if (!this.settings) {
      console.error("Settings not available for handleConsequence.");
      return;
    }

    const PCStats = this.settings as DnDStats;

    // Example: If a "damage_dealt" event, update combatant HP
    if (eventType === "damage_dealt" && checkResultStatements && PCStats.plotType === "combat" && PCStats.encounter) {
      // This is a simplified example. In a real implementation, you'd parse
      // checkResultStatements to identify target and damage amount.
      // For now, let's assume the first statement contains enough info.
      const damageRegex = /dealt (\d+) (\w+) damage to (\w+)/;
      const match = checkResultStatements[0].match(damageRegex);

      if (match) {
        const damageAmount = parseInt(match[1]);
        const targetName = match[3];

        const targetCombatant = PCStats.encounter.combatants.find(
          (c: Combatant) => {
            const globalState = this.context?.getGlobalState();
            if (!globalState) return false;

            if (c.characterIndex === -1) { // Special case for protagonist
              return globalState.protagonist.name === targetName;
            } else {
              return globalState.characters[c.characterIndex].name === targetName;
            }
          }
        );

        if (targetCombatant) {
          targetCombatant.currentHp -= damageAmount;
          PCStats.encounter.combatLog.push(`${targetName} took ${damageAmount} damage.`);

          if (targetCombatant.currentHp <= 0) {
            targetCombatant.status = "dead";
            PCStats.encounter.combatLog.push(`${targetName} is dead.`);
            // Check if all enemies are dead to end combat
            const remainingEnemies = PCStats.encounter.combatants.filter(
              (c: Combatant) => c.status !== "dead" && c.status !== "fled" && c.status !== "surrendered" && c.isFriendly === false
            );
            if (remainingEnemies.length === 0) {
              PCStats.encounter.combatLog.push("Combat ends.");
              PCStats.plotType = "general";
              PCStats.encounter = undefined; // Clear encounter data
            }
          }
        }
      }
    }
    // Example: If "initiative_triggered" event, set plotType to combat and initialize encounter
    else if (eventType === "initiative_triggered" && PCStats.plotType !== "combat") {
      PCStats.plotType = "combat";

      // Define schema for LLM response about combatants
      const CombatantsLLMSchema = z.object({
        friendlyCharacters: z.array(z.object({
          name: z.string(),
          // Add other relevant character properties if needed from LLM
        })),
        namedEnemies: z.array(z.object({
          name: z.string(),
          // Add other relevant character properties if needed from LLM
        })),
        unnamedEnemiesCount: z.number().int().min(0),
        // Potentially add a description of the encounter for context
        encounterDescription: z.string().optional(),
      });

      // Construct LLM prompt
      let sceneNarration = "";
      const globalState = this.context?.getGlobalState();
      if (globalState) {
        for (let i = globalState.events.length - 1; i >= 0; i--) {
          const event = globalState.events[i];
          if (event?.type === "narration") {
            sceneNarration = event.text;
            break;
          }
        }
      }

      const combatantsPrompt: Prompt = {
        system: "You are an expert DM in Dungeons & Dragons 5th Edition in the narrative style of famous DM Matt Mercer.",
        user: `Based on the following scene narration, identify the combat participants:\n\nScene: ${sceneNarration}\nProtagonist: ${globalState?.protagonist.name}\n\nProvide a JSON object with the following structure:\n{\n  "friendlyCharacters": [
    { "name": "Protagonist's Name" },
    { "name": "Ally 1 Name" }
  ],
  "namedEnemies": [
    { "name": "Enemy 1 Name" },
    { "name": "Enemy 2 Name" }
  ],
  "unnamedEnemiesCount": 0,
  "encounterDescription": "A brief description of the combat encounter."
}`,
      };

      // Make LLM call
      const combatantsLLMResponse = await this.context!.getBackend().getObject(combatantsPrompt, CombatantsLLMSchema);

      const allCombatants: Combatant[] = [];

      // Explicitly add protagonist as a friendly combatant with a special index (-1)
      if (globalState?.protagonist) {
        allCombatants.push({
          characterIndex: -1, // Special index for protagonist
          currentHp: 10, // Placeholder HP for protagonist, to-do: need to map this to actual stats in settings
          maxHp: 10, // Placeholder HP for protagonist, to-do: need to map this to actual stats in settings
          status: "active",
          initiativeRoll: Math.floor(Math.random() * 20) + 1, // Placeholder initiative
          isFriendly: true,
        });
      }

      // Populate friendly characters from LLM response
      for (const char of combatantsLLMResponse.friendlyCharacters) {
        // Skip if this character is the protagonist (by name), as they are already added
        if (globalState?.protagonist && char.name === globalState.protagonist.name) {
          continue;
        }

        let charIndex = globalState?.characters.findIndex(c => c.name === char.name);
        if (charIndex === -1 || charIndex === undefined) {
          // If character not found in globalState.characters, add it
          charIndex = globalState?.characters.length || 0;
          globalState?.characters.push({ ...char, gender: "male", race: "human", biography: "", locationIndex: 0 }); // Placeholder for missing Character properties, to-do: get LLM's description to make the call on what to put here
        }
        allCombatants.push({
          characterIndex: charIndex,
          currentHp: 10, // Placeholder HP, to-do: should be based on hit dice or stats if available
          maxHp: 10, // Placeholder HP, to-do: should be based on hit dice or stats if available
          status: "active",
          initiativeRoll: Math.floor(Math.random() * 20) + 1, // Placeholder initiative
          isFriendly: true,
        });
      }

      // Populate named enemies
      for (const char of combatantsLLMResponse.namedEnemies) {
        let charIndex = globalState?.characters.findIndex(c => c.name === char.name);
        if (charIndex === -1 || charIndex === undefined) {
          charIndex = globalState?.characters.length || 0;
          globalState?.characters.push({ ...char, gender: "male", race: "human", biography: "", locationIndex: 0 }); // Placeholder for missing Character properties
        }
        allCombatants.push({
          characterIndex: charIndex,
          currentHp: 10, // Placeholder HP, to-do: should be based on hit dice or stats if available
          maxHp: 10, // Placeholder HP, to-do: should be based on hit dice or stats if available
          status: "active",
          initiativeRoll: Math.floor(Math.random() * 20) + 1, // Placeholder initiative
          isFriendly: false,
        });
      }

      // Populate unnamed enemies
      for (let i = 0; i < combatantsLLMResponse.unnamedEnemiesCount; i++) {
        const enemyName = `Unnamed Enemy ${i + 1}`; // Simple naming convention
        const enemyChar: Character = {
          name: enemyName,
          gender: "male", // Placeholder
          race: "human", // Placeholder
          biography: "A generic enemy.", // Placeholder
          locationIndex: 0, // Placeholder
        };
        let charIndex = globalState?.characters.length || 0;
        globalState?.characters.push(enemyChar);
        allCombatants.push({
          characterIndex: charIndex,
          currentHp: 20, // Placeholder HP
          maxHp: 20, // Placeholder HP
          status: "active",
          initiativeRoll: Math.floor(Math.random() * 20) + 1, // Placeholder initiative
          isFriendly: false,
        });
      }

      // Sort combatants by initiative (descending)
      allCombatants.sort((a, b) => b.initiativeRoll - a.initiativeRoll);

      PCStats.encounter = {
        roundNumber: 1,
        combatants: allCombatants,
        combatLog: ["Combat initiated."], //to-do: put actual logic in here to log actions and increase round number
      };
    }
  }

  /**
   * @method getActions
   * @description Provides a list of available actions based on the current game state and plot type.
   * @returns {Promise<string[]>} A promise that resolves to an array of action strings.
   */
  async getActions(): Promise<string[]> {
    if (!this.settings) {
      console.error("Settings not available for getActions.");
      return [];
    }

    const PCStats = this.settings as DnDStats;

    if (PCStats.plotType === "combat") {
      // Return combat-specific actions
      return ["Attack", "Defend", "Cast Spell", "Use Item", "Flee"];
    } else {
      // Return general actions
      return ["Explore", "Talk", "Rest", "Search", "Use Item", "Examine", "Use non-combat magic", "Use skill"];
    }
  }

}
