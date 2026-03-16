import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MODULES } from './constants'

export function trimPackageJson(
  pkgPath: string,
  selectedModules: string[],
  options?: { removeHusky?: boolean },
): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  // Remove unselected module dependencies
  const unselected = Object.keys(MODULES).filter(
    (m) => !selectedModules.includes(m),
  )

  for (const moduleName of unselected) {
    const mod = MODULES[moduleName]
    for (const dep of Object.keys(mod.dependencies)) {
      delete pkg.dependencies?.[dep]
    }
    for (const dep of Object.keys(mod.devDependencies)) {
      delete pkg.devDependencies?.[dep]
    }
  }

  // Remove drizzle scripts if not selected
  if (!selectedModules.includes('drizzle')) {
    for (const key of Object.keys(pkg.scripts || {})) {
      if (key.startsWith('db:')) {
        delete pkg.scripts[key]
      }
    }
  }

  // Remove husky/lint-staged if git not initialized
  if (options?.removeHusky) {
    delete pkg.devDependencies?.husky
    delete pkg.devDependencies?.['lint-staged']
    delete pkg.scripts?.prepare
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

export function trimEnvFile(
  envPath: string,
  selectedModules: string[],
): boolean {
  if (!existsSync(envPath)) return false

  const content = readFileSync(envPath, 'utf-8')
  const lines = content.split('\n')
  const result: string[] = []
  let skipping = false

  for (const line of lines) {
    const startMatch = line.match(/^#\s*\[(\w+)\]\s*$/)
    const endMatch = line.match(/^#\s*\[\/(\w+)\]\s*$/)

    if (startMatch) {
      const marker = startMatch[1]
      if (!selectedModules.includes(marker)) {
        skipping = true
        continue
      }
    }

    if (endMatch) {
      if (skipping) {
        skipping = false
        continue
      }
    }

    if (!skipping) {
      result.push(line)
    }
  }

  // Remove marker comments for selected modules (clean output)
  const cleaned = result
    .filter((line) => !line.match(/^#\s*\[\/?\w+\]\s*$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  writeFileSync(envPath, cleaned ? `${cleaned}\n` : '')
  return cleaned.length > 0
}

export function removeHuskyFiles(projectDir: string): void {
  rmSync(join(projectDir, '.husky'), { recursive: true, force: true })
  rmSync(join(projectDir, '.lintstagedrc'), { force: true })
}

export function removeModuleFiles(
  projectDir: string,
  selectedModules: string[],
): void {
  const unselected = Object.keys(MODULES).filter(
    (m) => !selectedModules.includes(m),
  )

  for (const moduleName of unselected) {
    const mod = MODULES[moduleName]
    for (const file of mod.files) {
      rmSync(join(projectDir, file), { recursive: true, force: true })
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
    'README.md',
    'CLAUDE.md',
  ]

  for (const file of filesToReplace) {
    const filePath = join(projectDir, file)
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, 'utf-8')
    writeFileSync(filePath, content.replaceAll('{{PROJECT_NAME}}', projectName))
  }
}

export function trimCssShadcn(cssPath: string, removeContent = true): void {
  if (!existsSync(cssPath)) return

  const content = readFileSync(cssPath, 'utf-8')
  const lines = content.split('\n')
  const result: string[] = []
  let skipping = false

  for (const line of lines) {
    if (line.match(/^\/\*\s*\[shadcn\]\s*\*\/\s*$/)) {
      skipping = true
      continue
    }
    if (line.match(/^\/\*\s*\[\/shadcn\]\s*\*\/\s*$/)) {
      skipping = false
      continue
    }
    if (!skipping || !removeContent) {
      result.push(line)
    }
  }

  const cleaned = result
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  writeFileSync(cssPath, `${cleaned}\n`)
}
