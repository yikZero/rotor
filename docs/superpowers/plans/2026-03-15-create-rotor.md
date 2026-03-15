# create-rotor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `create-rotor`, an npm CLI scaffolding tool that generates Next.js projects with Bun, Tailwind v4, Biome, Husky, and optional shadcn/ui, SWR, Drizzle+Supabase, and AI SDK.

**Architecture:** Template-copy-and-trim approach. A complete template directory (with all optional modules) ships in the npm package. The CLI copies the template, then removes files/dependencies for unselected modules. CLI interaction via `@clack/prompts`.

**Tech Stack:** Bun (build + runtime), TypeScript, @clack/prompts (CLI UI), Node fs APIs (file ops)

**Spec:** `docs/superpowers/specs/2026-03-15-create-rotor-design.md`

---

## File Structure

### CLI Source (`src/`)

| File | Responsibility |
|---|---|
| `src/index.ts` | CLI entry point — parse args, run prompts, orchestrate scaffolding |
| `src/helpers.ts` | Pure functions — copy template, trim deps, remove files, trim env, trim CSS |
| `src/constants.ts` | Module definitions — which files/deps belong to each optional module |
| `src/__tests__/helpers.test.ts` | Unit tests for all helper functions |

### Template (`template/`)

| File | Always / Conditional |
|---|---|
| `template/package.json` | Always (trimmed at creation time) |
| `template/tsconfig.json` | Always |
| `template/next.config.ts` | Always |
| `template/biome.json` | Always |
| `template/.gitignore` | Always |
| `template/.env.example` | Always (trimmed at creation time) |
| `template/.lintstagedrc` | Always |
| `template/.husky/pre-commit` | Always |
| `template/README.md` | Always |
| `template/postcss.config.mjs` | Always (Tailwind v4 PostCSS plugin) |
| `template/app/layout.tsx` | Always |
| `template/app/page.tsx` | Always |
| `template/app/globals.css` | Always (trimmed: shadcn CSS vars removed if not selected) |
| `template/app/api/.gitkeep` | Always (empty API directory) |
| `template/lib/utils.ts` | shadcn/ui only |
| `template/components.json` | shadcn/ui only |
| `template/components/ui/.gitkeep` | shadcn/ui only |
| `template/lib/db.ts` | Drizzle only |
| `template/lib/schema.ts` | Drizzle only |
| `template/drizzle.config.ts` | Drizzle only |
| `template/lib/ai.ts` | AI SDK only |

### Root Config

| File | Responsibility |
|---|---|
| `package.json` | CLI package — name, bin, files, scripts, dependencies |
| `tsconfig.json` | CLI build config |
| `biome.json` | CLI code quality |

---

## Chunk 1: Project Setup & Template Files

