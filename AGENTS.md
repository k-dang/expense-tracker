# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router entrypoints (`layout.tsx`, `page.tsx`) and global styles in `globals.css`.
- `src/components/`: Reusable React components. `src/components/ui/` contains shared UI primitives (shadcn/base-ui style components).
- `src/lib/`: Lightweight utilities (for example `utils.ts`).
- `public/`: Static assets served directly (SVGs, icons).
- Root config: `next.config.ts`, `tsconfig.json`, `biome.json`, `components.json`.

## Build, Test, and Development Commands
- `bun run dev` (or `npm run dev`): Start local dev server at `http://localhost:3000`.
- `bun run build`: Create a production build with Next.js.
- `bun run start`: Serve the production build locally.
- `bun run lint`: Run Biome checks (lint + static checks).
- `bun run format`: Apply Biome formatting changes.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Formatting is enforced by Biome (`biome.json`): 2-space indentation, spaces (no tabs), organized imports.
- Component files in `src/components` use `kebab-case` filenames (for example `alert-dialog.tsx`, `input-group.tsx`).
- Keep utility helpers in `src/lib` and UI primitives in `src/components/ui` to avoid duplication.

## Guidelines
- Always try to use an existing component or utility before creating a new one.
