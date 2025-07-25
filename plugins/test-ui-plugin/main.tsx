// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  chengkaichee@gmail.com

/**
 * @file This file serves as an example UI plugin for the Waidrin application.
 * It demonstrates how to create custom React components within a plugin,
 * interact with the main application's global state, and utilize shared
 * libraries injected via the Context object.
 *
 * Key concepts demonstrated:
 * - Plugin initialization and Context object usage.
 * - Direct injection of shared React and UI libraries to avoid "two instances" problems.
 * - Accessing and updating the main application's global state using `setGlobalState` and `getGlobalState`.
 * - Persisting plugin-specific settings within the global state.
 * - Dynamic UI injection into predefined slots in the main application.
 *
 * This file is heavily commented to serve as a comprehensive guide for future UI plugin development.
 */

// Type-only imports for shared libraries and core types.
// These imports are crucial for TypeScript type checking but are removed during the build process
// to prevent bundling these libraries within the plugin, thus avoiding the "two Reacts" problem.
import type { WritableDraft } from "immer";
import type { Plugin, PluginWrapper, StoredState } from "@/lib/state";
import type { Context } from "@/app/plugins";
import type * as Immer from 'immer';
import type * as RadixThemes from '@radix-ui/themes';
import type * as ReactIconsGi from 'react-icons/gi';
import type { ChangeEvent } from 'react';
import type { useShallow } from 'zustand/shallow';

// Declare a module-level React variable.
// This variable will be assigned the main application's React instance during plugin initialization.
// This is essential for JSX transformation and ensuring all React operations within the plugin
// use the same React instance as the main application, preventing "two Reacts" issues.
let React: typeof import('react');

/**
 * @component TestUIAttributeDisplay
 * @description A simple React functional component demonstrating basic UI elements
 * and interaction within a plugin. It receives injected React and Radix Themes
 * instances via props and uses them for rendering and state management.
 * This component manages its own local state (`inputValue`, `displayValue`)
 * and propagates changes to its parent via the `onSave` callback.
 *
 * @param {string} initialAttributeValue - The initial value to display.
 * @param {typeof React} injectedReact - The main application's React instance.
 * @param {typeof RadixThemes} injectedRadixThemes - The main application's Radix Themes instance.
 * @param {(newValue: string) => Promise<void>} onSave - Callback to propagate saved changes to the parent. This callback is expected to handle asynchronous persistence of the new value.
 */
const TestUIAttributeDisplay = ({ initialAttributeValue, injectedReact, injectedRadixThemes, onSave }: {
  initialAttributeValue: string;
  injectedReact: typeof React;
  injectedRadixThemes: typeof RadixThemes;
  onSave: (newValue: string) => Promise<void>;
}) => {
  // Use the injected React's useState for local component state.
  const [inputValue, setInputValue] = injectedReact.useState("");
  const [displayValue, setDisplayValue] = injectedReact.useState("");

  // Update local input state and propagate change to parent on input change.
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Note: onSave is called on every change for immediate persistence demonstration.
    // In a real application, this might be debounced or triggered on blur/submit.
    await onSave(newValue);
  };

  // Apply button handler (demonstrates an explicit save action).
  const handleApply = async () => {
    await onSave(inputValue);
    setDisplayValue(inputValue);
  };

  // Initialize local state with initialAttributeValue when it changes.
  injectedReact.useEffect(() => {
     setInputValue(initialAttributeValue);
     setDisplayValue(initialAttributeValue);
   }, [initialAttributeValue]);

  return (
    <div>
      <injectedRadixThemes.Text>Custom Attribute:</injectedRadixThemes.Text>
      <injectedRadixThemes.TextField.Root
        value={inputValue}
        onChange={handleChange}
      />
      <injectedRadixThemes.Button onClick={handleApply}>Apply</injectedRadixThemes.Button>
      <injectedRadixThemes.Text> (Persisted: {displayValue})</injectedRadixThemes.Text>
    </div>
  );
};

/**
 * @component PluginCharacterUIPage
 * @description The main UI component provided by this plugin, intended to be
 * injected into the application's Character Select screen. This component
 * demonstrates how to read and update the main application's global state
 * using the `getGlobalState` and `setGlobalState` functions provided by the Context.
 *
 * @param {typeof React} injectedReact - The main application's React instance.
 * @param {typeof Immer} injectedImmer - The main application's Immer instance.
 * @param {typeof RadixThemes} injectedRadixThemes - The main application's Radix Themes instance.
 * @param {typeof ReactIconsGi} injectedReactIconsGi - The main application's React Icons (Gi) instance.
 * @param {() => StoredState} getGlobalState - Function to retrieve the current global application state.
 * @param {(updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>} setGlobalState - Function to asynchronously update the global application state.
 * @param {(newValue: string) => Promise<void>} onSave - Callback to propagate saved changes (used by child component). This callback is expected to handle asynchronous persistence of the new value.
 * @param {typeof useShallow} injectedUseShallow - The main application's `zustand/shallow`'s `useShallow` utility.
 */
