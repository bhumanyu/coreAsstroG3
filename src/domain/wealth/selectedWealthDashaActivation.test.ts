import { describe, expect, it } from 'vitest';
import { Planet } from '../../types';
import type { SelectedPeriodActivationContext } from '../../core/analysis';
import type {
  DashaAntardashaInterpretation,
  DashaInterpretationEvidence,
  DashaMahadashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import { evaluateSelectedWealthPeriodActivation } from './selectedWealthDashaActivation';

function dashaEvidence(
  ruleId: string,
  effect: DashaInterpretationEvidence['effect'],
  houses: number[],
  planets: Planet[] = []
): DashaInterpretationEvidence {
  return {
    ruleId,
    type: 'HOUSE_DOMAIN',
    level: 'MAHADASHA',
    planets,
    houses,
    statement: `fixture ${ruleId}`,
    effect,
    source: 'test-fixture'
  };
}

function makeContext(
  mdEvidence: readonly DashaInterpretationEvidence[],
  adEvidence: readonly DashaInterpretationEvidence[] = []
): SelectedPeriodActivationContext {
  const mdNode = {
    planet: Planet.SATURN,
    evidence: mdEvidence,
    start: '2020-01-01T00:00:00.000Z',
    end: '2039-01-01T00:00:00.000Z'
  } as unknown as DashaMahadashaInterpretation;
  const adNode = {
    planet: Planet.MERCURY,
    evidence: adEvidence,
    start: '2025-01-01T00:00:00.000Z',
    end: '2027-01-01T00:00:00.000Z'
  } as unknown as DashaAntardashaInterpretation;
  return {
    contextVersion: 'v1',
    dashaSystem: 'VIMSHOTTARI' as const,
    level: 'MD_AD',
    selectedPeriodId: 'pba-period:v1:md-1:ad-1',
    resolverVersion: 'pba-md-ad-resolver-v1',
    analysisAsOf: '2026-01-01T00:00:00.000Z',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: { start: '2025-01-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' },
    mahadasha: {
      id: 'md-1',
      planet: Planet.SATURN,
      start: '2020-01-01T00:00:00.000Z',
      end: '2039-01-01T00:00:00.000Z'
    },
    antardasha: {
      id: 'ad-1',
      mahadashaId: 'md-1',
      planet: Planet.MERCURY,
      start: '2025-01-01T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z'
    },
    mahadashaNode: mdNode,
    antardashaNode: adNode
  } as unknown as SelectedPeriodActivationContext;
}

function promise(
  id: string,
  dimension: DomainEvidence['dimension'],
  house: number,
  planet: Planet
): DomainEvidence {
  return createDomainEvidence({
    id,
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: `${dimension} promise fixture`,
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    relatedEvidenceIds: [],
    dimension,
    house,
    planet
  });
}

describe('evaluateSelectedWealthPeriodActivation (PBA-05)', () => {
  it('evaluates four dimensions independently for the same selected MD-AD period', () => {
    const context = makeContext(
      [dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])],
      [dashaEvidence('AD_11H_CHALLENGE', 'CHALLENGE', [11])]
    );
    const wealthEvidence = [
      promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN),
      promise('NATAL_GAINS', 'GAINS', 11, Planet.MERCURY),
      promise('NATAL_FORTUNE', 'FORTUNE', 9, Planet.JUPITER),
      promise('NATAL_SPEC', 'SPECULATION', 5, Planet.VENUS)
    ];
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: context,
      wealthEvidence
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.selectedPeriodId).toBe(context.selectedPeriodId);
    expect(result.value.interval).toEqual(context.interval);
    expect(result.value.temporalRelation).toBe(context.temporalRelation);
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
    expect(result.value.dimensions.GAINS.effect).toBe('CHALLENGES');
    expect(result.value.dimensions.FORTUNE.effect).toBe('INSUFFICIENT_DATA');
    expect(result.value.dimensions.SPECULATION.effect).toBe('INSUFFICIENT_DATA');
    expect(result.value.dimensions.ACCUMULATION.linkedLevels).toEqual(['MD']);
    expect(result.value.dimensions.GAINS.linkedLevels).toEqual(['AD']);
  });

  it('keeps all dimensions unavailable when natal Wealth promise evidence is absent', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
      wealthEvidence: []
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const dimension of Object.values(result.value.dimensions)) {
      expect(dimension.effect).toBe('INSUFFICIENT_DATA');
      expect(dimension.dashaRuleReferences).toEqual([]);
      expect(dimension.linkedLevels).toEqual([]);
    }
  });

  it('does not turn missing selected-period linkage into a negative effect', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_UNRELATED', 'CHALLENGE', [8])]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    expect(result.value.dimensions.ACCUMULATION.effect).not.toBe('CHALLENGES');
    expect(result.value.dimensions.ACCUMULATION.effect).not.toBe('DOES_NOT_ACTIVATE');
    expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toContain('NATAL_ACC');
  });

  it('returns PARTIALLY_ACTIVATES for linked support and challenge evidence', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([
        dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2]),
        dashaEvidence('MD_2H_CHALLENGE', 'CHALLENGE', [2])
      ]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('PARTIALLY_ACTIVATES');
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_SUPPORT')).toBe(true);
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_CHALLENGE')).toBe(true);
  });

  it('returns UNKNOWN for linked neutral-only evidence', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_NEUTRAL', 'NEUTRAL', [2])]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('UNKNOWN');
  });

  it('returns PARTIALLY_ACTIVATES for explicit MIXED effect', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_MIXED', 'MIXED', [2])]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('PARTIALLY_ACTIVATES');
  });

  it('correctly tracks per-level linkage (MD and AD)', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext(
        [dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])],
        [dashaEvidence('AD_2H_CHALLENGE', 'CHALLENGE', [2])]
      ),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.linkedLevels).toEqual(['MD', 'AD']);
    expect(result.value.dimensions.ACCUMULATION.md.effect).toBe('ACTIVATES');
    expect(result.value.dimensions.ACCUMULATION.ad.effect).toBe('CHALLENGES');
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('PARTIALLY_ACTIVATES');
  });

  it('resolves dimension-vs-house conflict: explicit dimension wins', () => {
    // Evidence with explicit dimension 'ACCUMULATION' but house 11 (GAINS house)
    const conflictingEvidence = createDomainEvidence({
      id: 'CONFLICTING',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'conflicting evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      relatedEvidenceIds: [],
      dimension: 'ACCUMULATION', // Explicit dimension
      house: 11 // GAINS house
    });

    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
      wealthEvidence: [conflictingEvidence]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Should match ACCUMULATION via explicit dimension, not GAINS via house
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA'); // No 2H linkage
    expect(result.value.dimensions.GAINS.effect).toBe('INSUFFICIENT_DATA'); // Explicit dimension is ACCUMULATION
  });

  it('does not mutate the selected context or Wealth evidence', () => {
    const context = makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]);
    const wealthEvidence = [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)];
    const intervalBefore = { ...context.interval };
    const evidenceBefore = [...wealthEvidence];

    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: context,
      wealthEvidence
    });

    expect(result.ok).toBe(true);
    expect(context.interval).toEqual(intervalBefore);
    expect(wealthEvidence).toEqual(evidenceBefore);
  });

  it('prefers explicit dimension over house fallback', () => {
    const wealthEvidence = [
      // Evidence with explicit dimension
      promise('EXPLICIT_ACC', 'ACCUMULATION', 2, Planet.SATURN),
      // Evidence without dimension, relying on house
      createDomainEvidence({
        id: 'HOUSE_FALLBACK',
        sourceType: 'HOUSE',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'house fallback',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 90,
        relatedEvidenceIds: [],
        // No dimension field
        house: 2,
        planet: Planet.JUPITER
      })
    ];

    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
      wealthEvidence
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Both should be selected for ACCUMULATION
    expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toContain('EXPLICIT_ACC');
    expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toContain('HOUSE_FALLBACK');
  });

  it('links via planet overlap with natal promise', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_PLANET_SATURN', 'SUPPORT', [], [Planet.SATURN])]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
    expect(result.value.dimensions.ACCUMULATION.linkedLevels).toEqual(['MD']);
  });

  it('does not infer DOES_NOT_ACTIVATE or CHALLENGES from absence', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([]), // No dasha evidence
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    expect(result.value.dimensions.ACCUMULATION.effect).not.toBe('DOES_NOT_ACTIVATE');
    expect(result.value.dimensions.ACCUMULATION.effect).not.toBe('CHALLENGES');
  });

  it('validates selected period context and returns error on mismatch', () => {
    const invalidContext = makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]);
    // Corrupt the context to fail validation
    (invalidContext as any).dashaSystem = 'INVALID';

    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: invalidContext,
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('validation failed');
    }
  });
});
