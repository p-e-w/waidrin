// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, RadioCards, SegmentedControl, Text, Tabs } from "@radix-ui/themes"; // Added Box and Tabs for layout and tab functionality
import { GiFemale, GiMale } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import ImageOption from "@/components/ImageOption";
import { usePluginsStateStore } from "@/app/plugins";
import WizardStep from "@/components/WizardStep";
import { type Gender, type Race, useStateStore } from "@/lib/state";

/**
 * CharacterSelect component for selecting protagonist gender, race, and character generation plugin UI
 * This component allows users to customize their character's appearance and attributes
 * before starting a new game. It integrates with plugin like manage and persist D&D-specific settings.
 */
export default function CharacterSelect({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  // Destructure gender, race, and setState from the Zustand state store.
  const { gender, race, setState } = useStateStore(
    useShallow((state) => ({
      gender: state.protagonist.gender,
      race: state.protagonist.race,
      setState: state.set,
    })),
  );

  const { characterUIs } = usePluginsStateStore(
    useShallow((state) => ({
      characterUIs: state.characterUIs,
    })),
  );

  return (
    <WizardStep title="Character" onNext={onNext} onBack={onBack}>
      {/* Tabs for Character Appearance and Rules plugin */}
      <Tabs.Root defaultValue="appearance">
        <Tabs.List>
          <Tabs.Trigger value="appearance">
            <Text size="6">Appearance</Text>
          </Tabs.Trigger>
              {characterUIs.map((characterUI) => (
                <Tabs.Trigger key={characterUI.GameRuleName} value={characterUI.GameRuleName}>
                  <Text size="6">{characterUI.GameRuleTab}</Text>
                </Tabs.Trigger>
              ))}          
        </Tabs.List>

        <Box mt="5">
          {/* Content for Appearance Tab */}
          <Tabs.Content value="appearance">
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

          {characterUIs.map((characterUI) => (
            <Tabs.Content key={characterUI.GameRuleName} value={characterUI.GameRuleName}>
              {characterUI.GameRulePage}
            </Tabs.Content>
          ))}
        </Box>
      </Tabs.Root>
    </WizardStep>
  );
}
