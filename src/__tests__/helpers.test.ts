import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  removeModuleFiles,
  replaceProjectName,
  trimCssShadcn,
  trimDependencies,
  trimEnvFile,
  trimScripts,
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

    replaceProjectName(tempDir, 'my-cool-app');

    expect(readFileSync(join(tempDir, 'package.json'), 'utf-8')).toContain(
      'my-cool-app',
    );
    expect(readFileSync(join(tempDir, 'app', 'layout.tsx'), 'utf-8')).toContain(
      'my-cool-app',
    );
    expect(readFileSync(join(tempDir, 'README.md'), 'utf-8')).toContain(
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
