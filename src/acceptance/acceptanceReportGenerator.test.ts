import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = process.cwd();
const script = resolve(root, 'scripts/acceptance/generate-acceptance-report.mjs');
const sha = 'a'.repeat(40);
const temporaryDirectories: string[] = [];

function fixture(overrides: Record<string, unknown> = {}) {
  return {
    storyId: 'E08-S01',
    title: 'Controller async-state acceptance',
    productOwner: 'UNASSIGNED',
    qaOwner: 'UNASSIGNED',
    acceptanceCriteria: ['Stale responses cannot overwrite newer state.'],
    implementationReferences: ['src/app/AppController.ts'],
    requiredTestCommands: ['npm run test:app-controller-acceptance'],
    expectedTestIds: ['stale-response'],
    execution: {
      status: 'PASS',
      testedSha: sha,
      ciRunId: '12345',
      ciRunUrl: 'https://github.com/example/repo/actions/runs/12345',
      commands: [{ command: 'npm run test:app-controller-acceptance', exitCode: 0, status: 'PASS' }],
      evidenceReferences: ['artifacts/release/logs/app-controller.log'],
      skippedCount: 0
    },
    ...overrides
  };
}

function runGenerator(input: unknown, expectedSha = sha) {
  const directory = mkdtempSync(join(tmpdir(), 'coreastro-acceptance-'));
  temporaryDirectories.push(directory);
  const inputPath = join(directory, 'input.json');
  const outputPath = join(directory, 'report.json');
  writeFileSync(inputPath, JSON.stringify(input), 'utf8');
  try {
    execFileSync(process.execPath, [
      script, '--input', inputPath, '--output', outputPath, '--expected-sha', expectedSha
    ], { cwd: root, encoding: 'utf8' });
    return { outputPath, report: JSON.parse(readFileSync(outputPath, 'utf8')) };
  } catch (error) {
    return { outputPath, error: error as Error };
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('generate-acceptance-report', () => {
  it('generates a deterministic report and keeps passing tests PARTIAL when owners are unassigned', () => {
    const input = {
      repository: 'bhumanyu/coreAsstroG3',
      sourceSha: sha,
      workflowRun: { id: '12345', url: 'https://github.com/example/repo/actions/runs/12345', name: 'CI', conclusion: 'success' },
      records: [fixture()]
    };
    const first = runGenerator(input);
    const second = runGenerator(input);

    expect(first.error).toBeUndefined();
    expect(first.report.sourceSha).toBe(sha);
    expect(first.report.records[0].productStatus).toBe('PARTIAL');
    expect(JSON.stringify(first.report)).toBe(JSON.stringify(second.report));
  });

  it('rejects an input report for a different tested revision and writes no output', () => {
    const input = {
      repository: 'bhumanyu/coreAsstroG3',
      sourceSha: sha,
      workflowRun: { id: null, url: null, name: null, conclusion: null },
      records: [fixture()]
    };
    const result = runGenerator(input, 'b'.repeat(40));

    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain('sourceSha does not match the expected tested revision');
    expect(existsSync(result.outputPath)).toBe(false);
  });

  it('rejects a report that tries to mark incomplete evidence COMPLETE', () => {
    const input = {
      repository: 'bhumanyu/coreAsstroG3',
      sourceSha: sha,
      workflowRun: { id: null, url: null, name: null, conclusion: null },
      records: [fixture({ productStatus: 'COMPLETE' })]
    };
    const result = runGenerator(input);

    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain('productStatus does not match its execution evidence');
  });
});
