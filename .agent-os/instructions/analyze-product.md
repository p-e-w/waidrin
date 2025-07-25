---
description: Analyze Current Product & Install Agent OS
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Analyze Current Product & Install Agent OS

<ai_meta>
  <parsing_rules>
    - Process XML blocks first for structured data
    - Execute instructions in sequential order
    - Use templates as exact patterns
    - Analyze existing code before generating documentation
  </parsing_rules>
  <file_conventions>
    - encoding: UTF-8
    - line_endings: LF
    - indent: 2 spaces
    - markdown_headers: no indentation
  </file_conventions>
</ai_meta>

## Overview

<purpose>
  - Install Agent OS into an existing codebase
  - Analyze current product state and progress
  - Generate documentation that reflects actual implementation
  - Preserve existing architectural decisions
</purpose>

<context>
  - Part of Agent OS framework
  - Used when retrofitting Agent OS to established products
  - Builds on plan-product.md with codebase analysis
</context>

<prerequisites>
  - Existing product codebase
  - Write access to project root
  - Access to @~/.agent-os/instructions/plan-product.md
</prerequisites>

<process_flow>

<step number="1" name="analyze_existing_codebase">

### Step 1: Analyze Existing Codebase

<step_metadata>
  <action>deep codebase analysis</action>
  <purpose>understand current state before documentation</purpose>
</step_metadata>

<analysis_areas>
  <project_structure>
    - Directory organization
    - File naming patterns
    - Module structure
    - Build configuration
  </project_structure>
  <technology_stack>
    - Frameworks in use
    - Dependencies (package.json, Gemfile, requirements.txt, etc.)
    - Database systems
    - Infrastructure configuration
  </technology_stack>
  <implementation_progress>
    - Completed features
    - Work in progress
    - Authentication/authorization state
    - API endpoints
    - Database schema
  </implementation_progress>
  <code_patterns>
    - Coding style in use
    - Naming conventions
    - File organization patterns
    - Testing approach
  </code_patterns>
</analysis_areas>

<instructions>
  ACTION: Thoroughly analyze the existing codebase
  DOCUMENT: Current technologies, features, and patterns
  IDENTIFY: Architectural decisions already made
  NOTE: Development progress and completed work
</instructions>

</step>

<step number="2" name="gather_product_context">

### Step 2: Gather Product Context

<step_metadata>
  <supplements>codebase analysis</supplements>
  <gathers>business context and future plans</gathers>
</step_metadata>

<context_questions>
  Based on my analysis of your codebase, I can see you're building [OBSERVED_PRODUCT_TYPE].

  To properly set up Agent OS, I need to understand:

  1. **Product Vision**: What problem does this solve? Who are the target users?

  2. **Current State**: Are there features I should know about that aren't obvious from the code?

  3. **Roadmap**: What features are planned next? Any major refactoring planned?

  4. **Decisions**: Are there important technical or product decisions I should document?

  5. **Team Preferences**: Any coding standards or practices the team follows that I should capture?
</context_questions>

<instructions>
  ACTION: Ask user for product context
  COMBINE: Merge user input with codebase analysis
  PREPARE: Information for plan-product.md execution
</instructions>

</step>

<step number="3" name="execute_plan_product">

### Step 3: Execute Plan-Product with Context

<step_metadata>
  <uses>@~/.agent-os/instructions/plan-product.md</uses>
  <modifies>standard flow for existing products</modifies>
</step_metadata>

<execution_parameters>
  <main_idea>[DERIVED_FROM_ANALYSIS_AND_USER_INPUT]</main_idea>
  <key_features>[IDENTIFIED_IMPLEMENTED_AND_PLANNED_FEATURES]</key_features>
  <target_users>[FROM_USER_CONTEXT]</target_users>
  <tech_stack>[DETECTED_FROM_CODEBASE]</tech_stack>
</execution_parameters>

<execution_prompt>
  @~/.agent-os/instructions/plan-product.md

  I'm installing Agent OS into an existing product. Here's what I've gathered:

  **Main Idea**: [SUMMARY_FROM_ANALYSIS_AND_CONTEXT]

  **Key Features**:
  - Already Implemented: [LIST_FROM_ANALYSIS]
  - Planned: [LIST_FROM_USER]

  **Target Users**: [FROM_USER_RESPONSE]

  **Tech Stack**: [DETECTED_STACK_WITH_VERSIONS]
</execution_prompt>

