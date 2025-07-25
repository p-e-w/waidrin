# Decisions

## Technology Stack

The technology stack was chosen to be as close as possible to the original Waidrin app. The original app uses Next.js, React, TypeScript, and Tailwind CSS. This fork uses the same technologies to ensure compatibility and to make it easier to merge changes from the original app.

## Plugin-Based Architecture

The plugin-based architecture was chosen to make it easy to extend the game with new rules and mechanics. This will allow the community to create their own plugins and share them with others.

## Layout Consistency

When a tab's content needs to be structured into multiple vertical columns or requires complex alignment, use the `<Flex>` component from `@radix-ui/themes`. This ensures layout consistency and avoids manual styling (e.g., custom margins) for alignment purposes, as seen in the `ConnectionSetup` and `CharacterSelect` views.