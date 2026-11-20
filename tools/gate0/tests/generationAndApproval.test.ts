import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildBoundaryVectors } from '../capture-boundary.ts';
import { renderFixtureModule, type BuilderCall } from '../gen-fixtures.ts';
import { evaluateFixtureApproval } from '../lib/approval.ts';

const tempDirs: string[] = [];

function tempPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'gate0-approval-'));
  tempDirs.push(dir);
  return join(dir, 'approvals.json');
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('Gate-0 generation and approval', () => {
  it('renders byte-identical fixture source for identical builder inputs', () => {
    const calls: BuilderCall[] = [
      { fn: 'buildSignBoundaryFixture', args: { id: 'SIGN-0:EXACT', expectedSign: 'ARIES' } },
      { fn: 'buildHousePositionFixture', args: { id: 'HOUSE-ARIES-TAURUS', expectedHouse: 2 } }
    ];
    const first = renderFixtureModule(calls);
    const second = renderFixtureModule(calls);

    expect(Buffer.from(first)).toEqual(Buffer.from(second));
  });

  it('generates all sign, nakshatra, and pada boundary triplets', () => {
    const vectors = buildBoundaryVectors();

    expect(vectors).toHaveLength(12 + 27 + 108);
    for (const vector of vectors) {
      const { inputLongitude: before } = vector.positions.EPSILON_BEFORE;
      const { inputLongitude: exact } = vector.positions.EXACT;
      const { inputLongitude: after } = vector.positions.EPSILON_AFTER;
      expect(vector.positions.EPSILON_BEFORE).toBeDefined();
      expect(vector.positions.EXACT).toBeDefined();
      expect(vector.positions.EPSILON_AFTER).toBeDefined();
      expect(Math.abs(((exact - before + 540) % 360) - 180)).toBeCloseTo(vector.epsilonDegrees, 8);
      expect(Math.abs(((after - exact + 540) % 360) - 180)).toBeCloseTo(vector.epsilonDegrees, 8);
    }
  });

  it('keeps approval pending until a reviewer records the current fixture hash', () => {
    const path = tempPath();
    const fixtureSetSha256 = 'a'.repeat(64);
    expect(evaluateFixtureApproval(path, fixtureSetSha256).verdict).toBe('PENDING_REVIEW');

    writeFileSync(path, JSON.stringify({
      schemaVersion: 1,
      fixtureSetSha256,
      reviewer: 'Human reviewer',
      approvedAt: '2026-11-20'
    }));
    expect(evaluateFixtureApproval(path, fixtureSetSha256).verdict).toBe('APPROVED');
    expect(evaluateFixtureApproval(path, 'b'.repeat(64)).verdict).toBe('STALE');
  });
});
