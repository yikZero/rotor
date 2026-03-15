# create-rotor

Scaffold Next.js projects with Bun, Tailwind CSS, Biome, and more.

## Quick Start

```bash
bunx create-rotor my-app
```

Or with npx:

```bash
npx create-rotor my-app
```

The CLI will guide you through selecting optional features, installing dependencies, and initializing a git repository.

## What's Included

Every generated project comes with:

- [Next.js](https://nextjs.org) with Turbopack
- [Tailwind CSS](https://tailwindcss.com) v4
- [Biome](https://biomejs.dev) for linting, formatting, and import sorting
- [Geist](https://vercel.com/font) font family
- [Husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged) for pre-commit checks
- TypeScript

## Optional Features

| Feature | Description |
|---|---|
| **shadcn/ui** | UI component library built on Base UI |
| **SWR** | Data fetching and caching |
| **Drizzle + Supabase** | Database ORM with PostgreSQL |
| **Vercel AI SDK** | AI integration with OpenAI |

## Biome Configuration

Generated projects include a strict Biome setup beyond the recommended defaults:

- **Code quality** — `noUnusedImports`, `noExplicitAny`, `noNonNullAssertion`, `noBarrelFile`
- **Style** — `useImportType`, `useConsistentArrayType`, `useForOf`, `useFilenamingConvention` (kebab-case)
- **Tailwind** — `useSortedClasses` with `cn`/`clsx`/`cva` support
- **Assist** — Auto import sorting via `organizeImports`

## Options

```
Usage: create-rotor [project-name]

Options:
  -v, --version  Show version
  -h, --help     Show help
```

## License

MIT
