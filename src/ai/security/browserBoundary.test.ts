import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const securityDirectory = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(securityDirectory, '..');
const repositoryRoot = resolve(sourceRoot, '..', '..');

function resolveSourceModule(importerPath: string, specifier: string): string | undefined {
  const candidate = resolve(dirname(importerPath), specifier);
  const explicitExtension = extname(candidate);
  const sourceAlternatives = explicitExtension === '.js' || explicitExtension === '.mjs'
    ? [candidate.replace(/\.(?:m?js)$/, '.ts'), candidate.replace(/\.(?:m?js)$/, '.tsx')]
    : [];
  const candidates = explicitExtension
    ? [candidate, ...sourceAlternatives]
    : [
        ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map((extension) => `${candidate}${extension}`),
        ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map((extension) =>
          resolve(candidate, `index${extension}`)
        )
      ];
  return candidates.find((path) => existsSync(path));
}

function collectRelativeImportGraph(entryPath: string): Set<string> {
  const visited = new Set<string>();
  const pending = [entryPath];
  // This source walker follows relative static and dynamic imports. Bare
  // specifiers/path aliases are covered by scanning the actual client bundle.
  const staticImportPattern =
    /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s*)?['"](\.[^'"]+)['"]/g;
  const dynamicImportPattern = /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath || visited.has(currentPath)) continue;
    visited.add(currentPath);

    const source = readFileSync(currentPath, 'utf8');
    for (const pattern of [staticImportPattern, dynamicImportPattern]) {
      for (const match of source.matchAll(pattern)) {
        const dependencyPath = resolveSourceModule(currentPath, match[1]);
        if (dependencyPath && !visited.has(dependencyPath)) pending.push(dependencyPath);
      }
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

  it('does not inject provider keys or remote construction code through Vite or the built client bundle', () => {
    const viteConfig = readFileSync(resolve(repositoryRoot, 'vite.config.ts'), 'utf8');
    expect(viteConfig).not.toMatch(/VITE_[A-Z0-9_]*(?:OPENAI|ANTHROPIC|AI)[A-Z0-9_]*(?:KEY|TOKEN)/i);
    expect(viteConfig).not.toMatch(/define\s*:\s*{[^}]*?(?:OPENAI|ANTHROPIC|AI_API_KEY)/is);

    const assetsDirectory = resolve(repositoryRoot, 'dist', 'assets');
    expect(existsSync(assetsDirectory), 'production build assets directory must exist').toBe(true);

    const bundleMarkers = [
      'OPENAI_API_KEY',
      'VITE_OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'TEST_ONLY_FAKE_CREDENTIAL_NOT_REAL',
      'OpenAiProvider',
      'createOpenAiProvider',
      'RemoteAiProvider',
      'createRemoteAiProvider',
      'FetchRemoteAiTransport'
    ];
    const javascriptAssets = readdirSync(assetsDirectory)
      .filter((assetName) => /\.(?:m?js|cjs)$/i.test(assetName));
    expect(javascriptAssets.length, 'production build must emit at least one JavaScript asset').toBeGreaterThan(0);

    for (const assetName of javascriptAssets) {
      const bundle = readFileSync(resolve(assetsDirectory, assetName));
      for (const marker of bundleMarkers) {
        expect(bundle.includes(Buffer.from(marker))).toBe(false);
      }
    }
  });
});