<instructions>
  ACTION: Execute plan-product.md with gathered information
  PROVIDE: All context as structured input
  ALLOW: plan-product.md to create .agent-os/product/ structure
</instructions>

</step>

<step number="4" name="customize_generated_files">

### Step 4: Customize Generated Documentation

<step_metadata>
  <refines>generated documentation</refines>
  <ensures>accuracy for existing product</ensures>
</step_metadata>

<customization_tasks>
  <roadmap_adjustment>
    - Mark completed features as done
    - Move implemented items to "Phase 0: Already Completed"
    - Adjust future phases based on actual progress
  </roadmap_adjustment>
  <tech_stack_verification>
    - Verify detected versions are correct
    - Add any missing infrastructure details
    - Document actual deployment setup
  </tech_stack_verification>
  <decisions_documentation>
    - Add historical decisions that shaped current architecture
    - Document why certain technologies were chosen
    - Capture any pivots or major changes
  </decisions_documentation>
</customization_tasks>

<roadmap_template>
  ## Phase 0: Already Completed

  The following features have been implemented:

  - [x] [FEATURE_1] - [DESCRIPTION_FROM_CODE]
  - [x] [FEATURE_2] - [DESCRIPTION_FROM_CODE]
  - [x] [FEATURE_3] - [DESCRIPTION_FROM_CODE]

  ## Phase 1: Current Development

  - [ ] [IN_PROGRESS_FEATURE] - [DESCRIPTION]

  [CONTINUE_WITH_STANDARD_PHASES]
</roadmap_template>

<instructions>
  ACTION: Update generated files to reflect reality
  MODIFY: Roadmap to show completed work
  VERIFY: Tech stack matches actual implementation
  ADD: Historical context to decisions.md
</instructions>

</step>

<step number="5" name="final_verification">

### Step 5: Final Verification and Summary

<step_metadata>
  <verifies>installation completeness</verifies>
  <provides>next steps for user</provides>
</step_metadata>

<verification_checklist>
  - [ ] .agent-os/product/ directory created
  - [ ] All product documentation reflects actual codebase
  - [ ] Roadmap shows completed and planned features accurately
  - [ ] Tech stack matches installed dependencies
  - [ ] CLAUDE.md or .cursorrules configured (if applicable)
</verification_checklist>

<summary_template>
  ## ✅ Agent OS Successfully Installed

  I've analyzed your [PRODUCT_TYPE] codebase and set up Agent OS with documentation that reflects your actual implementation.

  ### What I Found

  - **Tech Stack**: [SUMMARY_OF_DETECTED_STACK]
  - **Completed Features**: [COUNT] features already implemented
  - **Code Style**: [DETECTED_PATTERNS]
  - **Current Phase**: [IDENTIFIED_DEVELOPMENT_STAGE]

  ### What Was Created

  - ✓ Product documentation in `.agent-os/product/`
  - ✓ Roadmap with completed work in Phase 0
  - ✓ Tech stack reflecting actual dependencies

  ### Next Steps

  1. Review the generated documentation in `.agent-os/product/`
  2. Make any necessary adjustments to reflect your vision
  3. See the Agent OS README for usage instructions: https://github.com/buildermethods/agent-os
  4. Start using Agent OS for your next feature:
     ```
     @~/.agent-os/instructions/create-spec.md
     ```

  Your codebase is now Agent OS-enabled! 🚀
</summary_template>

<instructions>
  ACTION: Verify all files created correctly
  SUMMARIZE: What was found and created
  PROVIDE: Clear next steps for user
</instructions>

</step>

</process_flow>

## Error Handling

<error_scenarios>
  <scenario name="no_clear_structure">
    <condition>Cannot determine project type or structure</condition>
    <action>Ask user for clarification about project</action>
  </scenario>
  <scenario name="conflicting_patterns">
    <condition>Multiple coding styles detected</condition>
    <action>Ask user which pattern to document</action>
  </scenario>
  <scenario name="missing_dependencies">
    <condition>Cannot determine full tech stack</condition>
    <action>List detected technologies and ask for missing pieces</action>
  </scenario>
</error_scenarios>

## Execution Summary

<final_checklist>
  <verify>
    - [ ] Codebase analyzed thoroughly
    - [ ] User context gathered
    - [ ] plan-product.md executed with proper context
    - [ ] Documentation customized for existing product
    - [ ] Team can adopt Agent OS workflow
  </verify>
</final_checklist>
