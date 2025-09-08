import type { StoredState, PluginWrapper } from "@/lib/state";
import type { WritableDraft } from "immer";

/**
 * @interface IAppStateManager
 * @description Defines the interface for encapsulating global state and plugin settings management.
 */
export interface IAppStateManager {
  getGlobalState(): StoredState;
  setGlobalState(updater: (state: WritableDraft<StoredState>) => Promise<void>): Promise<void>;
  setPluginSelected(pluginName: string, isSelected: boolean): void;
  savePluginSettings(pluginName: string, settings: Record<string, unknown>): void;
}

/**
 * @class AppStateManager
 * @description Concrete implementation of IAppStateManager, providing centralized management of the application's global state and plugin-specific settings.
 */
export class AppStateManager implements IAppStateManager {
  constructor(
    private getGlobalStateFn: () => StoredState,
    private setGlobalStateFn: (updater: (state: WritableDraft<StoredState>) => Promise<void>) => Promise<void>,
    private useStateStoreSetFn: (
      nextStateOrUpdater: StoredState | Partial<StoredState> | ((state: WritableDraft<StoredState>) => void),
      shouldReplace?: false,
    ) => void,
  ) {}

  getGlobalState = (): StoredState => {
    return this.getGlobalStateFn();
  };

  setGlobalState = async (updater: (state: WritableDraft<StoredState>) => Promise<void>): Promise<void> => {
    return this.setGlobalStateFn(updater);
  };

  setPluginSelected = (pluginName: string, isSelected: boolean): void => {
    this.useStateStoreSetFn((state) => {
      const plugin = state.plugins.find((p: PluginWrapper) => p.name === pluginName);
      if (plugin) {
        plugin.selectedPlugin = isSelected;
      } else {
        throw new Error(`Plugin with name ${pluginName} not found.`);
      }
    });
  };

  savePluginSettings = (pluginName: string, settings: Record<string, unknown>): void => {
    this.useStateStoreSetFn((state) => {
      const plugin = state.plugins.find((p: PluginWrapper) => p.name === pluginName);
      if (plugin) {
        plugin.settings = settings;
      } else {
        throw new Error(`Plugin with name ${pluginName} not found.`);
      }
    });
  };
}
