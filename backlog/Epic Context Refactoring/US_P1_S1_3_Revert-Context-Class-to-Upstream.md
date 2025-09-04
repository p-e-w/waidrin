## US_P1_S1_3: Revert `Context` Class in `app/plugins.ts` to Upstream Definition

**As a:** Core Application Developer
**I want to:** Revert the `Context` class in `app/plugins.ts` to match the definitive upstream definition
**So that:** `plugin.ts` is fully compatible with the upcoming upstream `HEAD` merge, including the `addCharacterUI` method, after plugins have migrated to direct granular service injection.

**User Discussion**
**Goal:** Make the `Context` class in `app/plugins.ts` and its supporting elements structurally equivalent to the composite upstream definition.
**Composite Upstream Definition for `app/plugins.ts`:**

```typescript
// This is a composite definition based on user's feedback and previous upstream snippet
import type { WritableDraft } from "immer";
import type React from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { getState } from "@/lib/state";

export interface BackendUI {
  backendName: string;
  configurationTab: React.ReactNode;
  configurationPage: React.ReactNode;
}

export interface CharacterUI {
  GameRuleName: string;
  GameRuleTab: React.ReactNode;
  GameRulePage: React.ReactNode;
}

export interface PluginsState {
  backendUIs: BackendUI[];
  characterUIs: CharacterUI[];
  set: (
    nextStateOrUpdater: PluginsState | Partial<PluginsState> | ((state: WritableDraft<PluginsState>) => void),
    shouldReplace?: false,
  ) => void;
}

export const usePluginsStateStore = create<PluginsState>()(
  immer((set) => ({
    backendUIs: [],
    characterUIs: [],
    set: set,
  })),
);

export function getPluginsState(): PluginsState {
  return usePluginsStateStore.getState();
}

export class Context {
  pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  // Must not be called from a plugin's init method, or from a narration hook.
  saveSettings(settings: Record<string, unknown>): void {
    getState().set((state) => {
      for (const plugin of state.plugins) {
        if (plugin.name === this.pluginName) {
          plugin.settings = settings;
          return;
        }
      }

      throw new Error(`No settings object found for plugin ${this.pluginName}`);
    });
  }

  addBackendUI(backendName: string, configurationTab: React.ReactNode, configurationPage: React.ReactNode): void {
    getPluginsState().set((state) => {
      state.backendUIs.push({
        backendName,
        configurationTab,
        configurationPage,
      });
    });
  }

  addCharacterUI(GameRuleName: string, GameRuleTab: React.ReactNode, GameRulePage: React.ReactNode): void {
    getPluginsState().set((state) => {
      state.characterUIs.push({
        GameRuleName,
        GameRuleTab,
        GameRulePage,
      });
    });
  }
}
```

**Work:**
*   In `app/plugins.ts`, modify the `Context` class and supporting interfaces (`BackendUI`, `CharacterUI`, `PluginsState`) and store (`usePluginsStateStore`) to precisely match the composite upstream definition provided above.
*   This involves:
    *   Removing all properties from `Context` that are not in this composite definition (e.g., `react`, `getGlobalState`, `immer`, `radixThemes`, `reactIconsGi`, `useShallow`, `rpgDiceRoller`, `getBackend`, `updateProgress`, `setPluginSelected`).
    *   Ensuring `saveSettings`, `addBackendUI`, and `addCharacterUI` methods are present and match this definition.
    *   Updating `PluginsState` to include `characterUIs`.
    *   Updating `usePluginsStateStore` to initialize `characterUIs`.

**Acceptance Criteria:**

*   **Verification of `Context` Class Structure:**
    *   Verify that the `Context` class in `app/plugins.ts` contains only the `pluginName` property.
    *   Verify that the `Context` class constructor accepts only `pluginName`.
    *   Verify that the `Context` class contains the `saveSettings`, `addBackendUI`, and `addCharacterUI` methods with their specified signatures.
    *   Verify that no other properties or methods are present on the `Context` class.

*   **Verification of Supporting Interfaces and Store:**
    *   Verify that `BackendUI` and `CharacterUI` interfaces are defined as specified.
    *   Verify that `PluginsState` interface contains `backendUIs` and `characterUIs` properties.
    *   Verify that `usePluginsStateStore` is initialized with `backendUIs` and `characterUIs` arrays.

*   **Type-Checking Success:**
    *   Execute `npx tsc --noEmit`.
    *   Verify that the TypeScript compilation completes with no errors related to `app/plugins.ts`.

*   **Scenario: Functional Correctness (No Regression)**
    *   **Given:** The application has been built successfully after completing `US_P1_S1_1` and `US_P1_S1_2`.
    *   **When:** The application is launched and plugin functionalities are exercised.
    *   **Then:** All functionalities (e.g., plugin settings, backend calls, UI updates) work as expected without regressions, confirming that the removal of redundant `Context` properties/methods had no adverse impact.

**Testing:**
*   Type-check (`npx tsc --noEmit`).
*   Run `npm run build`.
*   Manually verify application startup and plugin functionalities.

### Status

**Status:** Pending
