## Strategic Plan: Documenting Waidrin Application and Plugin Flow

### 1. Understanding the Goal

The primary goal is to create a comprehensive documentation of the Waidrin application's internal workings. This documentation will detail:
*   How the core application functions.
*   How the core application discovers, loads, and interacts with plugins.
*   The mechanisms by which plugins utilize core application services (e.g., backend communication, state management, UI injection) and core application exports (e.g., shared libraries).

The aim is to provide a clear, end-to-end understanding of the system's architecture, data flow, and the integration points for extensibility via plugins.

### 2. Investigation & Analysis (Summary of Findings)

My investigation involved reading key documentation, configuration, and source code files, and performing targeted searches.

**A. Files Read and Key Insights:**

*   **`README.md`**: Provided a high-level overview of Waidrin as an LLM-powered RPG engine, its core features, and basic setup/running instructions.
*   **`.Requirements/Current State/Application Design Spec.md`**: This was a highly valuable resource. It detailed the core application architecture (`lib`, `app`, `components`, `views` directories), the central role of `app/page.tsx` as an orchestrator, and a comprehensive overview of the plugin framework (discovery, loading, initialization, `Context` provision, state management, UI injection, backend integration). It also introduced the `Plugin` and `IGameRuleLogic` interfaces.
*   **`.Requirements/Current State/Plugin development guide.md`**: Offered practical guidance on plugin setup, structure, and addressed the "two Reacts" problem by detailing the direct library injection via `Context` (though my code analysis revealed a slight deviation in implementation). It also explained `manifest.json` and the `init` method signature.
*   **`.Requirements/Current State/Plugin best practice guide.md`**: Reinforced the "two Reacts" problem and other common pitfalls, emphasizing the "single source of truth for shared libraries" principle and the importance of direct library injection.
*   **`package.json`**: Listed project dependencies, indicating the core libraries used (e.g., `react`, `zustand`, `immer`, `@radix-ui/themes`, `lodash`, `@dice-roller/rpg-dice-roller`, `zod`).
*   **`next.config.ts`**: Showed a minimal Next.js configuration, implying no complex custom Webpack or build-time behaviors beyond defaults.
*   **`app/layout.tsx`**: Defined the root HTML structure, global styles, and Radix UI theme for the application.
*   **`app/page.tsx`**: Confirmed its role as the central orchestrator.
    *   It initializes granular services (`AppLibs`, `AppBackend`, `AppStateManager`, `AppUI`).
    *   It dynamically loads plugins by fetching manifests from `/plugins` API route.
    *   It calls `plugin.init`, passing `manifest.settings` (or existing settings if loaded from state), and a `Context` object.
    *   **Crucially, the `Context` object is instantiated with `manifest.name` and then the granular services (`appLibs`, `appBackend`, `appStateManager`, `appUI`) are passed to the `plugin.init` method.** This is a key finding for how plugins access core functionalities.
    *   Handles `plugin.getBackends` to register backends with the application state.
    *   Manages `pluginWrapper` to preserve settings for existing plugins and add new ones to `state.plugins`.
    *   It renders views based on the global state and orchestrates game progression via `lib/engine.ts`.
    *   **Injected Libraries:** It explicitly imports and passes `Immer`, `RadixThemes`, `ReactIconsGi`, `useShallow`, and `rpgDiceRoller` to `AppLibs` constructor, which then makes them available to plugins via `Context`.
*   **`app/plugins.ts`**: Defined the `Context` class and `usePluginsStateStore` Zustand store.
    *   `Context` provides methods like `saveSettings`, `addCharacterUI`, and `addBackendUI` for plugins to interact with the main app's UI and state.
    *   `usePluginsStateStore` manages UI components injected by plugins.
    *   **Crucial Discrepancy Clarified**: The `Context` class definition in this file does *not* reflect the direct injection of shared libraries (like `react`, `immer`) as properties. Instead, `app/page.tsx` passes *granular service instances* (`AppLibs`, etc.) to `plugin.init`, and these services then encapsulate access to shared libraries and global state.