### Task 1: Initialize the CLI project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `biome.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "create-rotor",
  "version": "0.1.0",
  "description": "Scaffold Next.js projects with Bun, Tailwind, Biome, and more",
  "type": "module",
  "bin": "dist/index.js",
  "files": ["dist", "template"],
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node",
    "dev": "bun run src/index.ts",
    "check": "bunx @biomejs/biome check --write ."
  },
  "dependencies": {
    "@clack/prompts": "1.1.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.7",
    "@types/node": "25.5.0",
    "typescript": "5.9.3"
  },
  "keywords": ["create", "nextjs", "bun", "tailwind", "scaffold", "template"],
  "license": "MIT"
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": false,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.7/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  },
  "files": {
    "ignore": ["dist", "template"]
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `cd /Users/yikzero/Code/Rotor && bun install`

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json biome.json bun.lock
git commit -m "chore: initialize create-rotor CLI project"
```

---

### Task 2: Create module constants

**Files:**
- Create: `src/constants.ts`

This defines which files and dependencies belong to each optional module. Used by the trimming logic.

- [ ] **Step 1: Create `src/constants.ts`**

```ts
export interface ModuleDefinition {
  name: string;
  label: string;
  hint: string;
  files: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  envMarker: string;
}

export const MODULES: Record<string, ModuleDefinition> = {
  shadcn: {
    name: 'shadcn',
    label: 'shadcn/ui',
    hint: 'UI component library (Base UI)',
    files: ['components.json', 'lib/utils.ts', 'components/ui'],
    dependencies: {
      'class-variance-authority': '0.7.1',
      clsx: '2.1.1',
      'tailwind-merge': '3.5.0',
      'lucide-react': '0.577.0',
    },
    devDependencies: {},
    envMarker: 'shadcn',
  },
  swr: {
    name: 'swr',
    label: 'SWR',
    hint: 'Data fetching',
    files: [],
    dependencies: {
      swr: '2.4.1',
    },
    devDependencies: {},
    envMarker: 'swr',
  },
  drizzle: {
    name: 'drizzle',
    label: 'Drizzle + Supabase',
    hint: 'Database',
    files: ['lib/db.ts', 'lib/schema.ts', 'drizzle.config.ts'],
    dependencies: {
      'drizzle-orm': '0.45.1',
      '@supabase/supabase-js': '2.99.1',
      postgres: '3.4.8',
    },
    devDependencies: {
      'drizzle-kit': '0.31.9',
    },
    envMarker: 'drizzle',
  },
  ai: {
    name: 'ai',
    label: 'Vercel AI SDK',
    hint: 'AI integration',
    files: ['lib/ai.ts'],
    dependencies: {
      ai: '6.0.116',
      '@ai-sdk/openai': '3.0.41',
    },
    devDependencies: {},
    envMarker: 'ai',
  },
};

export const VERSION = '0.1.0';
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add module definitions for optional features"
```

---

### Task 3: Create core template files

**Files:**
- Create: `template/package.json`
- Create: `template/tsconfig.json`
- Create: `template/next.config.ts`
- Create: `template/biome.json`
- Create: `template/postcss.config.mjs`
- Create: `template/.gitignore`
- Create: `template/.lintstagedrc`
- Create: `template/.husky/pre-commit`
- Create: `template/README.md`
- Create: `template/app/api/.gitkeep`

- [ ] **Step 1: Create `template/package.json`**

Contains ALL dependencies (core + all optional). The CLI trims unselected ones at creation time. The `name` field uses a `{{PROJECT_NAME}}` placeholder that the CLI replaces.

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "check": "bunx @biomejs/biome check --write .",
    "prepare": "husky",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.5.0",
    "lucide-react": "0.577.0",
    "swr": "2.4.1",
    "drizzle-orm": "0.45.1",
    "@supabase/supabase-js": "2.99.1",
    "postgres": "3.4.8",
    "ai": "6.0.116",
    "@ai-sdk/openai": "3.0.41"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.7",
    "@tailwindcss/postcss": "4.2.1",
    "@types/node": "25.5.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.14",
    "husky": "9.1.7",
    "lint-staged": "16.4.0",
    "tailwindcss": "4.2.1",
    "typescript": "5.9.3",
    "drizzle-kit": "0.31.9"
  }
}
```

Note: The CLI will also trim `scripts` entries for unselected modules (e.g., remove `db:*` scripts if Drizzle not selected).

- [ ] **Step 2: Create `template/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `template/next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `template/biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.7/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  },
  "files": {
    "ignore": [".next", "node_modules"]
  }
}
```

- [ ] **Step 5: Create `template/postcss.config.mjs`**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 6: Create `template/.gitignore`**

```
# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env
.env
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 7: Create `template/.lintstagedrc`**

```json
{
  "*": ["biome check --write --no-errors-on-unmatched"]
}
```

- [ ] **Step 8: Create `template/.husky/pre-commit`**

```bash
bunx lint-staged
```

- [ ] **Step 9: Create `template/README.md`**

```markdown
# {{PROJECT_NAME}}

Built with [create-rotor](https://github.com/yikzero/rotor).

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
```

- [ ] **Step 10: Create `template/app/api/.gitkeep`**

Empty file — provides the `app/api/` directory structure for API routes.

- [ ] **Step 11: Commit**

```bash
git add template/
git commit -m "feat: add core template files"
```

---

### Task 4: Create template app files

**Files:**
- Create: `template/app/layout.tsx`
- Create: `template/app/page.tsx`
- Create: `template/app/globals.css`
- Create: `template/.env.example`

- [ ] **Step 1: Create `template/app/globals.css`**

Contains Tailwind v4 import + CSS variables for shadcn/ui (within `/* [shadcn] */` markers so they can be trimmed if shadcn not selected). The `@layer base` block is **inside** the markers so it gets trimmed too — it references shadcn CSS variables.

```css
@import 'tailwindcss';

/* [shadcn] */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
/* [/shadcn] */
```

- [ ] **Step 2: Create `template/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `template/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{{PROJECT_NAME}}</h1>
    </main>
  );
}
```

- [ ] **Step 4: Create `template/.env.example`**

```bash
# [drizzle]
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
# [/drizzle]

# [ai]
OPENAI_API_KEY=sk-your-key
# [/ai]
```

- [ ] **Step 5: Commit**

```bash
git add template/app template/.env.example
git commit -m "feat: add template app files and env example"
```

---

### Task 5: Create optional module template files

**Files:**
- Create: `template/lib/utils.ts` (shadcn/ui)
- Create: `template/components.json` (shadcn/ui)
- Create: `template/components/ui/.gitkeep` (shadcn/ui)
- Create: `template/lib/db.ts` (Drizzle)
- Create: `template/lib/schema.ts` (Drizzle)
- Create: `template/drizzle.config.ts` (Drizzle)
- Create: `template/lib/ai.ts` (AI SDK)

- [ ] **Step 1: Create `template/lib/utils.ts`** (shadcn/ui)

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `template/components.json`** (shadcn/ui — Base UI style)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Create `template/components/ui/.gitkeep`**

Empty file — provides the `components/ui/` directory for shadcn components to be added via `bunx --bun shadcn@latest add <component>`.

- [ ] **Step 4: Create `template/lib/db.ts`** (Drizzle + Supabase)

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client);
```

- [ ] **Step 5: Create `template/lib/schema.ts`** (Drizzle — starter schema)

```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

- [ ] **Step 6: Create `template/drizzle.config.ts`** (Drizzle)

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './lib/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 7: Create `template/lib/ai.ts`** (AI SDK)

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generate(prompt: string) {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt,
  });
  return text;
}
```

- [ ] **Step 8: Commit**

```bash
git add template/lib template/components.json template/components template/drizzle.config.ts
git commit -m "feat: add optional module template files"
```

---

## Chunk 2: CLI Logic

### Task 6: Write helper functions with tests

**Files:**
- Create: `src/helpers.ts`
- Create: `src/__tests__/helpers.test.ts`

- [ ] **Step 1: Write tests for helper functions**

```ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  trimDependencies,
  trimEnvFile,
  removeModuleFiles,
  replaceProjectName,
  trimScripts,
  trimCssShadcn,
} from '../helpers';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'rotor-test-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('trimDependencies', () => {
  test('removes unselected module dependencies from package.json', () => {
    const pkgPath = join(tempDir, 'package.json');
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: 'test',
        dependencies: {
          next: '16.1.6',
          react: '19.2.4',
          swr: '2.4.1',
          'drizzle-orm': '0.45.1',
          '@supabase/supabase-js': '2.99.1',
          postgres: '3.4.8',
        },
        devDependencies: {
          typescript: '5.9.3',
          'drizzle-kit': '0.31.9',
        },
      }),
    );

    // Only SWR selected — drizzle deps should be removed, swr kept
    trimDependencies(pkgPath, ['swr']);

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies.swr).toBe('2.4.1');
    expect(pkg.dependencies['drizzle-orm']).toBeUndefined();
    expect(pkg.dependencies['@supabase/supabase-js']).toBeUndefined();
    expect(pkg.dependencies.postgres).toBeUndefined();
    expect(pkg.devDependencies['drizzle-kit']).toBeUndefined();
    expect(pkg.dependencies.next).toBe('16.1.6');
    expect(pkg.dependencies.react).toBe('19.2.4');
  });

  test('keeps all dependencies when all modules selected', () => {
    const pkgPath = join(tempDir, 'package.json');
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: 'test',
        dependencies: { next: '16.1.6', swr: '2.4.1', ai: '6.0.116' },
        devDependencies: { typescript: '5.9.3' },
      }),
    );

    trimDependencies(pkgPath, ['shadcn', 'swr', 'drizzle', 'ai']);

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies.swr).toBe('2.4.1');
    expect(pkg.dependencies.ai).toBe('6.0.116');
  });

  test('removes all optional deps when none selected', () => {
    const pkgPath = join(tempDir, 'package.json');
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: 'test',
        dependencies: {
          next: '16.1.6',
          swr: '2.4.1',
          ai: '6.0.116',
          'drizzle-orm': '0.45.1',
        },
        devDependencies: { typescript: '5.9.3', 'drizzle-kit': '0.31.9' },
      }),
    );

    trimDependencies(pkgPath, []);

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies.next).toBe('16.1.6');
    expect(pkg.dependencies.swr).toBeUndefined();
    expect(pkg.dependencies.ai).toBeUndefined();
    expect(pkg.dependencies['drizzle-orm']).toBeUndefined();
    expect(pkg.devDependencies['drizzle-kit']).toBeUndefined();
  });
});

