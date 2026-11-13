import { describe, expect, it } from 'vitest';
import { buildUserFacingEvidence } from './evidencePresentation';
import { HINDI_USER_FACING_COPY } from './userFacingInterpretation';
import type { ProductEvidence } from '../analysis/productAnalysisTypes';

function evidence(overrides: Partial<ProductEvidence> = {}): ProductEvidence {
  return {
    id: 'ev_test_1',
    title: 'RAW_DOMAIN_TITLE_WITH_ENUM',
    statement: 'A plain explanation of the factor.',
    direction: 'SUPPORT',
    role: 'PRIMARY',
    source: 'D1',
    ...overrides
  };
}

describe('buildUserFacingEvidence', () => {
  it('derives a house-pair title from structured fields', () => {
    const result = buildUserFacingEvidence(evidence({ houses: [2, 7] }));
    expect(result.title).toBe('Connection between houses 2 and 7');
  });

  it('derives a house title and honors the STRENGTH source type', () => {
    expect(buildUserFacingEvidence(evidence({ house: 4 })).title)
      .toBe('House 4 analysis');
    expect(buildUserFacingEvidence(evidence({ house: 4, sourceType: 'STRENGTH' })).title)
      .toBe('House 4 strength');
  });

  it('derives planet titles using localized planet labels, never raw tokens', () => {
    expect(buildUserFacingEvidence(evidence({ planet: 'jupiter', house: 2 })).title)
      .toBe('Jupiter in house 2');
    expect(buildUserFacingEvidence(evidence({ planet: 'SATURN' })).title)
      .toBe('Saturn chart analysis');
    expect(buildUserFacingEvidence(evidence({ planet: 'unknown_graha' })).title)
      .not.toContain('unknown_graha');
  });

  it('uses Hindi graha names when the Hindi copy provider is supplied', () => {
    const result = buildUserFacingEvidence(
      evidence({ planet: 'JUPITER', house: 2 }),
      HINDI_USER_FACING_COPY
    );
    expect(result.title).toContain('गुरु');
    expect(result.title).not.toContain('JUPITER');
  });

  it('falls back to the localized source label when no structured fields exist', () => {
    expect(buildUserFacingEvidence(evidence({ source: 'D10' })).title)
      .toBe('Career divisional chart (D10)');
    expect(buildUserFacingEvidence(evidence({ source: 'UNKNOWN_SOURCE' })).title)
      .toBe('Chart analysis');
  });

  it.each([
    'Mars rules the 10th house. Dignity: NEUTRAL',
    'Wealth flows through the 2nd house. Wealth relevance: PRIMARY',
    'Jupiter aspects the lagna. Effect: SUPPORT',
    'Saturn occupies the 10th. Career relevance: PRIMARY',
    'House 7 activation observed. Strength: STRONG'
  ])('strips trailing provenance clauses: %s', (statement) => {
    const result = buildUserFacingEvidence(evidence({ statement }));
    expect(result.explanation).not.toMatch(/:\s*[A-Z][A-Z0-9_]+/);
    expect(result.explanation).not.toMatch(/Dignity|Wealth relevance|Career relevance|Strength:|Effect:/);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it('falls back to the evidence summary when cleaning removes everything', () => {
    const result = buildUserFacingEvidence(
      evidence({ statement: 'Effect: SUPPORT' })
    );
    expect(result.explanation).toBe('Main factor: Supportive.');
  });

  it('keeps ordinary prose that is not an uppercase provenance clause', () => {
    const statement = 'Note: A benefic placement supports growth.';
    const result = buildUserFacingEvidence(evidence({ statement }));
    expect(result.explanation).toBe('Note: A benefic placement supports growth');
  });

  it('uses fallback labels for unknown role, direction, and source', () => {
    const result = buildUserFacingEvidence(evidence({
      role: 'FUTURE_ROLE' as ProductEvidence['role'],
      direction: 'FUTURE_DIRECTION' as ProductEvidence['direction'],
      source: 'FUTURE_SOURCE'
    }));
    expect(result.roleLabel).toBe('Evidence factor');
    expect(result.directionLabel).toBe('Direction not assessed');
    expect(result.sourceLabel).toBe('Chart analysis');
    expect(result.title).toBe('Chart analysis');
  });

  it('preserves canonical values under technical unchanged', () => {
    const input = evidence({
      statement: 'Raw statement. Dignity: NEUTRAL',
      source: 'C4_STRUCTURAL_REASONING',
      ruleId: 'RULE-1',
      planet: 'RAHU',
      house: 7,
      derivedFromIds: ['ev_a', 'ev_b']
    });
    const result = buildUserFacingEvidence(input);
    expect(result.technical.statement).toBe('Raw statement. Dignity: NEUTRAL');
    expect(result.technical.source).toBe('C4_STRUCTURAL_REASONING');
    expect(result.technical.ruleId).toBe('RULE-1');
    expect(result.technical.planet).toBe('RAHU');
    expect(result.technical.house).toBe(7);
    expect(result.technical.derivedFromIds).toEqual(['ev_a', 'ev_b']);
    expect(result.derivedFromIds).toEqual(['ev_a', 'ev_b']);
    expect(result.ruleId).toBe('RULE-1');
    expect(result.role).toBe('PRIMARY');
    expect(result.direction).toBe('SUPPORT');
  });

  it('never leaks raw enum codes or provenance clauses into visible fields', () => {
    const result = buildUserFacingEvidence(evidence({
      title: 'C4_STRUCTURAL_REASONING D1 Evidence',
      statement: 'Factor active. Effect: SUPPORT. Dignity: NEUTRAL',
      source: 'C4_STRUCTURAL_REASONING',
      planet: 'KETU',
      house: 5
    }));
    const visible = [result.title, result.explanation, result.sourceLabel,
      result.roleLabel, result.directionLabel].join(' ');
    expect(visible).not.toContain('C4_STRUCTURAL_REASONING');
    expect(visible).not.toContain('D1 Evidence');
    expect(visible).not.toContain('Effect: SUPPORT');
    expect(visible).not.toContain('Dignity: NEUTRAL');
    expect(visible).not.toMatch(/\b(KETU|RAHU|SATURN|MERCURY|JUPITER|VENUS|MARS|MOON|SUN)\b/);
  });

  it('exposes English planet labels for every canonical planet id', () => {
    const expected: Record<string, string> = {
      SUN: 'Sun', MOON: 'Moon', MARS: 'Mars', MERCURY: 'Mercury',
      JUPITER: 'Jupiter', VENUS: 'Venus', SATURN: 'Saturn',
      RAHU: 'Rahu', KETU: 'Ketu'
    };
    for (const [planet, label] of Object.entries(expected)) {
      const result = buildUserFacingEvidence(evidence({ planet }));
      expect(result.title).toBe(`${label} chart analysis`);
    }
  });
});
