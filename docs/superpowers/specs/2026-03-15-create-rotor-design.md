# create-rotor Design Spec

## Overview

`create-rotor` is an npm-published CLI scaffolding tool for bootstrapping new Next.js projects with a curated, opinionated tech stack. Run via `bunx create-rotor` or `bun create rotor`.

## Core Stack (Always Included)

- **Runtime/PM**: Bun
- **Framework**: Next.js (App Router) + React + TypeScript (strict)
- **Styling**: Tailwind CSS v4
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

Note: shadcn/ui should use base UI if supported (to be verified during implementation).

## CLI Interaction Flow

Tool: `@clack/prompts` for terminal UI. `fs-extra` for file operations.

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

## Implementation Approach

**Template copy + trim** (not code generation).

The CLI package embeds a complete template directory containing all optional modules. On project creation:

1. Copy entire template to target directory
2. Based on user selections, remove unneeded files
3. Trim `package.json` dependencies for unselected modules
4. Remove unselected environment variables from `.env.example`
5. Clean up any orphaned imports

## Generated Project Structure

```
my-app/
  app/
    api/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/               # (if shadcn/ui selected)
  lib/
    utils.ts
    db.ts             # (if Drizzle selected)
    ai.ts             # (if AI SDK selected)
  biome.json
  tailwind.config.ts
  tsconfig.json
  next.config.ts
  package.json
  drizzle.config.ts   # (if Drizzle selected)
  .husky/
    pre-commit
  .lintstagedrc
  .env.example
  .gitignore
```

## CLI Package Structure (create-rotor itself)

```
Rotor/
  package.json          # name: "create-rotor", bin entry
  tsconfig.json
  src/
    index.ts            # CLI entry, interaction logic
    helpers.ts          # File copy, trim, dependency handling
  template/             # Full template with all optional modules
    ...
```

## Configuration Details

**TypeScript**: Strict mode, `@/*` path alias, `bundler` module resolution.

**Biome**: 2-space indent, single quotes, semicolons, trailing commas.

**Husky**: `.husky/pre-commit` runs `bunx lint-staged`. lint-staged config runs `biome check` on staged files.

## Dependency Versioning

All dependency versions are pinned in the template's `package.json`. Updated manually/periodically — no dynamic version resolution at creation time.

## Publishing

- npm package name: `create-rotor`
- Build: `bun build src/index.ts` → single-file executable
- `bin` field in `package.json` points to compiled output
- Usage: `bunx create-rotor` / `bun create rotor`
