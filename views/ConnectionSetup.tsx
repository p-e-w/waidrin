// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Flex, Link, Text, TextField, Select } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { GiOuroboros } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { useState, useEffect } from "react";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";

interface PollinationsModel {
  name: string;
  description: string;
  provider: string;
  tier: string;
  tools?: boolean;
}

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, model, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      model: state.model,
      setState: state.set,
    })),
  );

  const [availableModels, setAvailableModels] = useState<PollinationsModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await fetch('https://text.pollinations.ai/models');
        const models: PollinationsModel[] = await response.json();
        // Filter to show only the most useful models for text generation
        const filteredModels = models.filter(m => 
          !m.name.includes('audio') && 
          !m.name.includes('vision') && 
          m.name !== 'evil' && 
          m.name !== 'unity' &&
          !m.name.includes('roblox')
        );
        setAvailableModels(filteredModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to some known models
        setAvailableModels([
          { name: 'mistral', description: 'Mistral Small 3.1 24B', provider: 'cloudflare', tier: 'anonymous' },
          { name: 'deepseek', description: 'DeepSeek V3', provider: 'azure', tier: 'flower' },
          { name: 'openai', description: 'OpenAI GPT-4o Mini', provider: 'azure', tier: 'anonymous' },
          { name: 'qwen-coder', description: 'Qwen 2.5 Coder 32B', provider: 'scaleway', tier: 'anonymous' },
        ]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

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
            <Label.Root>
              <Text size="6">Model</Text>
              <Select.Root
                value={model}
                onValueChange={(value) =>
                  setState((state) => {
                    state.model = value;
                  })
                }
              >
                <Select.Trigger className="mt-1" placeholder="Select a model..." />
                <Select.Content>
                  {isLoadingModels ? (
                    <Select.Item value="loading" disabled>Loading models...</Select.Item>
                  ) : (
                    availableModels.map((m) => (
                      <Select.Item key={m.name} value={m.name}>
                        <Text>{m.description}</Text>
                      </Select.Item>
                    ))
                  )}
                </Select.Content>
              </Select.Root>
            </Label.Root>
          </Box>

          <Box mb="5">
            <Text size="5" color="mint">
              <strong>Powered by Pollinations AI:</strong> This setup uses the free Pollinations AI service with multiple model options. 
              The <strong>Mistral Small 3.1 24B</strong> model is recommended for the best balance of performance and capability for RPG storytelling.
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
