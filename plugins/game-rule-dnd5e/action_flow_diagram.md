```mermaid
graph TD
    subgraph Application Initialization
        A["App Start
app/page.tsx"] --> B{State Hydrated?}
        B -- Yes --> C["loadPlugins()
app/page.tsx"]
        C --> D["Fetch Manifests
/plugins API"]
        D --> E["Dynamic Import Plugin Code
/plugins/[...path] API"]
        E --> F["Instantiate Plugin
(e.g., DndStatsPlugin)"]
        F --> G["plugin.init(settings, context)"]
        G --> H["Context Injects Shared Libs
(React, Zustand access, etc.)"]
        H --> I["DndStatsPlugin.init()
plugins/game-rule-dnd5e/src/main.tsx"]
        I --> J["Register Character UI
context.addCharacterUI()"]
    end

    subgraph Character Selection & Game Rule Activation
        K["CharacterSelect View
views/CharacterSelect.tsx"] --> L{User Selects Game Rule}
        L -- Tab Change --> M["Update activeGameRule
useStateStore"]
        L -- Plugin Toggle --> N["Update selectedPlugin
context.setPluginSelected()"]
    end

    subgraph Game Engine Core Loop
        O["next() Function Call
lib/engine.ts"] --> P["getState().setAsync(updater)"]
        P --> Q["getActiveGameRuleLogic()
lib/engine.ts"]
        Q -- Priority 1: selectedPlugin --> R["Plugin's IGameRuleLogic
(e.g., DndStatsPlugin)"]
        Q -- Priority 2: activeGameRule --> R
        Q -- Fallback: Default --> S["Default IGameRuleLogic"]

        R --> T{Game Phase?}

        subgraph Protagonist Generation
            T -- Protagonist Gen --> U["gameRuleLogic.getInitialProtagonistStats()"]
            U --> V["gameRuleLogic.modifyProtagonistPrompt(originalPrompt)"]
            V --> W["backend.getObject(protagonistPrompt)"]
        end

        subgraph Action Resolution & Narration
            T -- Action/Narration --> X["User Action (Optional)"]
            X --> Y["narrate(action)
lib/engine.ts"]
            Y --> Z{action & gameRuleLogic.getActionChecks?}
            Z -- Yes --> AA["gameRuleLogic.getActionChecks(action, state)"]
            AA --> BB["LLM Call (getChecksPrompt)"]
            BB --> CC["CheckDefinitions"]
            CC --> DD["For each CheckDefinition"]
            DD --> EE["gameRuleLogic.resolveCheck(check, protagonist)"]
            EE --> FF["CheckResult Statement"]
            FF --> GG["Collect checkResultStatements"]

            GG --> HH{state.isCombat & gameRuleLogic.getCombatRoundNarration?}
            HH -- Yes --> II["gameRuleLogic.getCombatRoundNarration()"]
            HH -- No --> JJ["gameRuleLogic.getNarrationPrompt(eventType, state, checkResultStatements, action)"]
            JJ --> KK["LLM Calls (getConsequenceGuidancePrompt, getDndNarrationGuidance)"]
            KK --> LL["Consolidated Narration Guidance"]

            II --> MM["Narration Prompt Content"]
            LL --> MM
            Z -- No --> NN["Fallback: lib/prompts.ts:narratePrompt"]
            NN --> MM

            MM --> OO["backend.getNarration(narrationPromptContent)"]
            OO --> PP["Narration Displayed to User"]
        end

        subgraph Location Change & New Characters
            T -- Location Change Check --> QQ["getBoolean(checkIfSameLocationPrompt)"]
            QQ -- No --> RR["Generate New Location & Accompanying Chars"]
            RR --> SS["onLocationChange(newLocation)"]
            SS --> TT["Generate New Characters"]
        end

        T -- Action Generation --> UU["backend.getObject(generateActionsPrompt)"]
    end

    subgraph Backend Interaction
        VV["getBackend()
lib/backend.ts"] --> WW["Active Backend Instance"]
        WW --> XX["OpenAI API Calls"]
        WW --> YY["Structured Output (JSON Schema)"]
    end

    A --> K
    K --> O
    O --> P
    P --> VV
