// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as React from "react"; // Import React
import { Box, RadioCards, SegmentedControl, Text, Tabs, Switch, Flex } from "@radix-ui/themes"; // Added Switch and Flex
import { GiFemale, GiMale } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import ImageOption from "@/components/ImageOption";
import { usePluginsStateStore, Context } from "@/app/plugins"; // Import Context
import { getBackend } from "@/lib/backend";
import WizardStep from "@/components/WizardStep";
import { type Gender, type Race, useStateStore } from "@/lib/state";
import type { IAppLibs } from "@/app/services/AppLibs";
import type { IAppBackend } from "@/app/services/AppBackend";
import type { IAppStateManager } from "@/app/services/AppStateManager";
import type { IAppUI } from "@/app/services/AppUI";

/**
 * CharacterSelect component for selecting protagonist gender, race, and character generation plugin UI
 * This component allows users to customize their character's appearance and attributes
 * before starting a new game. It integrates with plugin like manage and persist D&D-specific settings.
 */
export default function CharacterSelect({ onNext, onBack, appLibs, appBackend, appStateManager, appUI }: { onNext?: () => void; onBack?: () => void; appLibs: IAppLibs; appBackend: IAppBackend; appStateManager: IAppStateManager; appUI: IAppUI; }) {
  // Introduce local state for tab management
  const [activeTabKey, setActiveTabKey] = React.useState('default'); // 'default' for Appearance tab

  // Destructure gender, race, and setState from the Zustand state store.
  const { gender, race, setState, plugins, protagonist } = useStateStore( // Removed activeGameRule
    useShallow((state) => ({
      gender: state.protagonist.gender,
      race: state.protagonist.race,
      setState: state.set,
      plugins: state.plugins, // Get plugins from global state
      protagonist: state.protagonist, // Get protagonist for ImageOption
    })),
  );

  const { characterUIs } = usePluginsStateStore(
    useShallow((state) => ({
      characterUIs: state.characterUIs,
    })),
  );

  // Instantiate Context to access setPluginSelected
  const context = new Context(
    "CharacterSelect", // A dummy pluginName, as this is not a plugin
    null as any, // React instance is not needed here
    //useStateStore.getState().setAsync,
    useStateStore.getState,
    null as any, // immer not needed
    null as any, // radixThemes not needed
    null as any, // reactIconsGi not needed
    null as any, // useShallow not needed
    null as any, // rpgDiceRoller not needed
    getBackend,
    (title, message, tokenCount) => {
      // CharacterSelect does not have its own overlay state, so we'll use the global state
      // This is a simplified approach for now. A more robust solution might involve
      // passing a prop from page.tsx to CharacterSelect.tsx to manage overlay.
      // For now, we'll just log it or use a dummy function.
      console.log(`Overlay Update from CharacterSelect: ${title} - ${message} (${tokenCount} tokens)`);
    },
    appLibs,
    appBackend,
    appStateManager,
    appUI,
  );

  const handlePluginSelectionToggle = (pluginName: string, isSelected: boolean) => {
    context.setPluginSelected(pluginName, isSelected);
  };
  // Find all currently selected plugins' names for display
  const currentlySelectedPlugins = plugins.filter(p => p.selectedPlugin);
  const activeGameRuleDisplay = currentlySelectedPlugins.length > 0
    ? currentlySelectedPlugins.map(p => p.name).join(", ")
    : "Default";

  return (
    <WizardStep title="Character" onNext={onNext} onBack={onBack}>
      <Flex direction="column" gap="4" mb="4">
        <Text size="6">Active Game Rule: {activeGameRuleDisplay}</Text>
      </Flex>

      {/* Tabs for Character Appearance and Rules plugin */}
      <Tabs.Root value={activeTabKey} onValueChange={setActiveTabKey}>
        <Tabs.List>
          <Tabs.Trigger value="default">
            <Text size="6">Appearance</Text>
          </Tabs.Trigger>
          {characterUIs.map((characterUI) => {
            const plugin = plugins.find(p => p.name === characterUI.GameRuleName);
            const isSelected = plugin?.selectedPlugin || false;
            return (
              <Tabs.Trigger key={characterUI.GameRuleName} value={characterUI.GameRuleName}>
                <Flex align="center" gap="2">
                  {/* Removed redundant <Text size="6"> wrapper */}
                  {characterUI.GameRuleTab}
                  {isSelected && (
                    <Box
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: 'red',
                        boxShadow: '0 0 5px red',
                      }}
                    />
                  )}
                </Flex>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        <Box mt="5">
          {/* Content for Appearance Tab */}
          <Tabs.Content value="default">
            {/* SegmentedControl for Gender Selection */}
          <SegmentedControl.Root
              value={gender}
              onValueChange={(value: Gender) =>
                setState((state) => {
                  state.protagonist.gender = value;
                })
              }
              className="w-full"
              size="3"
              mb="5"
            >
              <SegmentedControl.Item value="male">
                <GiMale className="inline mt-[-7px]" size="25" /> <Text size="6">Male</Text>
              </SegmentedControl.Item>
              <SegmentedControl.Item value="female">
                <GiFemale className="inline mt-[-7px]" size="25" /> <Text size="6">Female</Text>
              </SegmentedControl.Item>
            </SegmentedControl.Root>

            {/* RadioCards for Race Selection */}
            <RadioCards.Root
              value={race}
              onValueChange={(value: Race) =>
                setState((state) => {
                  state.protagonist.race = value;
                })
              }
              columns="3"
            >
              {/* ImageOption components for each race, dynamically setting image based on gender */}
              <ImageOption title="Human" image={`${gender}-human`} value="human" />
              <ImageOption title="Elf" image={`${gender}-elf`} value="elf" />
              <ImageOption title="Dwarf" image={`${gender}-dwarf`} value="dwarf" />
            </RadioCards.Root>
          </Tabs.Content>

          {characterUIs.map((characterUI) => {
            const plugin = plugins.find(p => p.name === characterUI.GameRuleName);
            const isSelected = plugin?.selectedPlugin || false;
            return (
              <Tabs.Content key={characterUI.GameRuleName} value={characterUI.GameRuleName}>
                <Flex direction="column" gap="4" mb="4">
                  <Flex align="center" gap="2">
                    <Text size="4">Enable this plugin's game rule logic:</Text>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => handlePluginSelectionToggle(characterUI.GameRuleName, checked)}
                    />
                  </Flex>
                  {characterUI.GameRulePage}
                </Flex>
              </Tabs.Content>
            );
          })}
        </Box>
      </Tabs.Root>
    </WizardStep>
  );
}
