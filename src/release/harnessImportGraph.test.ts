import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { computeHarnessImportGraph } from '../../scripts/release/harnessImportGraph.mjs';
import {
  harnessDependencyGraphDifferences,
  harnessDependencyInventoryIssues
} from './releaseGateReport';

const entryPath = 'src/acceptance/entry.ts';
const baseConfigPath = 'config/tsconfig.base.json';
const extendingConfig = JSON.stringify({
  extends: './config/tsconfig.base.json',
  include: ['src/**/*']
});
const baseConfig = (target: string) => JSON.stringify({
  compilerOptions: {
    module: 'ESNext',
    moduleResolution: 'Bundler',
    baseUrl: '..',
    paths: { '@core/*': [`${target}/*`] }
  }
});

function createRepository(): {
  readonly root: string;
  write: (path: string, content: string) => void;
  remove: (path: string) => void;
  commit: (message: string) => string;
  cleanup: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), 'harness-import-graph-'));
  const git = (...args: string[]) => execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
  git('init', '-q');
  git('config', 'user.name', 'Import graph test');
  git('config', 'user.email', 'import-graph@example.invalid');
  const write = (path: string, content: string) => {
    const absolute = join(root, path);
    mkdirSync(join(absolute, '..'), { recursive: true });
    writeFileSync(absolute, content);
  };
  const commit = (message: string) => {
    git('add', '-A');
    git('commit', '-qm', message);
    return git('rev-parse', 'HEAD');
  };
  return {
    root,
    write,
    remove: path => unlinkSync(join(root, path)),
    commit,
    cleanup: () => rmSync(root, { recursive: true, force: true })
  };
}

describe('Git-revision TypeScript harness import graph', () => {
  it('resolves tsconfig extends, aliases, import type, import equals, and reports runtime loads', () => {
    const repository = createRepository();
    try {
      repository.write('tsconfig.json', extendingConfig);
      repository.write(baseConfigPath, baseConfig('src/aliased'));
      repository.write(entryPath, [
        "import type { Payload } from '@core/types';",
        "import Other = require('@core/other');",
        "import './relative';",
        "const dynamic = import('./dynamic');",
        'declare const runtimeName: string;',
        'require(runtimeName);',
        'import(runtimeName);',
        'export type Entry = Payload;'
      ].join('\n'));
      repository.write('src/aliased/types.ts', 'export interface Payload { value: string }\n');
      repository.write('src/aliased/other.ts', 'export interface Other {}\n');
      repository.write('src/acceptance/relative.ts', 'export const relative = true;\n');
      repository.write('src/acceptance/dynamic.ts', 'export const dynamic = true;\n');
      const revision = repository.commit('add graph fixtures');
      const graph = computeHarnessImportGraph(repository.root, revision, entryPath);

      expect(graph.dependencies).toEqual(expect.arrayContaining([
        entryPath,
        'src/aliased/types.ts',
        'src/aliased/other.ts',
        'src/acceptance/relative.ts',
        'src/acceptance/dynamic.ts'
      ]));
      expect(graph.edges).toContain(
        'src/acceptance/entry.ts -> src/aliased/types.ts (static)'
      );
      expect(graph.edges).toContain(
        'src/acceptance/entry.ts -> src/aliased/other.ts (import-equals)'
      );
      expect(graph.edges).toContain(
        'src/acceptance/entry.ts -> src/acceptance/relative.ts (static)'
      );
      expect(graph.runtimeLoadLimitations).toEqual(expect.arrayContaining([
        expect.stringContaining(':nonliteral-require'),
        expect.stringContaining(':dynamic-import')
      ]));
    } finally {
      repository.cleanup();
    }
  });

  it('fails when a relative module specifier cannot be resolved', () => {
    const repository = createRepository();
    try {
      repository.write('tsconfig.json', extendingConfig);
      repository.write(baseConfigPath, baseConfig('src/aliased'));
      repository.write(entryPath, "import './missing';\n");
      const revision = repository.commit('add broken relative import');

      expect(() => computeHarnessImportGraph(repository.root, revision, entryPath))
        .toThrow('Cannot resolve static import ./missing');
    } finally {
      repository.cleanup();
    }
  });

  it('flags dependencies exposed by a changed tsconfig alias as undeclared', () => {
    const repository = createRepository();
    try {
      repository.write('tsconfig.json', extendingConfig);
      repository.write(baseConfigPath, baseConfig('src/aliased'));
      repository.write(entryPath, "import type { Payload } from '@core/types';\n");
      repository.write('src/aliased/types.ts', 'export interface Payload {}\n');
      const accepted = repository.commit('add approved alias');
      const acceptedGraph = computeHarnessImportGraph(repository.root, accepted, entryPath);
      repository.write(baseConfigPath, baseConfig('src/hidden'));
      repository.write('src/hidden/types.ts', 'export interface Payload {}\n');
      const candidate = repository.commit('retarget alias');
      const candidateGraph = computeHarnessImportGraph(repository.root, candidate, entryPath);

      expect(candidateGraph.dependencies).toContain('src/hidden/types.ts');
      expect(harnessDependencyInventoryIssues(
        repository.root,
        ['src/acceptance/', 'src/aliased/'],
        candidateGraph.dependencies
      )).toContain('UNDECLARED_HARNESS_DEPENDENCY:src/hidden/types.ts');
      expect(harnessDependencyGraphDifferences(
        acceptedGraph,
        candidateGraph
      )).toEqual(expect.arrayContaining([
        'REMOVED_DEPENDENCY:src/aliased/types.ts',
        'ADDED_DEPENDENCY:src/hidden/types.ts'
      ]));
    } finally {
      repository.cleanup();
    }
  });

  it('reads accepted and candidate graph content from Git despite worktree deletion', () => {
    const repository = createRepository();
    try {
      repository.write('tsconfig.json', extendingConfig);
      repository.write(baseConfigPath, baseConfig('src/aliased'));
      repository.write(entryPath, "import './dependency';\n");
      repository.write('src/acceptance/dependency.ts', 'export const value = true;\n');
      const accepted = repository.commit('accepted graph with dependency');

      repository.write(entryPath, 'export const value = true;\n');
      repository.remove('src/acceptance/dependency.ts');
      const candidate = repository.commit('candidate graph without dependency');

      const acceptedGraph = computeHarnessImportGraph(repository.root, accepted, entryPath);
      const candidateGraph = computeHarnessImportGraph(repository.root, candidate, entryPath);
      expect(acceptedGraph.dependencies).toContain('src/acceptance/dependency.ts');
      expect(candidateGraph.dependencies).not.toContain('src/acceptance/dependency.ts');
      expect(harnessDependencyGraphDifferences(acceptedGraph, candidateGraph))
        .toContain('REMOVED_DEPENDENCY:src/acceptance/dependency.ts');
    } finally {
      repository.cleanup();
    }
  });
});