*   **`lib/engine.ts`**: The core game engine, orchestrating the game flow and interacting with the backend and plugins.
    *   `next()` function: The main game loop. It handles state transitions between different views (welcome, connection, genre, character, scenario, chat). It uses `getBackend()` to communicate with the AI model for generating world, protagonist, characters, locations, and narration. It uses `getState().setAsync()` for asynchronous state updates, leveraging `immer` for immutable state management. It calls `onLocationChange()` to notify plugins when the location changes. It calls `narrate()` to generate narration, which now heavily relies on `getActiveGameRuleLogic()`.
    *   `getActiveGameRuleLogic()`: This function is crucial for plugin integration. It iterates through `state.plugins` to find an enabled plugin with `selectedPlugin` set to `true` and a `getGameRuleLogic()` method. If found, it uses the plugin's `IGameRuleLogic` implementation. Otherwise, it falls back to `getDefaultGameRuleLogic()`.
    *   `IGameRuleLogic` Interface: This interface defines methods that game rule plugins can implement to customize core game mechanics, including: `getBiographyGuidance()`, `modifyProtagonistPrompt()`, `getAvailableRaces()`, `getAvailableClasses()`, `getActionChecks()`, `resolveCheck()`, `handleConsequence()`, `getActions()`, `getNarrativeGuidance()`.
    *   `onLocationChange()`: This function iterates through enabled plugins and calls their `onLocationChange` method, passing the new location and the current state draft. This is a key plugin lifecycle hook.
    *   `narrate()` function: This function generates narration. It now uses `getActiveGameRuleLogic()` to get `getActionChecks()`, `resolveCheck()`, and `getNarrativeGuidance()`, demonstrating how game rule plugins influence the narrative.
*   **`lib/state.ts`**: Defined the core application state, the `Plugin` interface, and the `PluginWrapper` interface, along with the `IGameRuleLogic` interface.
    *   `initialState`: Defines the default values for the entire application state.
    *   `Plugin` Interface: This interface defines the methods that a plugin's main module must implement. `init(settings: Record<string, unknown>, context: Context, appLibs: IAppLibs, appBackend: IAppBackend, appStateManager: IAppStateManager, appUI: IAppUI): Promise<void>;`: This confirms that the `init` method now receives the `Context` object *and* the granular service instances (`appLibs`, `appBackend`, `appStateManager`, `appUI`) as separate arguments. `getBackends(): Promise<Record<string, Backend>>`: Allows plugins to provide custom backend implementations. `onLocationChange(newLocation: Location, state: WritableDraft<State>): Promise<void>`: A lifecycle hook for plugins to react to location changes. `getGameRuleLogic?(): IGameRuleLogic`: Allows plugins to provide their game rule logic.
    *   `PluginWrapper` Interface: This interface describes how plugins are stored in the application state, including their `name`, `enabled` status, `settings`, and the `plugin` instance itself. The `selectedPlugin` property is also present, which is used by `getActiveGameRuleLogic` in `lib/engine.ts`.
    *   `useStateStore`: This is the main Zustand store for the application. It uses `immer` for immutable state updates and `persist` for state persistence. The `partialize` function ensures that only necessary data (like plugin settings) is persisted, not the plugin instances themselves. `setAsync` is an asynchronous state setter that uses a mutex to ensure exclusive access during updates, preventing race conditions.
*   **`lib/schemas.ts`**: Defined all the Zod schemas used throughout the application for data validation. It defines the schemas for core entities like `World`, `Character`, `Location`, `Event` (including `ActionEvent`, `NarrationEvent`, `CharacterIntroductionEvent`, `LocationChangeEvent`), and the overall `State`. These schemas are used to validate data at various points in the application, ensuring data consistency and type safety, especially when interacting with the LLM and when plugins provide or consume data.
*   **`plugins/game-rule-dnd5e/src/main.tsx`**: An excellent example of a game rule plugin and clarifies many aspects of plugin interaction.
    *   Plugin Class (`DndStatsPlugin`): It implements both the `Plugin` interface and the `IGameRuleLogic` interface, meaning it acts as both a general plugin and a game rule provider.
    *   `init` Method: It receives `settings`, `context` (the `Context` object), and the granular service instances (`appLibs`, `appBackend`, `appStateManager`, `appUI`). It parses and validates its settings using `DnDStatsSchema`. **Crucially, it assigns `appLibs.react` to the module-level `React` variable (`React = appLibs.react;`). This is the solution to the "two Reacts" problem, ensuring the plugin uses the main application's React instance.** It registers a character UI component (`DndStatsCharacterUIPage`) using `this.context.addCharacterUI()`. The `onSave` callback for the UI component uses `this.appStateManager!.savePluginSettings()` to persist changes to the plugin's settings.
    *   `DndStatsCharacterUIPage` Component: It receives injected libraries (`injectedReact`, `injectedRadixThemes`, `injectedUseShallow`, `injectedRpgDiceRoller`) as props, demonstrating how the plugin's UI components consume these shared instances. It uses `getGlobalState()` from `appStateManager` to read the plugin's settings from the global state.
    *   `getGameRuleLogic()`: This method simply returns `this`, indicating that the `DndStatsPlugin` itself implements the `IGameRuleLogic` interface.
    *   `IGameRuleLogic` Implementations: `getBiographyGuidance()`, `modifyProtagonistPrompt()`, `getActionChecks()`, `resolveCheck()`, `getNarrativeGuidance()`, `handleConsequence()`, `getActions()`. These methods demonstrate how game rule plugins influence the narrative, manage their own internal state, and interact with the LLM via `appBackend`.
