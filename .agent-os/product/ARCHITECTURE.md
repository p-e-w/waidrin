# Architecture

## Overview

This is a Next.js application that uses a plugin-based architecture to create a roleplaying game. The application is designed to be easily extensible with new rules and mechanics.

## Components

### Frontend

The frontend is built with React, Next.js, and TypeScript. It uses Radix UI for UI components and Tailwind CSS for styling. The application state is managed with Zustand.

The frontend is divided into two main parts:

*   **Views**: These are the main screens of the application, such as the character selection screen, the scenario setup screen, and the chat screen.
*   **Components**: These are reusable UI elements that are used throughout the application.

### Backend

The backend is a Next.js application that provides an API for the frontend. The backend is responsible for:

*   Loading and managing plugins.
*   Handling game logic.
*   Communicating with the OpenAI API.

### Plugins

The application uses a plugin-based architecture to allow for easy extension of the game's rules and mechanics. Plugins are located in the `plugins` directory. Each plugin is a directory that contains a `manifest.json` file and a main script file.

The `manifest.json` file contains metadata about the plugin, such as its name, version, and settings. The main script file contains the plugin's logic.

## Data Flow

The application uses a unidirectional data flow. The user interacts with the UI, which dispatches actions to the Zustand store. The store updates the application state, which causes the UI to re-render.

When the user sends a message in the chat, the message is sent to the backend. The backend processes the message and sends it to the OpenAI API. The OpenAI API returns a response, which is sent back to the frontend and displayed in the chat.