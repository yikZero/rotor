# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`create-rotor` — an npm-published CLI scaffolding tool that generates Next.js projects. Ships a complete template directory and trims it based on user selections.

## Commands

```bash
bun install          # Install dependencies
bun run build        # Bundle src/index.ts → dist/index.js (bun build --target node)
bun run dev          # Run CLI directly from source
bun run check        # Biome lint + format (src/ only)
bun test             # Run all tests (Bun native test runner)
bun test src/__tests__/helpers.test.ts  # Run specific test file
```

To validate template files against their own Biome config: `cd template && bunx @biomejs/biome check .`

## Architecture

**Two distinct codebases in one repo:**

1. **`src/`** — The CLI tool itself (TypeScript, runs in Node/Bun)
   - `index.ts` — Entry point: arg parsing, @clack/prompts interactive flow, orchestrates scaffolding
   - `constants.ts` — Module definitions (MODULES record) mapping each optional feature to its files, deps, and markers
   - `helpers.ts` — Pure functions for template customization: trim deps, remove files, strip env/CSS sections, replace placeholders

2. **`template/`** — A complete Next.js project with ALL optional modules included. The CLI copies this then removes what wasn't selected.

**These are separate concerns.** The CLI's biome/tsconfig do not apply to template files. Template files will have TS errors in-editor because their dependencies aren't installed in this repo — that's expected.

## Module System

Each optional feature (shadcn, swr, drizzle, ai) is defined in `constants.ts` with:
- `files[]` — Template files to delete when module is not selected
- `dependencies` / `devDependencies` — Package.json entries to remove
- `envMarker` — Used in `.env.example` with `# [marker]` / `# [/marker]` comment pairs
- CSS markers in globals.css use `/* [shadcn] */` / `/* [/shadcn] */`

When adding a new optional module: add its definition to MODULES, add its template files, add env markers if needed, and add its deps to `template/package.json`.

## Template Conventions

- `{{PROJECT_NAME}}` placeholder in: package.json, layout.tsx, README.md (NOT in JSX — Biome reformats `{{` in JSX)
- `template/gitignore` (no dot) — npm strips `.gitignore` during publish; the CLI renames it after copy
- Template's `biome.json` is independent from the CLI's — scoped to app/lib/components, with Tailwind directive parsing enabled
- Version is read from `package.json` at runtime (`getVersion()`) — no hardcoded version constant

## Build & Publish

- `bun build` bundles src/ into `dist/index.js`; template/ ships as-is (NOT bundled)
- `package.json` `files` field: `["dist", "template"]`
- Template path resolved at runtime via `import.meta.dirname`
- CI runs on push/PR to master; npm publish triggers automatically on GitHub release (requires `NPM_TOKEN` secret)