*   **`plugins/game-rule-dnd5e/manifest.json`**: Defined the plugin's metadata (`name`, `main`) and initial default `settings`.

**B. Critical Questions Answered:**

*   **Main application flow:** `app/page.tsx` orchestrates views, state hydration, and plugin loading. `lib/engine.ts` drives the game loop, interacting with the backend and plugins.
*   **Plugin discovery, loading, and initialization:** `app/page.tsx` fetches manifests from `/plugins` API, dynamically imports plugin modules, and calls their `init` method, passing `Context` and granular service instances.
*   **Interfaces exposed by core to plugins:** The `Plugin` interface (in `lib/state.ts`) defines the methods plugins must implement. The `Context` object (from `app/plugins.ts`) provides UI injection and settings saving. Granular services (`AppLibs`, `AppBackend`, `AppStateManager`, `AppUI`) provide access to shared libraries, backend communication, state management, and UI interactions.
*   **Plugin interaction with core state:** Plugins receive `appStateManager` in `init`, which provides `getGlobalState` and `savePluginSettings` (which uses `setAsync`). They can also directly modify `WritableDraft<State>` passed in lifecycle methods like `onLocationChange`.
*   **Plugin logic provision:** Game rule plugins implement `IGameRuleLogic` (in `lib/state.ts`), which is then used by `lib/engine.ts` to customize game mechanics.
*   **Types of plugins and integration points:** Currently, game rule plugins (implementing `IGameRuleLogic`) and UI-injecting plugins (using `Context.addCharacterUI`/`addBackendUI`) are evident.
*   **Service API availability and usage:** `AppLibs`, `AppBackend`, `AppStateManager`, `AppUI` instances are passed directly to `plugin.init`, allowing plugins to call their methods for various functionalities.
*   **Data flow:** Data flows between core and plugins via state objects, method arguments, and return values, with Zod schemas (`lib/schemas.ts`) ensuring validation.

### 3. Proposed Strategic Approach

The documentation will be structured logically, building from the core application to plugin integration and detailed interactions.

**Phase 1: Core Application Overview**
*   **Objective:** Provide a high-level understanding of the Waidrin application's architecture and main flow.
*   **Content:**
    *   **Application Entry Point:** Describe `app/layout.tsx` and `app/page.tsx` as the Next.js entry points and their roles in setting up the app and orchestrating views.
    *   **Core Game Engine (`lib/engine.ts`):** Explain the `next()` function as the main game loop, its state transitions, and interaction with the LLM backend.
    *   **Global State Management (`lib/state.ts`):** Detail the `useStateStore` (Zustand, Immer, Persist) and the `State` schema (`lib/schemas.ts`).
    *   **Backend Communication (`lib/backend.ts`):** Briefly explain how the application communicates with the LLM.
    *   **UI Components (`components`, `views`):** Describe their role in rendering the application.

**Phase 2: Plugin Framework Deep Dive**
*   **Objective:** Detail how plugins are discovered, loaded, initialized, and managed within the application.
*   **Content:**
    *   **Plugin Discovery:** Explain the `/plugins` API route and how `app/page.tsx` fetches `manifest.json` files.
    *   **Plugin Loading:** Describe the dynamic `import()` mechanism in `app/page.tsx` and the instantiation of plugin classes.
    *   **Plugin Lifecycle (`Plugin` interface):** Document the `init`, `onLocationChange`, `getBackends`, and `getGameRuleLogic` methods, explaining their purpose and when they are called.
    *   **Plugin Configuration (`manifest.json`):** Explain the `name`, `main`, and `settings` fields.
    *   **Plugin State Management (`PluginWrapper`):** Detail how plugins are stored in `state.plugins`, including `enabled` and `selectedPlugin`, and how their settings are persisted.

