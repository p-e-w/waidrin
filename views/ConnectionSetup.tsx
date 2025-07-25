// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Code, Flex, Link, Tabs, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { GiOuroboros } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { usePluginsStateStore } from "@/app/plugins";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, apiKey, model, activeBackend, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      apiKey: state.apiKey,
      model: state.model,
      activeBackend: state.activeBackend,
      setState: state.set,
    })),
  );

  const { backendUIs } = usePluginsStateStore(
    useShallow((state) => ({
      backendUIs: state.backendUIs,
    })),
  );

  return (
    <WizardStep title="Connection" onNext={onNext} onBack={onBack}>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Tabs.Root
            value={activeBackend}
            onValueChange={(value) =>
              setState((state) => {
                state.activeBackend = value;
              })
            }
          >
            <Tabs.List>
              <Tabs.Trigger value="default">
                <Text size="6">OpenAI-compatible</Text>
              </Tabs.Trigger>
              {backendUIs.map((backendUI) => (
                <Tabs.Trigger key={backendUI.backendName} value={backendUI.backendName}>
                  <Text size="6">{backendUI.configurationTab}</Text>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Box mt="5">
              <Tabs.Content value="default">
                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">API base URL</Text>
                      <Text size="4" color="gray">
                        Usually ends with <Code size="3">/v1/</Code>
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={apiUrl}
                      onChange={(event) =>
                        setState((state) => {
                          state.apiUrl = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="http://localhost:5001/v1/"
                    />
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">API key</Text>
                      <Text size="4" color="gray">
                        Can be left empty for local servers
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={apiKey}
                      onChange={(event) =>
                        setState((state) => {
                          state.apiKey = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="X-ABCDE-123456789"
                    />
                    <Text size="4" color="orange">
                      <strong>Note:</strong> The key is stored in the browser, not on the server where Waidrin runs.
                    </Text>
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">Model</Text>
                      <Text size="4" color="gray">
                        Can be left empty for llama.cpp and Kobold
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={model}
                      onChange={(event) =>
                        setState((state) => {
                          state.model = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="mistral-small3.2"
                    />
                  </Label.Root>
                </Box>

                <Box>
                  <Text size="5" color="amber">
                    <strong>Note:</strong> Waidrin uses constrained generation. It requires support for JSON schema
                    constraints (the <Code size="4">response_format</Code> parameter with the{" "}
                    <Code size="4">json_schema</Code> type). Backends that support JSON schemas include the{" "}
                    <Link href="https://github.com/ggml-org/llama.cpp/tree/master/tools/server">llama.cpp server</Link>,{" "}
                    <Link href="https://github.com/LostRuins/koboldcpp">KoboldCpp</Link>,{" "}
                    <Link href="https://ollama.com">Ollama</Link>, and many cloud providers. Some providers support
                    schemas only for certain models; check the provider documentation if in doubt.
                  </Text>
                </Box>
              </Tabs.Content>

              {backendUIs.map((backendUI) => (
                <Tabs.Content key={backendUI.backendName} value={backendUI.backendName}>
                  {backendUI.configurationPage}
                </Tabs.Content>
              ))}
            </Box>
          </Tabs.Root>
        </Box>

        <Box className="w-[250px]">
          <GiOuroboros className="transform scale-x-[-1] -mr-5" size="250" color="var(--amber-8)" />
        </Box>
      </Flex>
    </WizardStep>
  );
}
