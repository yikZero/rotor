# {{PROJECT_NAME}}

## Commands

```bash
bun dev       # Start dev server with Turbopack
bun build     # Production build
bun start     # Start production server
bun run check # Lint and format with Biome
```

## Architecture

Next.js App Router project.

- **Styling**: Tailwind CSS v4 — CSS-first config in `app/globals.css`, no `tailwind.config`
- **Code quality**: Biome (lint + format)
- **Path alias**: `@/*` maps to project root

## Key Directories

- `app/` — Routes, layouts, pages, API routes
- `lib/` — Utilities, database client, shared logic
- `components/` — React components