**Phase 3: Plugin Interaction with Core Services and Exports**
*   **Objective:** Explain the primary mechanisms for plugins to interact with the core application.
*   **Content:**
    *   **The `Context` Object (`app/plugins.ts`):**
        *   Explain its role as a controlled interface.
        *   Document its methods: `saveSettings`, `addCharacterUI`, `addBackendUI`.
        *   Clarify that while the `Context` object itself doesn't directly hold shared libraries, it's passed alongside granular services.
    *   **Granular Services Injection (The Real "Context"):**
        *   Detail how `AppLibs`, `AppBackend`, `AppStateManager`, and `AppUI` instances are created in `app/page.tsx` and passed to `plugin.init`.
        *   For each service:
            *   **`AppLibs`**: Explain its role in providing access to shared libraries (`react`, `immer`, `radixThemes`, `reactIconsGi`, `useShallow`, `rpgDiceRoller`). Emphasize this is the solution to the "two Reacts" problem.
            *   **`AppBackend`**: Describe how plugins use it for LLM communication (e.g., `getNarration`, `getObject`).
            *   **`AppStateManager`**: Explain how plugins use it for global state access (`getGlobalState`) and saving plugin-specific settings (`savePluginSettings`).
            *   **`AppUI`**: Detail how plugins use it for UI feedback (e.g., `updateProgress`, `showError`).
    *   **Direct State Modification:** Explain how plugins can directly modify the `WritableDraft<State>` object passed in lifecycle methods like `onLocationChange`.

**Phase 4: Game Rule Plugin Specifics**
*   **Objective:** Focus on the `IGameRuleLogic` interface and how game rule plugins inject their logic.
*   **Content:**
    *   **`IGameRuleLogic` Interface (`lib/state.ts`):** Document each method (`getBiographyGuidance`, `modifyProtagonistPrompt`, `getActionChecks`, `resolveCheck`, `handleConsequence`, `getActions`, `getNarrativeGuidance`), explaining its purpose and how `lib/engine.ts` utilizes it.
    *   **Example (`plugins/game-rule-dnd5e/src/main.tsx`):** Use the D&D 5e plugin as a concrete example to illustrate the implementation of `IGameRuleLogic` methods and their impact on game flow.

**Phase 5: Data Flow and Validation**
*   **Objective:** Illustrate how data moves through the system and is validated.
*   **Content:**
    *   **Key Data Structures:** Reference the Zod schemas in `lib/schemas.ts` for `State`, `Character`, `Location`, `Event`, etc.
    *   **Data Flow Diagrams (Conceptual):** Consider high-level diagrams showing data flow between `app/page.tsx`, `lib/engine.ts`, `lib/state.ts`, plugins, and the LLM.
    *   **Validation Points:** Explain where Zod validation occurs (e.g., `lib/engine.ts` before LLM calls, `lib/state.ts` for initial state).

**Phase 6: Documentation Generation and Refinement**
*   **Objective:** Produce a clear, comprehensive, and well-structured markdown document.
*   **Content:**
    *   Use clear headings, subheadings, bullet points, and code examples.
    *   Incorporate diagrams where beneficial (e.g., application flow, plugin interaction).
    *   Ensure consistent terminology and style.

### 4. Verification Strategy

*   **Peer Review:** The generated documentation will be reviewed by at least two developers familiar with the Waidrin codebase to ensure accuracy, completeness, and clarity.
*   **Code-Documentation Alignment:** Each described interaction, API call, and data flow will be cross-referenced with the actual source code to verify its correctness.
*   **New Developer Onboarding Test:** The documentation will be used as the primary resource for a new developer to understand the system. Feedback on clarity, missing information, and ease of understanding will be actively sought.
*   **Functional Verification:** After the documentation is complete, a quick review of the application's functionality (especially plugin-related features) will be performed to ensure no misunderstandings in the documentation lead to incorrect assumptions about behavior.
*   **Completeness Checklist:** A checklist derived from the "Understanding the Goal" and "Investigation & Analysis" sections will be used to ensure all required aspects are covered.

### 5. Anticipated Challenges & Considerations

*   **Maintaining Currency:** The most significant challenge will be keeping the documentation updated as the codebase evolves. A process for regular review and updates will be essential.
*   **Granularity of Detail:** Balancing sufficient detail for understanding without overwhelming the reader will be crucial. Diagrams and high-level overviews will help manage complexity.
*   **Implicit Interactions:** Some interactions, especially those involving shared state or side effects, might be less explicit in the code and require careful inference and clear explanation.
*   **LLM Integration Nuances:** Documenting the specifics of LLM interaction, including prompt engineering and response parsing, can be complex and may require ongoing refinement as LLM capabilities evolve.
*   **"Two Reacts" Solution Clarity:** While the solution is implemented, clearly explaining *why* it's necessary and *how* it works (via granular service injection) is vital for future developers.
*   **Tooling Limitations:** My current tools are for investigation, not direct documentation generation. The actual writing of the markdown document will require human effort to synthesize the gathered information effectively.
