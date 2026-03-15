#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { cpSync, existsSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  spinner,
  text,
} from '@clack/prompts';
import { MODULES, VERSION } from './constants';
import {
  removeModuleFiles,
  replaceProjectName,
  trimCssShadcn,
  trimDependencies,
  trimEnvFile,
  trimScripts,
} from './helpers';

function getTemplatePath(): string {
  return resolve(import.meta.dirname, '..', 'template');
}

function validateProjectName(name: string | undefined): string | undefined {
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

  // Rename gitignore → .gitignore (npm strips .gitignore during publish)
  renameSync(join(targetDir, 'gitignore'), join(targetDir, '.gitignore'));

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