const PluginCharacterUIPage = ({ injectedReact, injectedImmer, injectedRadixThemes, injectedReactIconsGi, getGlobalState, setGlobalState, onSave, injectedUseShallow }: {
  injectedReact: typeof React;
  injectedImmer: typeof Immer;
  injectedRadixThemes: typeof RadixThemes;
  injectedReactIconsGi: typeof ReactIconsGi;
  getGlobalState: () => StoredState;
  setGlobalState: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>;
  onSave: (newValue: string) => Promise<void>;
  injectedUseShallow: typeof useShallow;
}) => {
  /**
   * Read plugin-specific settings from the global state.
   * We use `injectedReact.useMemo` to memoize the result of `getGlobalState()`
   * and only re-evaluate if `getGlobalState` itself changes (which it shouldn't).
   * This ensures efficient re-renders and avoids unnecessary re-calculations.
   *
   * Pitfall Avoided: Previously, there was an attempt to use `injectedZustandStore.useStore` here.
   * This led to `TypeError: injectedZustandStore.useStore is not a function`.
   * Cause: `injectedZustandStore` was the `useStateStore` object itself, not a store created by `zustand.create()`.
   * `useStore` is a React Hook that operates on a store created by `zustand.create()`.
   * Solution: Directly use `getGlobalState()` provided by the Context to access the global state.
   */
  const pluginSettings = injectedReact.useMemo(() => {
    /**
     * Reads plugin-specific settings directly from the global state.
     * This approach ensures that the plugin always accesses the most current state
     * and avoids issues related to separate Zustand store instances.
     *
     * **Pitfall Avoided: Incorrect Zustand Store Access**
     * Previously, attempts were made to use `injectedZustandStore.useStore` here.
     * This led to `TypeError: injectedZustandStore.useStore is not a function` because
     * `injectedZustandStore` was the `useStateStore` object itself (the global store instance),
     * not a store created by `zustand.create()`. The `useStore` method is a React Hook
     * that operates on a store created by `zustand.create()`.
     *
     * **Solution:** Directly use `getGlobalState()` provided by the `Context` to access
     * the global state. `injectedReact.useMemo` is used to memoize the result and prevent
     * unnecessary re-calculations, re-evaluating only if `getGlobalState` itself changes.
     */
    const state = getGlobalState();
    // Find this plugin's settings within the global state's plugins array.
    const plugin = state.plugins.find((p: PluginWrapper) => p.name === "test-ui-plugin");
    return plugin ? plugin.settings : {};
  }, [getGlobalState]); // Dependency on getGlobalState to re-evaluate if the function reference changes.

  // Extract the customAttribute from plugin settings, providing a default value.
  const customAttribute = pluginSettings.customAttribute as string || "Default Value";

  return (
    <TestUIAttributeDisplay
      initialAttributeValue={customAttribute}
      injectedReact={injectedReact}
      injectedRadixThemes={injectedRadixThemes}
      onSave={onSave} // Propagate the onSave callback to the child component.
    />
  );
};

/**
 * @class TestUIPlugin
 * @description The main entry point for the UI plugin. This class implements the `Plugin` interface
 * and is responsible for initializing the plugin, registering its UI components with the main
 * application, and handling its internal state.
 */
export default class TestUIPlugin implements Plugin {
  private context: Context | undefined; // The Context object provided by the main application.
  private settings: Record<string, unknown> | undefined; // Internal copy of plugin settings.

  /**
   * @method init
   * @description Initializes the plugin. This method is called by the main application
   * during plugin loading. It receives the plugin's settings and the Context object.
   * @param {Record<string, unknown>} settings - The initial settings for this plugin.
   * @param {Context} context - The Context object providing access to main application functionalities.
   * @returns {Promise<void>}
   */
  async init(settings: Record<string, unknown>, context: Context): Promise<void> {
    this.context = context;
    this.settings = settings;

    // Assign the main application's React instance to the module-level React variable.
    // This is critical for all JSX within this plugin to use the correct React instance.
    React = this.context.react;

    // Register the plugin's UI component with the main application.
    // The PluginCharacterUIPage component is passed as a ReactNode, along with
    // necessary injected libraries and global state access functions as props.
    this.context.addCharacterUI(
      "Test UI", // GameRuleName: Display name for the UI tab.
      <span>Test UI Tab</span>, // GameRuleTab: The ReactNode for the tab trigger.
      <PluginCharacterUIPage
        // Pass injected shared libraries as props to the UI component.
        injectedReact={this.context.react}
        injectedImmer={this.context.immer}
        injectedRadixThemes={this.context.radixThemes}
        injectedReactIconsGi={this.context.reactIconsGi}
        injectedUseShallow={this.context.useShallow}
        // Pass global state access functions as props.
        getGlobalState={this.context.getGlobalState}
        setGlobalState={this.context.setGlobalState}
        // Define the onSave callback for the UI component.
        // This callback is responsible for updating the plugin's settings in the global state.
        onSave={async (newValue) => {
          /**
           * @description Updates the plugin's settings in the global state.
           * This function is asynchronous because `setGlobalState` itself is asynchronous,
           * wrapping `useStateStore.setAsync` from the main application.
           *
           * **Why `async` for the updater function?**
           * The `setGlobalState` function expects its updater callback to return a `Promise<void>`.
           * By marking the updater function `async`, it implicitly returns a Promise, satisfying
           * this type requirement and ensuring proper asynchronous flow control.
           * This prevents type errors that would occur if a synchronous function (returning `void`)
           * were passed to an `async`-expecting context.
           *
           * The update operates on an Immer draft of the global state, ensuring immutable updates
           * while allowing direct modification syntax.
           *
           * @param {WritableDraft<StoredState>} state - The Immer draft of the global state.
           */
          await this.context!.setGlobalState(async (state) => {
            // Find the current plugin's entry in the global state's plugins array.
            const plugin = state.plugins.find((p: PluginWrapper) => p.name === "test-ui-plugin");
            if (plugin) {
              // Directly modify the plugin's settings within the Immer draft.
              plugin.settings = { ...plugin.settings, customAttribute: newValue };
            }
          });
          // Also update the plugin's internal settings for immediate consistency.
          this.settings = { ...this.settings, customAttribute: newValue };
        }}
      />
    );
  }
}
