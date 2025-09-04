import type React from "react";
import type * as Immer from "immer";
import type * as RadixThemes from "@radix-ui/themes";
import type * as ReactIconsGi from "react-icons/gi";
import type { useShallow as UseShallow } from "zustand/shallow";
import type * as RpgDiceRoller from "@dice-roller/rpg-dice-roller";

/**
 * @interface IAppLibs
 * @description Defines the interface for encapsulating core application library instances.
 */
export interface IAppLibs {
  react: typeof React;
  immer: typeof Immer;
  radixThemes: typeof RadixThemes;
  reactIconsGi: typeof ReactIconsGi;
  useShallow: typeof UseShallow;
  rpgDiceRoller: typeof RpgDiceRoller;
}

/**
 * @class AppLibs
 * @description Concrete implementation of IAppLibs, providing centralized access to core application library instances.
 */
export class AppLibs implements IAppLibs {
  constructor(
    public react: typeof React,
    public immer: typeof Immer,
    public radixThemes: typeof RadixThemes,
    public reactIconsGi: typeof ReactIconsGi,
    public useShallow: typeof UseShallow,
    public rpgDiceRoller: typeof RpgDiceRoller,
  ) {}
}
