import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const securityDirectory = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(securityDirectory, '..');
const repositoryRoot = resolve(sourceRoot, '..', '..');

function resolveSourceModule(importerPath: string, specifier: string): string | undefined {
  const candidate = resolve(dirname(importerPath), specifier);
  const candidates = extname(candidate)
    ? [candidate]
    : [`${candidate}.ts`, `${candidate}.tsx`, resolve(candidate, 'index.ts'), resolve(candidate, 'index.tsx')];
  return candidates.find((path) => existsSync(path));
}

function collectRelativeImportGraph(entryPath: string): Set<string> {
  const visited = new Set<string>();
  const pending = [entryPath];
  const importPattern = /(?:import|export)\s+(?:[^'"]*?\s+from\s*)?['"](\.[^'"]+)['"]/g;

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath || visited.has(currentPath)) continue;
    visited.add(currentPath);

    const source = readFileSync(currentPath, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const dependencyPath = resolveSourceModule(currentPath, match[1]);
      if (dependencyPath && !visited.has(dependencyPath)) pending.push(dependencyPath);
    }
  }

  return visited;
}

describe('browser AI boundary', () => {
  it('does not export or transitively import remote provider construction modules', () => {
    const browserEntry = resolve(sourceRoot, 'browser.ts');
    const entrySource = readFileSync(browserEntry, 'utf8');
    const forbiddenExports = [
      'OpenAiProvider',
      'createOpenAiProvider',
      'RemoteAiProvider',
      'createRemoteAiProvider',
      'FetchRemoteAiTransport'
    ];
    for (const symbol of forbiddenExports) {
      expect(entrySource).not.toMatch(new RegExp(`\\b${symbol}\\b`));
    }

    const reachableFiles = [...collectRelativeImportGraph(browserEntry)];
    expect(reachableFiles.some((path) =>
      /[\\/]providers[\\/](?:remote|openai)(?:[\\/]|\.|$)|[\\/]reliability(?:[\\/]|\.|$)/i.test(path)
    )).toBe(false);
  });

  it('does not inject provider keys through Vite configuration or the built client bundle', () => {
    const viteConfig = readFileSync(resolve(repositoryRoot, 'vite.config.ts'), 'utf8');
    expect(viteConfig).not.toMatch(/VITE_[A-Z0-9_]*(?:OPENAI|ANTHROPIC|AI)[A-Z0-9_]*(?:KEY|TOKEN)/i);
    expect(viteConfig).not.toMatch(/define\s*:\s*{[^}]*?(?:OPENAI|ANTHROPIC|AI_API_KEY)/is);

    const assetsDirectory = resolve(repositoryRoot, 'dist', 'assets');
    if (!existsSync(assetsDirectory)) return;

    const bundleMarkers = [
      'OPENAI_API_KEY',
      'VITE_OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'TEST_ONLY_FAKE_CREDENTIAL_NOT_REAL'
    ];
    for (const assetName of readdirSync(assetsDirectory)) {
      const bundle = readFileSync(resolve(assetsDirectory, assetName));
      for (const marker of bundleMarkers) {
        expect(bundle.includes(Buffer.from(marker))).toBe(false);
      }
    }
  });
});
