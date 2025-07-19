// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Card, Flex, Link, RadioGroup, ScrollArea, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { GiOuroboros } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import WizardStep from "@/components/WizardStep";
import { testConnection } from "@/lib/engine";
import { openRouterProvider } from "@/lib/openrouter-provider";
import type { StandardizedModelType } from "@/lib/openrouter-types";
import { searchModels, validateApiKey } from "@/lib/openrouter-utils";
import type { ConnectionType } from "@/lib/state";
import { useStateStore } from "@/lib/state";

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, connectionType, openRouterConfig, availableModels, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      connectionType: state.connectionType,
      openRouterConfig: state.openRouterConfig,
      availableModels: state.availableModels,
      setState: state.set,
    })),
  );

  // Connection testing state
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionError, setConnectionError] = useState<string>("");

  // Model fetching state
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [fetchError, setFetchError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form validation
  const isFormValid = () => {
    if (connectionType === "llamacpp") {
      return apiUrl.trim() !== "";
    } else if (connectionType === "openrouter") {
      return (
        openRouterConfig.apiKey &&
        openRouterConfig.apiKey.trim() !== "" &&
        openRouterConfig.selectedModel &&
        openRouterConfig.selectedModel.trim() !== ""
      );
    }
    return false;
  };

  // Check if we can fetch models (valid API key)
  const canFetchModels =
    connectionType === "openrouter" && openRouterConfig.apiKey && validateApiKey(openRouterConfig.apiKey);

  // Filter available models based on search query only
  const filteredModels = useMemo(() => {
    return searchModels(availableModels, searchQuery);
  }, [availableModels, searchQuery]);

  // Model fetching
  const handleFetchModels = async () => {
    if (!canFetchModels) return;

    setFetchStatus("loading");
    setFetchError("");

    try {
      const config = {
        apiKey: openRouterConfig.apiKey || "",
        baseUrl: "https://openrouter.ai/api/v1",
        selectedModel: openRouterConfig.selectedModel,
      };

      const models = await openRouterProvider.fetchModels(config);

      setState((state) => {
        state.availableModels = models;
      });
      setFetchStatus("success");
    } catch (error) {
      console.error("Model fetch error:", error);
      setFetchStatus("error");
      setFetchError(error instanceof Error ? error.message : "Failed to fetch models");
    }
  };

  // Connection testing
  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    setConnectionError("");

    try {
      await testConnection();
      setConnectionStatus("success");
    } catch (error) {
      setConnectionStatus("error");
      setConnectionError(error instanceof Error ? error.message : "Connection failed");
    }
  };

  // Clear models when API key changes
  const handleApiKeyChange = (value: string) => {
    setState((state) => {
      state.openRouterConfig.apiKey = value;
      state.openRouterConfig.selectedModel = undefined;
      state.availableModels = [];
    });
    setFetchStatus("idle");
    setSearchQuery("");
  };

  return (
    <WizardStep title="Connection" onNext={isFormValid() ? onNext : undefined} onBack={onBack}>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          {/* Provider Selection */}
          <Box mb="6">
            <Label.Root>
              <Text size="6" mb="3" style={{ display: "block" }}>
                Choose Connection Type
              </Text>
              <RadioGroup.Root
                value={connectionType}
                onValueChange={(value: ConnectionType) =>
                  setState((state) => {
                    state.connectionType = value;
                  })
                }
              >
                <Flex direction="column" gap="3">
                  <Text as="label" size="4">
                    <Flex gap="2" align="center">
                      <RadioGroup.Item value="llamacpp" />
                      <Box>
                        <Text weight="medium">llama.cpp Server</Text>
                        <Text size="2" color="gray" style={{ display: "block" }}>
                          Connect to a local llama.cpp server instance
                        </Text>
                      </Box>
                    </Flex>
                  </Text>
                  <Text as="label" size="4">
                    <Flex gap="2" align="center">
                      <RadioGroup.Item value="openrouter" />
                      <Box>
                        <Text weight="medium">OpenRouter</Text>
                        <Text size="2" color="gray" style={{ display: "block" }}>
                          Connect to OpenRouter API with your API key
                        </Text>
                      </Box>
                    </Flex>
                  </Text>
                </Flex>
              </RadioGroup.Root>
            </Label.Root>
          </Box>

          {/* Configuration Panel for llama.cpp */}
          {connectionType === "llamacpp" && (
            <Box mb="5">
              <Label.Root>
                <Text size="6">
                  Address (host+port) of running{" "}
                  <Link href="https://github.com/ggml-org/llama.cpp/tree/master/tools/server">llama.cpp server</Link>
                </Text>
                <TextField.Root
                  value={apiUrl}
                  onChange={(event) =>
                    setState((state) => {
                      state.apiUrl = event.target.value;
                    })
                  }
                  className="mt-1 font-mono"
                  size="3"
                  placeholder="http://localhost:8080"
                />
              </Label.Root>
            </Box>
          )}

          {/* Information sections */}
          {connectionType === "llamacpp" && (
            <>
              <Box mb="5">
                <Text size="5" color="amber">
                  <strong>Note:</strong> Waidrin uses advanced features such as constrained generation. It{" "}
                  <strong>requires</strong> the llama.cpp server. Other backends are not supported. OpenAI API
                  compatibility is not sufficient. Even backends that do offer JSON constraints often have subtle
                  differences regarding which schema features are supported. If you decide to experiment with
                  alternative backends, be prepared to debug such issues.
                </Text>
              </Box>

              <Box>
                <Text size="5" color="mint">
                  The recommended model is <strong>Mistral Small 2506</strong>. GGUFs are available{" "}
                  <Link href="https://huggingface.co/bartowski/mistralai_Mistral-Small-3.2-24B-Instruct-2506-GGUF">
                    here
                  </Link>
                  . Use whichever quant fits your VRAM. Make sure you load the model with a context size of at least{" "}
                  <strong>16k</strong>.
                </Text>
              </Box>
            </>
          )}

          {/* Configuration Panel for OpenRouter */}
          {connectionType === "openrouter" && (
            <>
              <Box mb="5">
                <Label.Root>
                  <Text size="6">OpenRouter API Key</Text>
                  <Flex gap="2" align="center" className="mt-1">
                    <TextField.Root
                      value={openRouterConfig.apiKey || ""}
                      onChange={(event) => handleApiKeyChange(event.target.value)}
                      className="font-mono"
                      size="3"
                      placeholder="sk-or-v1-..."
                      type="password"
                      style={{ flex: 1 }}
                    />
                    <Button
                      onClick={handleFetchModels}
                      disabled={!canFetchModels || fetchStatus === "loading"}
                      variant="outline"
                      size="3"
                    >
                      {fetchStatus === "loading" ? "Fetching..." : "Fetch Models"}
                    </Button>
                  </Flex>
                </Label.Root>

                {fetchStatus === "error" && (
                  <Text size="2" color="red" style={{ display: "block", marginTop: "8px" }}>
                    ✗ {fetchError}
                  </Text>
                )}

                {fetchStatus === "success" && availableModels.length > 0 && (
                  <Text size="2" color="green" style={{ display: "block", marginTop: "8px" }}>
                    ✓ Fetched {availableModels.length} models
                  </Text>
                )}

                {fetchStatus === "success" && availableModels.length === 0 && (
                  <Text size="2" color="amber" style={{ display: "block", marginTop: "8px" }}>
                    ⚠ No models found
                  </Text>
                )}
              </Box>

              <Box mb="5">
                <Label.Root>
                  <Text size="6">Select Model</Text>

                  {availableModels.length > 0 && (
                    <Box className="mt-1 mb-3">
                      <TextField.Root
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search models..."
                        size="3"
                        className="mb-3"
                      />
                      <Text
                        size="4"
                        color="red"
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          padding: "8px",
                          backgroundColor: "var(--red-2)",
                          border: "1px solid var(--red-6)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>⚠️ IMPORTANT:</strong> For Waidrin to work as intended, please select a model that
                        supports <code>structured_outputs</code>. Models without this feature may not work properly with
                        Waidrin.
                      </Text>
                    </Box>
                  )}

                  {availableModels.length === 0 ? (
                    <Box
                      className="mt-1 p-4 border border-gray-300 rounded"
                      style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Text size="3" color="gray">
                        {fetchStatus === "idle"
                          ? 'Enter your API key and click "Fetch Models" to see available models'
                          : fetchStatus === "loading"
                            ? "Loading models..."
                            : fetchStatus === "error"
                              ? "Failed to load models"
                              : "No models available"}
                      </Text>
                    </Box>
                  ) : filteredModels.length === 0 ? (
                    <Box
                      className="mt-1 p-4 border border-gray-300 rounded"
                      style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Text size="3" color="gray">
                        No models found matching "{searchQuery}"
                      </Text>
                    </Box>
                  ) : (
                    <ScrollArea style={{ height: "240px", width: "100%" }} className="mt-1">
                      <Flex direction="column" gap="2" style={{ width: "100%" }}>
                        {filteredModels.map((model: StandardizedModelType) => (
                          <Card
                            key={model.id}
                            variant={openRouterConfig.selectedModel === model.id ? "surface" : "ghost"}
                            style={{
                              padding: openRouterConfig.selectedModel === model.id ? "11px" : "12px",
                              cursor: "pointer",
                              border:
                                openRouterConfig.selectedModel === model.id
                                  ? "2px solid var(--accent-9)"
                                  : "1px solid var(--gray-6)",
                              background:
                                openRouterConfig.selectedModel === model.id ? "var(--accent-2)" : "var(--gray-1)",
                              width: "calc(100% - 4px)",
                              maxWidth: "calc(100% - 4px)",
                              overflow: "hidden",
                              boxSizing: "border-box",
                              marginRight: "4px",
                            }}
                            onClick={() =>
                              setState((state) => {
                                state.openRouterConfig.selectedModel = model.id;
                              })
                            }
                          >
                            <Flex direction="column" gap="1" style={{ width: "100%", minWidth: 0 }}>
                              <Flex justify="between" align="center" style={{ width: "100%", minWidth: 0 }}>
                                <Text
                                  weight="medium"
                                  size="3"
                                  style={{ wordBreak: "break-word", minWidth: 0, flex: 1 }}
                                >
                                  {model.name}
                                </Text>
                                {model.supportsStructuredOutputs && (
                                  <Text size="1" color="green" weight="medium">
                                    ✓ Structured
                                  </Text>
                                )}
                              </Flex>
                              {model.description && (
                                <Text size="2" color="gray">
                                  {model.description.length > 100
                                    ? `${model.description.substring(0, 100)}...`
                                    : model.description}
                                </Text>
                              )}
                              <Flex gap="4" align="center" style={{ width: "100%", minWidth: 0, flexWrap: "wrap" }}>
                                {model.contextLength && (
                                  <Text size="2" color="blue" style={{ whiteSpace: "nowrap" }}>
                                    {model.contextLength.toLocaleString()} tokens
                                  </Text>
                                )}
                                {model.pricing && (
                                  <Text size="2" color="gray" style={{ wordBreak: "break-word", minWidth: 0 }}>
                                    ${(model.pricing.input * 1000000).toFixed(2)}/$
                                    {(model.pricing.output * 1000000).toFixed(2)} per 1M tokens
                                  </Text>
                                )}
                              </Flex>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    </ScrollArea>
                  )}
                </Label.Root>
              </Box>

              <Box>
                <Text size="5" color="blue">
                  <strong>OpenRouter:</strong> Access to a wide variety of AI models through a single API. You'll need
                  an API key from <Link href="https://openrouter.ai">OpenRouter</Link> to get started.
                </Text>
              </Box>
            </>
          )}

          {/* Connection Testing */}
          {isFormValid() && (
            <Box mt="6" mb="5">
              <Flex direction="column" gap="3">
                <Button
                  onClick={handleTestConnection}
                  disabled={connectionStatus === "testing"}
                  variant="outline"
                  size="3"
                >
                  {connectionStatus === "testing" ? "Testing Connection..." : "Test Connection"}
                </Button>

                {connectionStatus === "success" && (
                  <Text size="3" color="green">
                    ✓ Connection successful!
                  </Text>
                )}

                {connectionStatus === "error" && (
                  <Text size="3" color="red">
                    ✗ Connection failed: {connectionError}
                  </Text>
                )}
              </Flex>
            </Box>
          )}
        </Box>

        <Box className="w-[250px]">
          <GiOuroboros className="transform scale-x-[-1] -mr-5" size="250" color="var(--amber-8)" />
        </Box>
      </Flex>
    </WizardStep>
  );
}
