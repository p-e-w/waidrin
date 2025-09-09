// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

"use client";

import { Text } from "@radix-ui/themes";
import { current } from "immer";
import React, { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import ErrorPopup from "@/components/ErrorPopup";
import MainMenu from "@/components/MainMenu";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import StateDebugger from "@/components/StateDebugger";
import { abort, back, isAbortError, next } from "@/lib/engine";
import { getBackend } from "@/lib/backend";
import { type Plugin, type PluginWrapper, useStateStore } from "@/lib/state";
import CharacterSelect from "@/views/CharacterSelect";
import Chat from "@/views/Chat";
import ConnectionSetup from "@/views/ConnectionSetup";
import GenreSelect from "@/views/GenreSelect";
import ScenarioSetup from "@/views/ScenarioSetup";
import Welcome from "@/views/Welcome";
import { Context } from "./plugins";
import type { Manifest } from "./plugins/route";
import { AppLibs } from "./services/AppLibs";
import { AppBackend } from "./services/AppBackend";
import { AppStateManager } from "./services/AppStateManager";
import { AppUI } from "./services/AppUI";
import * as Immer from 'immer';
import * as RadixThemes from '@radix-ui/themes';
import * as ReactIconsGi from 'react-icons/gi';
import * as rpgDiceRoller from '@dice-roller/rpg-dice-roller';

export default function Home() {
  const [stateLoaded, setStateLoaded] = useState(false);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);

  // Instantiate granular services
  const appLibs = new AppLibs(
    React,
    Immer,
    RadixThemes,
    ReactIconsGi,
    useShallow,
    rpgDiceRoller,
  );

  const appBackend = new AppBackend(getBackend);

  const appStateManager = new AppStateManager(
    useStateStore.getState,
    useStateStore.getState().setAsync,
    useStateStore.setState,
  );

  const appUI = new AppUI(
    (title, message, tokenCount, visible = true) => {
      setOverlayVisible(visible);
      setOverlayTitle(title);
      setOverlayMessage(message);
      setOverlayTokenCount(tokenCount);
      setOnOverlayCancel(() => abort);
    },
    (errorMessage, onRetry, onCancel) => {
      setErrorMessage(errorMessage);
      setOnErrorRetry(() => onRetry);
      setOnErrorCancel(() => onCancel);
    },
    console.log, // Default log function
  );

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayTitle, setOverlayTitle] = useState("Loading");
  const [overlayMessage, setOverlayMessage] = useState("Restoring state...");
  const [overlayTokenCount, setOverlayTokenCount] = useState(-1);
  const [onOverlayCancel, setOnOverlayCancel] = useState<(() => void) | undefined>(undefined);

  const [errorMessage, setErrorMessage] = useState("");
  const [onErrorRetry, setOnErrorRetry] = useState<(() => void) | undefined>(undefined);
  const [onErrorCancel, setOnErrorCancel] = useState<(() => void) | undefined>(undefined);

  const { view, setStateAsync } = useStateStore(
    useShallow((state) => ({
      view: state.view,
      setStateAsync: state.setAsync,
    })),
  );

  const loadPlugins = async () => {
    setOverlayVisible(true);
    setOverlayTitle("Loading");
    setOverlayMessage("Loading plugin manifests...");
    setOverlayTokenCount(-1);
    setOnOverlayCancel(undefined);

    try {
      await setStateAsync(async (state) => {
        const response = await fetch("/plugins");
        const manifests: Manifest[] = await response.json();

        state.backends = {};

        outer: for (const manifest of manifests) {
          let pluginWrapper: PluginWrapper | null = null;

          for (const plugin of state.plugins) {
            if (plugin.name === manifest.name) {
              if (!plugin.enabled) {
                // Don't load disabled plugins at all.
                continue outer;
              }

              pluginWrapper = plugin;
              break;
            }
          }

          setOverlayMessage(`Loading plugin "${manifest.name}"...`);

          const module = await import(/* webpackIgnore: true */ `/plugins/${manifest.path}/${manifest.main}`);
          const pluginClass = module.default;
          const plugin: Plugin = new pluginClass();

          if (plugin.init) {
            const context = new Context(
              manifest.name,              
            );
            await plugin.init(
              pluginWrapper ? current(pluginWrapper.settings) : manifest.settings,
              context,
              appLibs,
              appBackend,
              appStateManager,
              appUI
            );
          }

          if (plugin.getBackends) {
            Object.assign(state.backends, await plugin.getBackends());
          }

          if (pluginWrapper) {
            // Preserve settings for plugins loaded from state store;
            // only replace the plugin module itself.
            pluginWrapper.plugin = plugin;
          } else {
            // Plugin is new.
            state.plugins.push({
              name: manifest.name,
              enabled: true,
              settings: manifest.settings,
              plugin,
            });
          }
        }
      });

      setPluginsLoaded(true);
      //console.log("DEBUG: PAGE: Plugins loaded. Current state.plugins:", useStateStore.getState().plugins);
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      if (!message) {
        message = "Unknown error";
      }
      setErrorMessage(message);
      setOnErrorRetry(() => () => {
        setErrorMessage("");
        loadPlugins();
      });
      setOnErrorCancel(undefined);
    } finally {
      setOverlayVisible(false);
    }
  };

  const nextView = async () => {
    try {
      await next(undefined, (title, message, tokenCount, visible = true) => {
        setOverlayVisible(visible);
        setOverlayTitle(title);
        setOverlayMessage(message);
        setOverlayTokenCount(tokenCount);
        setOnOverlayCancel(() => abort);
      });
    } catch (error) {
      if (!isAbortError(error)) {
        let message = error instanceof Error ? error.message : String(error);
        if (!message) {
          message = "Unknown error";
        }
        setErrorMessage(message);
        setOnErrorRetry(() => () => {
          setErrorMessage("");
          nextView();
        });
        setOnErrorCancel(() => () => setErrorMessage(""));
      }
    } finally {
      setOverlayVisible(false);
    }
  };

  useEffect(() => {
    if (useStateStore.persist.hasHydrated()) {
      setStateLoaded(true);
    } else {
      const unsubscribe = useStateStore.persist.onFinishHydration(() => {
        setStateLoaded(true);
      });

      return unsubscribe;
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This should run only once.
  useEffect(() => {
    if (stateLoaded) {
      loadPlugins();
    }
  }, [stateLoaded]);

  return (
    <>
      {stateLoaded && pluginsLoaded && (
        <>
          {view === "welcome" && <Welcome onNext={nextView} />}
          {view === "connection" && <ConnectionSetup onNext={nextView} onBack={back} />}
          {view === "genre" && <GenreSelect onNext={nextView} onBack={back} />}
          {view === "character" && <CharacterSelect onNext={nextView} onBack={back} appLibs={appLibs} appBackend={appBackend} appStateManager={appStateManager} appUI={appUI} />}
          {view === "scenario" && <ScenarioSetup onNext={nextView} onBack={back} />}
          {view === "chat" && <Chat />}

          <MainMenu />
          <StateDebugger />
        </>
      )}

      {overlayVisible && (
        <ProcessingOverlay title={overlayTitle} onCancel={onOverlayCancel}>
          <Text as="div" size="6">
            {overlayMessage}
          </Text>
          {overlayTokenCount >= 0 && (
            <Text className="tabular-nums" as="div" size="4" color="lime">
              {overlayTokenCount > 0 ? `Tokens generated: ${overlayTokenCount}` : "Waiting for response..."}
            </Text>
          )}
        </ProcessingOverlay>
      )}

      {errorMessage && <ErrorPopup errorMessage={errorMessage} onRetry={onErrorRetry} onCancel={onErrorCancel} />}
    </>
  );
}
