# create-rotor Design Spec

## Overview

`create-rotor` is an npm-published CLI scaffolding tool for bootstrapping new Next.js projects with a curated, opinionated tech stack. Run via `bunx create-rotor` or `bun create rotor`.

## Core Stack (Always Included)

- **Runtime/PM**: Bun
- **Framework**: Next.js (App Router) + React + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme` in `globals.css`, no `tailwind.config.ts`)
- **Lint/Format**: Biome (single tool for both)
- **Git Hooks**: Husky + lint-staged → `biome check --staged`

## Optional Modules

Users select from these via multi-select prompt:

| Module | Files Added | Dependencies |
|---|---|---|
| shadcn/ui | `components/ui/*`, `cn()` in `lib/utils.ts` | `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/*` |
| SWR | (none, dependency only) | `swr` |
| Drizzle + Supabase | `lib/db.ts`, `drizzle.config.ts`, DB vars in `.env.example` | `drizzle-orm`, `drizzle-kit`, `@supabase/supabase-js`, `postgres` |
| Vercel AI SDK | `lib/ai.ts`, AI vars in `.env.example` | `ai`, `@ai-sdk/openai` |

Note: shadcn/ui should use base UI if supported (to be verified during implementation). If base UI changes the dependency list, update accordingly.

## CLI Interaction Flow

Tool: `@clack/prompts` for terminal UI. Uses Bun built-in `fs` APIs (`fs.cpSync` with `recursive: true`) for file operations — no `fs-extra` needed.

```
┌ create-rotor
│
◇ Project name? (my-app)
│
◇ Select optional features: (multi-select)
│  ☐ shadcn/ui — UI component library
│  ☐ SWR — Data fetching
│  ☐ Drizzle + Supabase — Database
│  ☐ Vercel AI SDK — AI integration
│
◇ Initialize git repository? (Y/n)
│
└ Creating project...

✔ Project created at ./my-app

  cd my-app
  bun install
  bun dev
```

Project name can also be passed as CLI argument: `bunx create-rotor my-app`.

Does NOT auto-run `bun install` — user controls this.

## Error Handling

- **Target directory already exists**: Prompt user — overwrite, merge, or pick a new name.
- **Invalid project name**: Validate against npm naming rules (lowercase, no spaces). Re-prompt if invalid.
- **User cancels (Ctrl+C)**: Handle via `@clack/prompts` `isCancel()` — clean up any partially created files and exit gracefully.
- **Non-interactive environment**: Not supported in v1. CLI requires a TTY for interactive prompts.

## Implementation Approach

**Template copy + trim** (not code generation).

The CLI package embeds a complete template directory containing all optional modules. On project creation:

1. Validate project name and target directory
2. Copy entire template to target directory
3. Based on user selections, remove unneeded files
4. Trim `package.json` dependencies for unselected modules
5. Remove unselected environment variables from `.env.example` (using comment markers: `# [module-name]` / `# [/module-name]`)
6. If git init selected: run `git init` + create initial commit with message "init"

**No orphaned import cleanup needed**: Template files are designed to be self-contained. Optional module files (`lib/db.ts`, `lib/ai.ts`, `components/ui/*`) are standalone — no cross-references from core files. When a module is not selected, its files are simply deleted with no dangling imports.

## Generated Project Structure

```
my-app/
  app/
    api/
    layout.tsx
    page.tsx
    globals.css         # Tailwind v4 CSS-first config (@theme directives)
  components/
    ui/                 # (if shadcn/ui selected)
  lib/
    utils.ts
    db.ts               # (if Drizzle selected)
    ai.ts               # (if AI SDK selected)
  biome.json
  tsconfig.json
  next.config.ts
  package.json
  drizzle.config.ts     # (if Drizzle selected)
  .husky/
    pre-commit
  .lintstagedrc
  .env.example
  .gitignore
  README.md
```

## CLI Package Structure (create-rotor itself)

```
Rotor/
  package.json          # name: "create-rotor", bin: "dist/index.js"
  tsconfig.json
  src/
    index.ts            # CLI entry, interaction logic
    helpers.ts          # File copy, trim, dependency handling
  template/             # Full template with all optional modules
    ...
```

## Build & Packaging

- `bun build src/index.ts --outdir dist --target node` → outputs `dist/index.js`
- The `template/` directory is NOT bundled into the JS file — it ships as-is in the npm package
- `package.json` `files` field: `["dist", "template"]`
- `bin` field: `"dist/index.js"`
- At runtime, resolve template path via `import.meta.dir` relative to the package root

## Configuration Details

**TypeScript**: Strict mode, `@/*` path alias, `bundler` module resolution.

**Biome**: 2-space indent, single quotes, semicolons, trailing commas.

**Husky**: `.husky/pre-commit` runs `bunx lint-staged`. lint-staged config runs `biome check` on staged files.

## Dependency Versioning

All dependency versions are pinned in the template's `package.json`. Updated manually/periodically — no dynamic version resolution at creation time.

## Publishing

- npm package name: `create-rotor`
- Build: `bun build src/index.ts --outdir dist --target node`
- `files`: `["dist", "template"]`
- `bin`: `"dist/index.js"`
- Usage: `bunx create-rotor` / `bun create rotor`