describe('trimScripts', () => {
  test('removes drizzle scripts when drizzle not selected', () => {
    const pkgPath = join(tempDir, 'package.json');
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: 'test',
        scripts: {
          dev: 'next dev --turbopack',
          build: 'next build',
          'db:generate': 'drizzle-kit generate',
          'db:migrate': 'drizzle-kit migrate',
          'db:studio': 'drizzle-kit studio',
        },
      }),
    );

    trimScripts(pkgPath, []);

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts.dev).toBe('next dev --turbopack');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts['db:generate']).toBeUndefined();
    expect(pkg.scripts['db:migrate']).toBeUndefined();
    expect(pkg.scripts['db:studio']).toBeUndefined();
  });

  test('keeps drizzle scripts when drizzle is selected', () => {
    const pkgPath = join(tempDir, 'package.json');
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: 'test',
        scripts: {
          dev: 'next dev --turbopack',
          'db:generate': 'drizzle-kit generate',
          'db:migrate': 'drizzle-kit migrate',
        },
      }),
    );

    trimScripts(pkgPath, ['drizzle']);

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts.dev).toBe('next dev --turbopack');
    expect(pkg.scripts['db:generate']).toBe('drizzle-kit generate');
    expect(pkg.scripts['db:migrate']).toBe('drizzle-kit migrate');
  });
});

