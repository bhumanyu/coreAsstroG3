import { describe, expect, it } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type { SelectedPeriodActivationContext } from '../../core/analysis';
import type {
  DashaAntardashaInterpretation,
  DashaInterpretationEvidence,
  DashaMahadashaInterpretation,
  DashaInterpretationReport
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import { evaluateSelectedWealthPeriodActivation } from './selectedWealthDashaActivation';
import {
  createSelectedPeriodActivationContext,
  listSelectableMdAdPeriods,
  SELECTED_PERIOD_CONTEXT_VERSION
} from '../../core/analysis';
import { MD_AD_PERIOD_RESOLVER_VERSION } from '../../core/analysis/selectedMdAdPeriod';

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
  adEvidence: readonly DashaInterpretationEvidence[] = [],
  mdPlanet: Planet = Planet.SATURN,
  adPlanet: Planet = Planet.MERCURY
): SelectedPeriodActivationContext {
  const mdId = 'md-1';
  const adId = 'ad-1';
  const mdNode = {
    planet: mdPlanet,
    evidence: mdEvidence,
    start: '2020-01-01T00:00:00.000Z',
    end: '2039-01-01T00:00:00.000Z'
  } as unknown as DashaMahadashaInterpretation;
  const adNode = {
    planet: adPlanet,
    evidence: adEvidence,
    start: '2025-01-01T00:00:00.000Z',
    end: '2027-01-01T00:00:00.000Z'
  } as unknown as DashaAntardashaInterpretation;
  // Create selectedPeriodId using the same logic as the factory
  const selectedPeriodId = `pba-period:${SELECTED_PERIOD_CONTEXT_VERSION}:${encodeURIComponent(mdId)}:${encodeURIComponent(adId)}`;
  return {
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: 'VIMSHOTTARI' as const,
    level: 'MD_AD',
    selectedPeriodId,
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2026-01-01T00:00:00.000Z',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: { start: '2025-01-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' },
    mahadasha: {
      id: mdId,
      planet: mdPlanet,
      start: '2020-01-01T00:00:00.000Z',
      end: '2039-01-01T00:00:00.000Z'
    },
    antardasha: {
      id: adId,
      mahadashaId: mdId,
      planet: adPlanet,
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

function timingEvidence(
  id: string,
  phase: DomainEvidence['phase'],
  dimension: DomainEvidence['dimension'],
  house: number,
  planet: Planet
): DomainEvidence {
  return createDomainEvidence({
    id,
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase,
    source: 'D1',
    statement: `${phase} evidence fixture`,
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
    expect(result.value.dimensions.ACCUMULATION.insufficientReason).toBe('LINKED');
    expect(result.value.dimensions.GAINS.insufficientReason).toBe('LINKED');
    expect(result.value.dimensions.FORTUNE.insufficientReason).toBe('PROMISE_NOT_LINKED');
    expect(result.value.dimensions.SPECULATION.insufficientReason).toBe('PROMISE_NOT_LINKED');
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
    // Regression test: LINKED with UNKNOWN effect is a valid intermediate state
    // The synthesis layer should map this to PARTIAL dataStatus to avoid contradictions
    expect(result.value.dimensions.ACCUMULATION.insufficientReason).toBe('LINKED');
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

  it('collapses SUPPORT + MIXED to PARTIALLY_ACTIVATES with both ruleIds preserved', () => {
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([
        dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2]),
        dashaEvidence('MD_2H_MIXED', 'MIXED', [2])
      ]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // MIXED is collapsed to PARTIALLY_ACTIVATES
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('PARTIALLY_ACTIVATES');

    // Both rule IDs should be preserved in references
    expect(result.value.dimensions.ACCUMULATION.dashaRuleReferences).toHaveLength(2);
    expect(result.value.dimensions.ACCUMULATION.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_SUPPORT')).toBe(true);
    expect(result.value.dimensions.ACCUMULATION.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_MIXED')).toBe(true);

    // Per-level references should also preserve both rules
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences).toHaveLength(2);
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_SUPPORT')).toBe(true);
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences.some((ref) => ref.ruleId === 'MD_2H_MIXED')).toBe(true);
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

    // Assert MD- and AD-level provenance are preserved
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences).toHaveLength(1);
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences[0].ruleId).toBe('MD_2H_SUPPORT');
    expect(result.value.dimensions.ACCUMULATION.md.dashaRuleReferences[0].level).toBe('MD');

    expect(result.value.dimensions.ACCUMULATION.ad.dashaRuleReferences).toHaveLength(1);
    expect(result.value.dimensions.ACCUMULATION.ad.dashaRuleReferences[0].ruleId).toBe('AD_2H_CHALLENGE');
    expect(result.value.dimensions.ACCUMULATION.ad.dashaRuleReferences[0].level).toBe('AD');
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

    // Assert exact promiseEvidenceIds
    expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toContain('CONFLICTING');
    expect(result.value.dimensions.GAINS.promiseEvidenceIds).toEqual([]);
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

  it('links via house match even when planets also overlap', () => {
    // Dasha evidence targets house 2 AND includes Saturn
    // Promise is in house 2 with Saturn - should link via house
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('MD_2H_SATURN', 'SUPPORT', [2], [Planet.SATURN])]),
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
      expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
    }
  });

  it('does not link via planet overlap alone (houses must match)', () => {
    // Dasha evidence shares Saturn planet but targets house 9 (FORTUNE house)
    // while ACCUMULATION promise is in house 2
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('AD_9H_SATURN', 'SUPPORT', [9], [Planet.SATURN])]),
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Should NOT activate ACCUMULATION - planet overlap alone is insufficient
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
  });

  it('does not link cross-dimension via planet overlap alone', () => {
    // ACCUMULATION promise has Saturn in house 2
    // AD evidence lists Saturn but targets house 11 (GAINS house)
    // Should not link ACCUMULATION via planet overlap (wrong house)
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: makeContext([dashaEvidence('AD_11H_SATURN', 'SUPPORT', [11], [Planet.SATURN])]),
      wealthEvidence: [
        promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN),
        promise('NATAL_GAINS', 'GAINS', 11, Planet.JUPITER)
      ]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // ACCUMULATION should not activate (planet overlap alone, wrong house)
    expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    // GAINS should activate via house match (house 11), regardless of planet
    expect(result.value.dimensions.GAINS.effect).toBe('ACTIVATES');
  });

  it('accepts genuine SelectedPeriodActivationContext from PBA-03 factory', () => {
    // Build a minimal DashaInterpretationReport
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Pushya',
        nakshatraLord: Planet.SATURN,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      confidence: 'HIGH',
      mahadashas: [
        {
          planet: Planet.SATURN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2039-01-01T00:00:00.000Z',
          antardashas: [
            {
              planet: Planet.MERCURY,
              start: '2025-01-01T00:00:00.000Z',
              end: '2027-01-01T00:00:00.000Z',
              evidence: [dashaEvidence('AD_2H_SUPPORT', 'SUPPORT', [2])]
            }
          ],
          evidence: [dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]
        }
      ]
    } as unknown as DashaInterpretationReport;

    // List selectable periods
    const selectable = listSelectableMdAdPeriods(report);
    expect(selectable.mahadashas).toHaveLength(1);
    expect(selectable.antardashas).toHaveLength(1);

    // Create context via PBA-03 factory
    const contextResult = createSelectedPeriodActivationContext({
      report,
      selection: {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      },
      analysisAsOf: '2026-01-01T00:00:00.000Z'
    });

    expect(contextResult.ok).toBe(true);
    if (!contextResult.ok) return;

    // Evaluate with genuine context
    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: contextResult.value,
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
  });

  it('rejects malformed context with interval mismatch', () => {
    // Build a valid context
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Pushya',
        nakshatraLord: Planet.SATURN,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      confidence: 'HIGH',
      mahadashas: [
        {
          planet: Planet.SATURN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2039-01-01T00:00:00.000Z',
          antardashas: [
            {
              planet: Planet.MERCURY,
              start: '2025-01-01T00:00:00.000Z',
              end: '2027-01-01T00:00:00.000Z',
              evidence: []
            }
          ],
          evidence: []
        }
      ]
    } as unknown as DashaInterpretationReport;

    const selectable = listSelectableMdAdPeriods(report);
    const contextResult = createSelectedPeriodActivationContext({
      report,
      selection: {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      },
      analysisAsOf: '2026-01-01T00:00:00.000Z'
    });

    expect(contextResult.ok).toBe(true);
    if (!contextResult.ok) return;

    // Corrupt the interval to mismatch AD node
    const malformedContext = {
      ...contextResult.value,
      interval: { start: '2020-01-01T00:00:00.000Z', end: '2021-01-01T00:00:00.000Z' }
    } as SelectedPeriodActivationContext;

    const result = evaluateSelectedWealthPeriodActivation({
      selectedPeriod: malformedContext,
      wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
    }
  });

  describe('natal-promise phase guard regression tests', () => {
    it('rejects DASHA_ACTIVATION evidence (timing evidence cannot create natal promise)', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
        wealthEvidence: [
          timingEvidence('DASHA_ACC', 'DASHA_ACTIVATION', 'ACCUMULATION', 2, Planet.SATURN)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([]);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    });

    it('rejects TRANSIT_TRIGGER evidence (timing evidence cannot create natal promise)', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
        wealthEvidence: [
          timingEvidence('TRANSIT_ACC', 'TRANSIT_TRIGGER', 'ACCUMULATION', 2, Planet.SATURN)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([]);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    });

    it('rejects VARGA_CONFIRMATION evidence (modifier phase cannot create natal promise)', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
        wealthEvidence: [
          timingEvidence('VARGA_ACC', 'VARGA_CONFIRMATION', 'ACCUMULATION', 2, Planet.SATURN)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([]);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    });

    it('rejects MODIFIER evidence (modifier phase cannot create natal promise)', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
        wealthEvidence: [
          timingEvidence('MODIFIER_ACC', 'MODIFIER', 'ACCUMULATION', 2, Planet.SATURN)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([]);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
    });

    it('only NATAL_PROMISE evidence is accepted for establishing the promise', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]),
        wealthEvidence: [
          timingEvidence('DASHA_ACC', 'DASHA_ACTIVATION', 'ACCUMULATION', 2, Planet.SATURN),
          timingEvidence('TRANSIT_ACC', 'TRANSIT_TRIGGER', 'ACCUMULATION', 2, Planet.SATURN),
          timingEvidence('VARGA_ACC', 'VARGA_CONFIRMATION', 'ACCUMULATION', 2, Planet.SATURN),
          timingEvidence('MODIFIER_ACC', 'MODIFIER', 'ACCUMULATION', 2, Planet.SATURN),
          promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Only NATAL_PROMISE should be in promiseEvidenceIds
      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual(['NATAL_ACC']);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
    });
  });

  describe('defensive validation error handling', () => {
    it('returns INVALID_SELECTED_PERIOD_CONTEXT for malformed context instead of throwing', () => {
      const malformedContext = {
        // Missing required fields
        contextVersion: 'v1',
        dashaSystem: 'VIMSHOTTARI' as const,
        level: 'MD_AD',
        selectedPeriodId: 'pba-period:v1:md-1:ad-1',
        resolverVersion: 'pba-md-ad-resolver-v1',
        analysisAsOf: '2026-01-01T00:00:00.000Z',
        temporalRelation: 'CURRENT',
        intervalSemantics: '[start,end)',
        // Missing interval, mahadasha, antardasha, mahadashaNode, antardashaNode
      } as unknown as SelectedPeriodActivationContext;

      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: malformedContext,
        wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT for null context', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: null as unknown as SelectedPeriodActivationContext,
        wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });

    it('returns INVALID_SELECTED_PERIOD_CONTEXT for context with temporalRelation: undefined', () => {
      const contextWithUndefinedTemporalRelation = makeContext([dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])]);
      // Set temporalRelation to undefined
      (contextWithUndefinedTemporalRelation as any).temporalRelation = undefined;

      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: contextWithUndefinedTemporalRelation,
        wealthEvidence: [promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN)]
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });
  });

  describe('insufficientReason diagnostics (PBA-05)', () => {
    const dimensionTestCases = [
      { dimension: 'ACCUMULATION' as const, house: 2 },
      { dimension: 'GAINS' as const, house: 11 },
      { dimension: 'FORTUNE' as const, house: 9 },
      { dimension: 'SPECULATION' as const, house: 5 }
    ];

    describe.each(dimensionTestCases)('dimension: $dimension (house: $house)', ({ dimension, house }) => {
      it('returns NO_PROMISE_EVIDENCE when no natal promise evidence exists', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [] // No promise evidence
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('NO_PROMISE_EVIDENCE');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toEqual([]);
        expect(result.value.dimensions[dimension].effect).toBe('INSUFFICIENT_DATA');
      });

      it('returns PROMISE_NOT_LINKED when promise exists but no MD/AD linkage', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence('MD_UNRELATED', 'SUPPORT', [8])]), // Wrong house
          wealthEvidence: [promise(`NATAL_${dimension}`, dimension, house, Planet.SATURN)]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('PROMISE_NOT_LINKED');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toContain(`NATAL_${dimension}`);
        expect(result.value.dimensions[dimension].linkedLevels).toEqual([]);
        expect(result.value.dimensions[dimension].effect).toBe('INSUFFICIENT_DATA');
      });

      it('returns LINKED when at least one MD or AD level is linked', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [promise(`NATAL_${dimension}`, dimension, house, Planet.SATURN)]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('LINKED');
        expect(result.value.dimensions[dimension].linkedLevels).toEqual(['MD']);
        expect(result.value.dimensions[dimension].effect).toBe('ACTIVATES');
      });

      it('drops DASHA_ACTIVATION evidence and returns NO_PROMISE_EVIDENCE', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [
            timingEvidence(`DASHA_${dimension}`, 'DASHA_ACTIVATION', dimension, house, Planet.SATURN)
          ]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('NO_PROMISE_EVIDENCE');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toEqual([]);
      });

      it('drops TRANSIT_TRIGGER evidence and returns NO_PROMISE_EVIDENCE', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [
            timingEvidence(`TRANSIT_${dimension}`, 'TRANSIT_TRIGGER', dimension, house, Planet.SATURN)
          ]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('NO_PROMISE_EVIDENCE');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toEqual([]);
      });

      it('drops VARGA_CONFIRMATION evidence and returns NO_PROMISE_EVIDENCE', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [
            timingEvidence(`VARGA_${dimension}`, 'VARGA_CONFIRMATION', dimension, house, Planet.SATURN)
          ]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('NO_PROMISE_EVIDENCE');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toEqual([]);
      });

      it('drops MODIFIER evidence and returns NO_PROMISE_EVIDENCE', () => {
        const result = evaluateSelectedWealthPeriodActivation({
          selectedPeriod: makeContext([dashaEvidence(`MD_${house}H_SUPPORT`, 'SUPPORT', [house])]),
          wealthEvidence: [
            timingEvidence(`MODIFIER_${dimension}`, 'MODIFIER', dimension, house, Planet.SATURN)
          ]
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.value.dimensions[dimension].insufficientReason).toBe('NO_PROMISE_EVIDENCE');
        expect(result.value.dimensions[dimension].promiseEvidenceIds).toEqual([]);
      });
    });

    it('explicit dimension vs house mismatch: only explicit dimension gets populated promiseEvidenceIds', () => {
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

      // ACCUMULATION should match via explicit dimension
      expect(result.value.dimensions.ACCUMULATION.insufficientReason).toBe('PROMISE_NOT_LINKED');
      expect(result.value.dimensions.ACCUMULATION.promiseEvidenceIds).toContain('CONFLICTING');

      // GAINS should not match (explicit dimension is ACCUMULATION, not GAINS)
      expect(result.value.dimensions.GAINS.insufficientReason).toBe('NO_PROMISE_EVIDENCE');
      expect(result.value.dimensions.GAINS.promiseEvidenceIds).toEqual([]);
    });

    it('cross-dimension independence: all four dimensions evaluated independently', () => {
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: makeContext(
          [dashaEvidence('MD_2H_SUPPORT', 'SUPPORT', [2])],
          [dashaEvidence('AD_11H_CHALLENGE', 'CHALLENGE', [11])]
        ),
        wealthEvidence: [
          promise('NATAL_ACC', 'ACCUMULATION', 2, Planet.SATURN),
          promise('NATAL_GAINS', 'GAINS', 11, Planet.MERCURY),
          promise('NATAL_FORTUNE', 'FORTUNE', 9, Planet.JUPITER),
          promise('NATAL_SPEC', 'SPECULATION', 5, Planet.VENUS)
        ]
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // ACCUMULATION: linked via MD house 2
      expect(result.value.dimensions.ACCUMULATION.insufficientReason).toBe('LINKED');
      expect(result.value.dimensions.ACCUMULATION.linkedLevels).toEqual(['MD']);
      expect(result.value.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');

      // GAINS: linked via AD house 11
      expect(result.value.dimensions.GAINS.insufficientReason).toBe('LINKED');
      expect(result.value.dimensions.GAINS.linkedLevels).toEqual(['AD']);
      expect(result.value.dimensions.GAINS.effect).toBe('CHALLENGES');

      // FORTUNE: promise exists but no linkage
      expect(result.value.dimensions.FORTUNE.insufficientReason).toBe('PROMISE_NOT_LINKED');
      expect(result.value.dimensions.FORTUNE.linkedLevels).toEqual([]);
      expect(result.value.dimensions.FORTUNE.effect).toBe('INSUFFICIENT_DATA');

      // SPECULATION: promise exists but no linkage
      expect(result.value.dimensions.SPECULATION.insufficientReason).toBe('PROMISE_NOT_LINKED');
      expect(result.value.dimensions.SPECULATION.linkedLevels).toEqual([]);
      expect(result.value.dimensions.SPECULATION.effect).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Moon Mahadasha → Moon Antardasha GAINS regression', () => {
    it('returns UNKNOWN for Moon/Moon neutral-only evidence (LINKED with both levels)', () => {
      const context = makeContext(
        [dashaEvidence('MOON_MD_GAINS_NEUTRAL', 'NEUTRAL', [11], [Planet.MOON])],
        [dashaEvidence('MOON_AD_GAINS_NEUTRAL', 'NEUTRAL', [11], [Planet.MOON])],
        Planet.MOON,
        Planet.MOON
      );
      const wealthEvidence = [
        promise('NATAL_GAINS_MOON_PROMISE', 'GAINS', 11, Planet.MOON)
      ];
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: context,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.selectedPeriodId).toBe(context.selectedPeriodId);
      expect(context.mahadasha.planet).toBe(Planet.MOON);
      expect(context.antardasha.planet).toBe(Planet.MOON);

      const gains = result.value.dimensions.GAINS;
      expect(gains.effect).toBe('UNKNOWN');
      expect(gains.md.effect).toBe('UNKNOWN');
      expect(gains.ad.effect).toBe('UNKNOWN');
      expect(gains.insufficientReason).toBe('LINKED');
      expect(gains.linkedLevels).toEqual(['MD', 'AD']);
      expect(gains.promiseEvidenceIds).toEqual(['NATAL_GAINS_MOON_PROMISE']);
      expect(gains.md.dashaRuleReferences).toEqual([
        { ruleId: 'MOON_MD_GAINS_NEUTRAL', level: 'MD', source: 'test-fixture' }
      ]);
      expect(gains.ad.dashaRuleReferences).toEqual([
        { ruleId: 'MOON_AD_GAINS_NEUTRAL', level: 'AD', source: 'test-fixture' }
      ]);
      expect(gains.dashaRuleReferences).toEqual([
        { ruleId: 'MOON_MD_GAINS_NEUTRAL', level: 'MD', source: 'test-fixture' },
        { ruleId: 'MOON_AD_GAINS_NEUTRAL', level: 'AD', source: 'test-fixture' }
      ]);
    });

    it('returns PARTIALLY_ACTIVATES for mixed MD-support / AD-challenge (LINKED with both levels)', () => {
      const context = makeContext(
        [dashaEvidence('MOON_MD_GAINS_SUPPORT', 'SUPPORT', [11], [Planet.MOON])],
        [dashaEvidence('MOON_AD_GAINS_CHALLENGE', 'CHALLENGE', [11], [Planet.MOON])],
        Planet.MOON,
        Planet.MOON
      );
      const wealthEvidence = [
        promise('NATAL_GAINS_MOON_PROMISE', 'GAINS', 11, Planet.MOON)
      ];
      const result = evaluateSelectedWealthPeriodActivation({
        selectedPeriod: context,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const gains = result.value.dimensions.GAINS;
      expect(gains.effect).toBe('PARTIALLY_ACTIVATES');
      expect(gains.md.effect).toBe('ACTIVATES');
      expect(gains.ad.effect).toBe('CHALLENGES');
      expect(gains.insufficientReason).toBe('LINKED');
      expect(gains.linkedLevels).toEqual(['MD', 'AD']);
      expect(gains.promiseEvidenceIds).toEqual(['NATAL_GAINS_MOON_PROMISE']);
      expect(gains.md.dashaRuleReferences.map(r => r.ruleId)).toEqual(['MOON_MD_GAINS_SUPPORT']);
      expect(gains.md.dashaRuleReferences.map(r => r.level)).toEqual(['MD']);
      expect(gains.ad.dashaRuleReferences.map(r => r.ruleId)).toEqual(['MOON_AD_GAINS_CHALLENGE']);
      expect(gains.ad.dashaRuleReferences.map(r => r.level)).toEqual(['AD']);
      expect(gains.dashaRuleReferences.map(r => r.ruleId)).toEqual([
        'MOON_MD_GAINS_SUPPORT',
        'MOON_AD_GAINS_CHALLENGE'
      ]);
    });
  });
});
