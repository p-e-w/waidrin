# Development Best Practices

> Version: 1.0.0
> Last updated: 2025-07-22
> Scope: Global development standards

## Context

This file is part of the Agent OS standards system. These global best practices are referenced by all product codebases and provide default development guidelines. Individual projects may extend or override these practices in their `.agent-os/product/dev-best-practices.md` file.

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones
- Use sequential-thinking and use context7 and use websearch to find the proper solution when the same loop of error is happening like this one, also when you encounter "No file changes to" error it means you are working with old context, re-read the file entirely then do the replace, there is no reason for human to do this when you have all the information

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation

## Code Organization

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions

### Plugin system
The plugin interface allows for dynamic extension of the application's functionality, primarily for integrating new backends and their associated user interfaces.
How the Plugin Interface Works:
- Discovery and Loading: Plugins are located in the plugins/ directory. The app/plugins/[...path]/route.ts API endpoint serves the plugin's main JavaScript file, which is then loaded by the application.
- Manifest: Each plugin has a manifest.json file that defines its name, the main entry point (a JavaScript file), and optional settings.
- Initialization: The plugin's main class (exported as default) is instantiated. It can receive a Context object in its constructor, which provides methods to interact with the main application
      (e.g., addBackendUI). The init method is then called with the settings defined in the manifest.json.
- Backend Provision: Plugins can expose one or more backend implementations through their getBackends method, which returns a map of backend names to backend instances.
- UI Integration: Plugins can register UI components (tabs, pages) for their backends using context.addBackendUI, allowing them to extend the application's configuration interface.

Files Required for a New Plugin:
- `manifest.json`:
  * name: A string representing the plugin's name.
  * main: A string specifying the path to the plugin's main JavaScript file (e.g., "dist/main.js").
  * settings: An optional JSON object containing default configuration settings for the plugin.

- Main Plugin File (e.g., `src/index.ts` or `src/main.tsx` which compiles to `dist/main.js`):
  * This file should export a default class.
  * The class constructor can accept a Context object.
  * The class should implement an async init(settings: Record<string, unknown>): Promise<void> method for plugin initialization.
  * The class should implement an async getBackends(): Promise<Record<string, Backend>> method to provide backend instances.

### Testing
- Write tests for new functionality
- Maintain existing test coverage
- Test edge cases and error conditions

---

*Customize this file with your team's specific practices. These guidelines apply to all code written by humans and AI agents.*