describe('trimEnvFile', () => {
  test('removes env sections for unselected modules', () => {
    const envPath = join(tempDir, '.env.example');
    writeFileSync(
      envPath,
      [
        '# [drizzle]',
        'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
        '# [/drizzle]',
        '',
        '# [ai]',
        'OPENAI_API_KEY=sk-your-key',
        '# [/ai]',
      ].join('\n'),
    );

    trimEnvFile(envPath, ['ai']);

    const content = readFileSync(envPath, 'utf-8');
    expect(content).not.toContain('DATABASE_URL');
    expect(content).toContain('OPENAI_API_KEY');
  });

  test('removes all optional sections when none selected', () => {
    const envPath = join(tempDir, '.env.example');
    writeFileSync(
      envPath,
      [
        '# [drizzle]',
        'DATABASE_URL=x',
        '# [/drizzle]',
        '',
        '# [ai]',
        'OPENAI_API_KEY=x',
        '# [/ai]',
      ].join('\n'),
    );

    trimEnvFile(envPath, []);

    const content = readFileSync(envPath, 'utf-8').trim();
    expect(content).toBe('');
  });
});

describe('removeModuleFiles', () => {
  test('removes files for unselected modules', () => {
    mkdirSync(join(tempDir, 'lib'), { recursive: true });
    writeFileSync(join(tempDir, 'lib', 'db.ts'), 'export const db = {};');
    writeFileSync(join(tempDir, 'drizzle.config.ts'), 'export default {};');
    writeFileSync(join(tempDir, 'lib', 'ai.ts'), 'export const ai = {};');

    removeModuleFiles(tempDir, ['ai']);

    expect(existsSync(join(tempDir, 'lib', 'db.ts'))).toBe(false);
    expect(existsSync(join(tempDir, 'drizzle.config.ts'))).toBe(false);
    expect(existsSync(join(tempDir, 'lib', 'ai.ts'))).toBe(true);
  });
});

