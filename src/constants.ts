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

export const VERSION = '0.1.3';
