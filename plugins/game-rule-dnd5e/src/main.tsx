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
import type { Plugin, PluginWrapper, StoredState, IGameRuleLogic } from "@/lib/state";
import type { Context } from "@/app/plugins";

import type * as RadixThemes from '@radix-ui/themes';
import type { useShallow } from 'zustand/shallow';
import { DndStatsSettings, generateDefaultDndStatsSettings, DND_CLASS_DATA, DndStatsSettingsSchema } from "./pluginData";
import { getProtagonistGenerationPrompt } from "./pluginPrompt";


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
  setGlobalState: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>;
  onSave: (newSettings: DndStatsSettings) => Promise<void>;
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
  setGlobalState,
  onSave,
  injectedUseShallow,
  injectedRpgDiceRoller,
}: DndStatsCharacterUIPageProps) => {
  const pluginSettings = injectedReact.useMemo(() => {
    const state = getGlobalState();
    const plugin = state.plugins.find((p: PluginWrapper) => p.name === "game-rule-dnd5e");
    //console.log("DndStatsCharacterUIPage - plugin.settings:", plugin ? plugin.settings : "not found");
    const settingsToUse = plugin ? (plugin.settings as DndStatsSettings) : generateDefaultDndStatsSettings(injectedRpgDiceRoller);
    //console.log("DndStatsCharacterUIPage - pluginSettings (after useMemo):", settingsToUse);
    return settingsToUse;
  }, [getGlobalState, injectedRpgDiceRoller]);

  const [currentSettings, setCurrentSettings] = injectedReact.useState<DndStatsSettings>(pluginSettings);
  injectedReact.useEffect(() => {
    setCurrentSettings(pluginSettings);
  }, [pluginSettings]);

  const handleChange = (key: keyof DndStatsSettings, value: string | number) => {
    setCurrentSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = async () => {
    await onSave(currentSettings);
  };

  const availableSubclasses = DND_CLASS_DATA[currentSettings.dndClass] || [];

  return (
    <injectedRadixThemes.Theme>
      <injectedRadixThemes.Box p="4">
        <injectedRadixThemes.Text size="6" mb="4">D&D 5E Character Stats</injectedRadixThemes.Text>

        {Object.keys(DndStatsSettingsSchema.shape).filter(key => key !== 'dndClass' && key !== 'dndSubclass').map((key) => (
          <injectedRadixThemes.Flex direction="column" gap="2" mb="3" key={key}>
            <injectedRadixThemes.Text size="2" weight="bold">{key.charAt(0).toUpperCase() + key.slice(1)}:</injectedRadixThemes.Text>
            <injectedRadixThemes.TextField.Root
              type="number"
              value={currentSettings[key as keyof DndStatsSettings] as number}
              onChange={(e) => handleChange(key as keyof DndStatsSettings, parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </injectedRadixThemes.Flex>
        ))}

        <injectedRadixThemes.Flex direction="column" gap="2" mb="3">
          <injectedRadixThemes.Text size="2" weight="bold">Class:</injectedRadixThemes.Text>
          <injectedRadixThemes.Select.Root
            value={currentSettings.dndClass}
            onValueChange={(value) => handleChange('dndClass', value)}
          >
            <injectedRadixThemes.Select.Trigger />
            <injectedRadixThemes.Select.Content>
              {Object.keys(DND_CLASS_DATA).map((className) => (
                <injectedRadixThemes.Select.Item value={className} key={className}>
                  {className}
                </injectedRadixThemes.Select.Item>
              ))}
            </injectedRadixThemes.Select.Content>
          </injectedRadixThemes.Select.Root>
        </injectedRadixThemes.Flex>

        {currentSettings.dndClass && (
          <injectedRadixThemes.Flex direction="column" gap="2" mb="3">
            <injectedRadixThemes.Text size="2" weight="bold">Subclass:</injectedRadixThemes.Text>
            <injectedRadixThemes.Select.Root
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

        <injectedRadixThemes.Flex gap="2" mt="4"> {/* Added Flex container for buttons */}
          <injectedRadixThemes.Button onClick={handleApply}>Apply Changes</injectedRadixThemes.Button>
          <injectedRadixThemes.Button onClick={() => setCurrentSettings(generateDefaultDndStatsSettings(injectedRpgDiceRoller))} variant="outline">Re-roll</injectedRadixThemes.Button> {/* Added Re-roll button */}
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
  private settings: DndStatsSettings | undefined; // The plugin's settings

  /**
   * Initializes the plugin with its settings and context.
   * Parses and validates incoming settings using DndStatsSettingsSchema,
   * merging them with default values.
   * @param settings - The settings object provided by the application.
   * @param context - The plugin context, providing access to application functionalities.
   */
  async init(settings: Record<string, unknown>, context: Context): Promise<void> {
    this.context = context;
    //console.log("DndStatsPlugin - init settings parameter:", settings);
    // Parse and validate settings, applying defaults for missing properties
    this.settings = DndStatsSettingsSchema.parse({ ...generateDefaultDndStatsSettings(this.context.rpgDiceRoller), ...settings });
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
        setGlobalState={this.context.setGlobalState}
        injectedUseShallow={this.context.useShallow}
        injectedRpgDiceRoller={this.context.rpgDiceRoller}
        onSave={async (newSettings) => {
          await this.context!.setGlobalState(async (state) => {
            const plugin = state.plugins.find((p: PluginWrapper) => p.name === "game-rule-dnd5e");
            if (plugin) {
              plugin.settings = { ...plugin.settings, ...newSettings };
            }
          });
          this.settings = { ...this.settings, ...newSettings };
        }}
      />
    );
  }

  getGameRuleLogic(): IGameRuleLogic {
    return this;
  }

  async getInitialProtagonistStats(): Promise<string> {
    if (!this.settings || !this.context) {
        return "";
    }
    const stats = this.settings as DndStatsSettings;
    const pc = this.context.getGlobalState();
    const prompt = getProtagonistGenerationPrompt(stats, pc);

    const narration = await this.context!.getBackend().getNarration(prompt);
    return narration;
  }
}