describe('replaceProjectName', () => {
  test('replaces {{PROJECT_NAME}} in target files', () => {
    mkdirSync(join(tempDir, 'app'), { recursive: true });
    writeFileSync(
      join(tempDir, 'package.json'),
      '{"name": "{{PROJECT_NAME}}"}',
    );
    writeFileSync(
      join(tempDir, 'app', 'layout.tsx'),
      'title: "{{PROJECT_NAME}}"',
    );
    writeFileSync(join(tempDir, 'README.md'), '# {{PROJECT_NAME}}');
    writeFileSync(
      join(tempDir, 'app', 'page.tsx'),
      '<h1>{{PROJECT_NAME}}</h1>',
    );

    replaceProjectName(tempDir, 'my-cool-app');

    expect(readFileSync(join(tempDir, 'package.json'), 'utf-8')).toContain(
      'my-cool-app',
    );
    expect(
      readFileSync(join(tempDir, 'app', 'layout.tsx'), 'utf-8'),
    ).toContain('my-cool-app');
    expect(readFileSync(join(tempDir, 'README.md'), 'utf-8')).toContain(
      'my-cool-app',
    );
    expect(readFileSync(join(tempDir, 'app', 'page.tsx'), 'utf-8')).toContain(
      'my-cool-app',
    );
  });
});

