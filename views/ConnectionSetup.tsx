// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { GiOuroboros } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      setState: state.set,
    })),
  );

  return (
    <WizardStep title="AI Model Configuration" onNext={onNext} onBack={onBack}>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Box mb="5">
            <Label.Root>
              <Text size="6">API Endpoint</Text>
              <TextField.Root
                value={apiUrl}
                onChange={(event) =>
                  setState((state) => {
                    state.apiUrl = event.target.value;
                  })
                }
                className="mt-1 font-mono"
                size="3"
                placeholder="https://text.pollinations.ai/openai"
              />
            </Label.Root>
          </Box>

          <Box mb="5">
            <Text size="5" color="mint">
              <strong>Powered by Pollinations AI:</strong> This setup uses the free Pollinations AI service. 
              The <strong>Mistral Small 3.1 24B</strong> model is used by default for the best balance of performance and capability for RPG storytelling.
            </Text>
          </Box>

          <Box>
            <Text size="5" color="blue">
              <strong>Note:</strong> Pollinations AI provides free access to various AI models through their OpenAI-compatible API. 
              No API key is required. Learn more at{" "}
              <Link href="https://pollinations.ai" target="_blank">pollinations.ai</Link>.
            </Text>
          </Box>
        </Box>

        <Box className="w-[250px]">
          <GiOuroboros className="transform scale-x-[-1] -mr-5" size="250" color="var(--amber-8)" />
        </Box>
      </Flex>
    </WizardStep>
  );
}