describe('trimCssShadcn', () => {
  test('removes shadcn CSS sections when shadcn not selected', () => {
    const cssPath = join(tempDir, 'globals.css');
    writeFileSync(
      cssPath,
      [
        "@import 'tailwindcss';",
        '',
        '/* [shadcn] */',
        '@theme inline {',
        '  --color-background: var(--background);',
        '}',
        ':root {',
        '  --background: oklch(1 0 0);',
        '}',
        '@layer base {',
        '  body {',
        '    @apply bg-background text-foreground;',
        '  }',
        '}',
        '/* [/shadcn] */',
      ].join('\n'),
    );

    trimCssShadcn(cssPath);

    const content = readFileSync(cssPath, 'utf-8');
    expect(content).not.toContain('@theme');
    expect(content).not.toContain('@layer base');
    expect(content).not.toContain(':root');
    expect(content).toContain("@import 'tailwindcss'");
  });

  test('preserves all content when markers are absent', () => {
    const cssPath = join(tempDir, 'globals.css');
    const original = "@import 'tailwindcss';\n\nbody { margin: 0; }\n";
    writeFileSync(cssPath, original);

    trimCssShadcn(cssPath);

    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain("@import 'tailwindcss'");
    expect(content).toContain('body { margin: 0; }');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/yikzero/Code/Rotor && bun test src/__tests__/helpers.test.ts`
Expected: FAIL — functions not defined

- [ ] **Step 3: Implement `src/helpers.ts`**

```ts
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { MODULES } from './constants';

export function trimDependencies(
  pkgPath: string,
  selectedModules: string[],
): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const unselected = Object.keys(MODULES).filter(
    (m) => !selectedModules.includes(m),
  );

  for (const moduleName of unselected) {
    const mod = MODULES[moduleName];
    for (const dep of Object.keys(mod.dependencies)) {
      delete pkg.dependencies?.[dep];
    }
    for (const dep of Object.keys(mod.devDependencies)) {
      delete pkg.devDependencies?.[dep];
    }
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function trimScripts(
  pkgPath: string,
  selectedModules: string[],
): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  if (!selectedModules.includes('drizzle')) {
    for (const key of Object.keys(pkg.scripts || {})) {
      if (key.startsWith('db:')) {
        delete pkg.scripts[key];
      }
    }
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function trimEnvFile(
  envPath: string,
  selectedModules: string[],
): void {
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const startMatch = line.match(/^#\s*\[(\w+)\]\s*$/);
    const endMatch = line.match(/^#\s*\[\/(\w+)\]\s*$/);

    if (startMatch) {
      const marker = startMatch[1];
      if (!selectedModules.includes(marker)) {
        skipping = true;
        continue;
      }
    }

    if (endMatch) {
      if (skipping) {
        skipping = false;
        continue;
      }
    }

    if (!skipping) {
      result.push(line);
    }
  }

  // Remove marker comments for selected modules (clean output)
  const cleaned = result
    .filter((line) => !line.match(/^#\s*\[\/?\w+\]\s*$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  writeFileSync(envPath, cleaned ? `${cleaned}\n` : '');
}

export function removeModuleFiles(
  projectDir: string,
  selectedModules: string[],
): void {
  const unselected = Object.keys(MODULES).filter(
    (m) => !selectedModules.includes(m),
  );

  for (const moduleName of unselected) {
    const mod = MODULES[moduleName];
    for (const file of mod.files) {
      const filePath = join(projectDir, file);
      if (existsSync(filePath)) {
        rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
}

export function replaceProjectName(
  projectDir: string,
  projectName: string,
): void {
  const filesToReplace = [
    'package.json',
    'app/layout.tsx',
    'app/page.tsx',
    'README.md',
  ];

  for (const file of filesToReplace) {
    const filePath = join(projectDir, file);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf-8');
    writeFileSync(
      filePath,
      content.replaceAll('{{PROJECT_NAME}}', projectName),
    );
  }
}

export function trimCssShadcn(cssPath: string): void {
  if (!existsSync(cssPath)) return;

  const content = readFileSync(cssPath, 'utf-8');
  const lines = content.split('\n');
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (line.match(/^\/\*\s*\[shadcn\]\s*\*\/\s*$/)) {
      skipping = true;
      continue;
    }
    if (line.match(/^\/\*\s*\[\/shadcn\]\s*\*\/\s*$/)) {
      skipping = false;
      continue;
    }
    if (!skipping) {
      result.push(line);
    }
  }

  const cleaned = result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  writeFileSync(cssPath, `${cleaned}\n`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/yikzero/Code/Rotor && bun test src/__tests__/helpers.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/helpers.ts src/__tests__/helpers.test.ts
git commit -m "feat: add template trimming helpers with tests"
```

---

### Task 7: Write the CLI entry point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create `src/index.ts`**

```ts
#!/usr/bin/env node

import {
  intro,
  outro,
  text,
  multiselect,
  confirm,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { MODULES, VERSION } from './constants';
import {
  trimDependencies,
  trimScripts,
  trimEnvFile,
  removeModuleFiles,
  replaceProjectName,
  trimCssShadcn,
} from './helpers';

function getTemplatePath(): string {
  return resolve(import.meta.dirname, '..', 'template');
}

function validateProjectName(name: string): string | undefined {
  if (!name) return 'Project name is required';
  if (!/^[a-z0-9@][a-z0-9-._~/]*$/.test(name)) {
    return 'Invalid name: use lowercase, hyphens, no spaces';
  }
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);

  // Handle flags before interactive prompts
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  create-rotor v${VERSION}

  Usage: create-rotor [project-name]

  Options:
    -v, --version  Show version
    -h, --help     Show help
    `);
    process.exit(0);
  }

  intro('create-rotor');

  // Project name — from CLI arg or prompt
  const argName = args.find((a) => !a.startsWith('-'));
  let projectName: string;

  if (argName && !validateProjectName(argName)) {
    projectName = argName;
  } else {
    const nameResult = await text({
      message: 'Project name?',
      placeholder: 'my-app',
      validate: validateProjectName,
    });
    if (isCancel(nameResult)) {
      cancel('Cancelled.');
      process.exit(0);
    }
    projectName = nameResult;
  }

  // Check target directory
  const targetDir = resolve(process.cwd(), projectName);
  if (existsSync(targetDir)) {
    const overwrite = await confirm({
      message: `Directory "${projectName}" already exists. Overwrite?`,
    });
    if (isCancel(overwrite) || !overwrite) {
      cancel('Cancelled.');
      process.exit(0);
    }
    rmSync(targetDir, { recursive: true, force: true });
  }

  // Feature selection
  const features = await multiselect({
    message: 'Select optional features:',
    options: Object.values(MODULES).map((m) => ({
      value: m.name,
      label: m.label,
      hint: m.hint,
    })),
    required: false,
  });
  if (isCancel(features)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  const selectedModules = features as string[];

  // Git init
  const initGit = await confirm({
    message: 'Initialize git repository?',
    initialValue: true,
  });
  if (isCancel(initGit)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  // Scaffold
  const s = spinner();
  s.start('Creating project...');

  const templatePath = getTemplatePath();
  cpSync(templatePath, targetDir, { recursive: true });

  replaceProjectName(targetDir, projectName);
  removeModuleFiles(targetDir, selectedModules);
  trimDependencies(join(targetDir, 'package.json'), selectedModules);
  trimScripts(join(targetDir, 'package.json'), selectedModules);
  trimEnvFile(join(targetDir, '.env.example'), selectedModules);

  if (!selectedModules.includes('shadcn')) {
    trimCssShadcn(join(targetDir, 'app', 'globals.css'));
  }

  // Git init
  if (initGit) {
    execSync('git init', { cwd: targetDir, stdio: 'ignore' });
    execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
    execSync('git commit -m "init"', { cwd: targetDir, stdio: 'ignore' });
  }

  s.stop('Project created!');

  outro(`Done! Next steps:

  cd ${projectName}
  bun install
  bun dev`);
}

main().catch(console.error);
```

- [ ] **Step 2: Run all tests**

Run: `cd /Users/yikzero/Code/Rotor && bun test`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with interactive prompts"
```

---

### Task 8: Build and local smoke test

- [ ] **Step 1: Build the CLI**

Run: `cd /Users/yikzero/Code/Rotor && bun run build`
Expected: `dist/index.js` created

- [ ] **Step 2: Smoke test — create a project with all options**

Run: `cd /tmp && node /Users/yikzero/Code/Rotor/dist/index.js test-rotor-all`
Interactively select all 4 modules, say yes to git init.

Verify:
- All files exist: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/api/.gitkeep`
- `package.json` has all dependencies (swr, drizzle-orm, ai, clsx, etc.)
- `.env.example` has all env vars (DATABASE_URL, OPENAI_API_KEY, etc.)
- `components.json` exists with `"style": "base-vega"`
- `components/ui/.gitkeep` exists
- `lib/db.ts`, `lib/schema.ts`, `lib/ai.ts`, `lib/utils.ts` exist
- `drizzle.config.ts` exists
- `db:generate`, `db:migrate`, `db:studio` scripts in package.json
- git repo initialized with initial commit
- `{{PROJECT_NAME}}` replaced with `test-rotor-all` in package.json, layout.tsx, page.tsx, README.md

- [ ] **Step 3: Smoke test — create a project with no options**

Run: `cd /tmp && node /Users/yikzero/Code/Rotor/dist/index.js test-rotor-none`
Select no optional modules.

Verify:
- `package.json` has only core dependencies (no swr, drizzle-orm, ai, clsx, etc.)
- No `components.json`, `lib/db.ts`, `lib/schema.ts`, `lib/ai.ts`, `lib/utils.ts`
- No `components/ui/` directory
- `.env.example` is empty
- No `drizzle.config.ts`
- No `db:*` scripts in package.json
- `globals.css` contains only `@import 'tailwindcss';` (no shadcn theme vars)

- [ ] **Step 4: Smoke test — version and help flags**

Run: `node /Users/yikzero/Code/Rotor/dist/index.js --version`
Expected: `0.1.0`

Run: `node /Users/yikzero/Code/Rotor/dist/index.js --help`
Expected: Usage text with options

- [ ] **Step 5: Clean up test projects**

Run: `rm -rf /tmp/test-rotor-all /tmp/test-rotor-none`

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
(Skip if no fixes needed)

---

## Chunk 3: Publish

### Task 9: Final build and publish preparation

- [ ] **Step 1: Run all tests**

Run: `cd /Users/yikzero/Code/Rotor && bun test`
Expected: All PASS

- [ ] **Step 2: Run biome check**

Run: `cd /Users/yikzero/Code/Rotor && bun run check`
Expected: No errors

- [ ] **Step 3: Build final**

Run: `cd /Users/yikzero/Code/Rotor && bun run build`
Expected: `dist/index.js` created

- [ ] **Step 4: Verify package contents**

Run: `cd /Users/yikzero/Code/Rotor && npm pack --dry-run`
Verify: Output shows `dist/` and `template/` files included

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: finalize build for publishing"
```

- [ ] **Step 6: Publish to npm**

Run: `cd /Users/yikzero/Code/Rotor && npm publish`

(User should be logged in to npm first: `npm login`)
