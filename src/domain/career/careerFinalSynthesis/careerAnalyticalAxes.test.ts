import { describe, expect, it } from 'vitest';
import { buildCareerAnalyticalAxes } from './careerAnalyticalAxes';
import type { CareerNatalAnalysis } from '../careerNatalAnalysis';
import type { CareerDashaCanonicalAnalysis } from '../careerDasha/careerDashaCanonicalTypes';
import type { CareerDashaActivationHierarchy } from '../careerDasha/careerDashaActivationTypes';
import type { CareerD10CanonicalAnalysis } from '../careerD10/careerD10CanonicalTypes';
import type { CareerFinalSynthesisResult, CareerFinalConflict } from './careerFinalSynthesisTypes';
import { Planet } from '../../../types';

function natal(
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE' = 'SUPPORT',
  strength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'MIXED' | 'WEAK' | 'VERY_WEAK' | 'UNDETERMINED' = 'STRONG',
  evidence: readonly object[] = [{
    identityKey: 'natal-semantic-1',
    evidenceId: 'natal-semantic-1',
    ruleId: 'RULE_NATAL_1',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 90,
    weight: 5,
    statement: 'Natal promise evidence.',
    relatedEvidenceIds: [],
    sourceIds: ['raw-natal-source-1']
  }]
): CareerNatalAnalysis {
  return {
    structural: { direction, strength },
    evidence
  } as unknown as CareerNatalAnalysis;
}

function activationEvidence(
  level: 'MD' | 'AD' | 'PD',
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE',
  effect: 'ACTIVATES' | 'PARTIALLY_ACTIVATES' | 'CHALLENGES' | 'DOES_NOT_ACTIVATE' | 'UNKNOWN' | 'INSUFFICIENT_DATA',
  id: string
) {
  return {
    id,
    role: 'ACTIVATION',
    statement: `${level} activation evidence.`,
    planet: Planet.SATURN,
    direction,
    strength: 'STRONG',
    level,
    relatedPlanetIds: [],
    relevanceEvidenceIds: [],
    conditionEvidenceIds: [],
    expressionEvidenceIds: [],
    activationRuleIds: [`RULE_${level}`],
    sourceIds: [`occurrence-${id}`],
    effect
  };
}

function dasha(
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE' = 'SUPPORT',
  hierarchy?: CareerDashaActivationHierarchy,
  evidence: readonly object[] = [{
    identityKey: 'dasha-semantic-1',
    id: 'dasha-occurrence-1',
    level: 'MD',
    planet: Planet.SATURN,
    role: 'PRIMARY_DRIVER',
    effect: 'ACTIVATES',
    direction: 'SUPPORT',
    strength: 'STRONG',
    statement: 'Dasha evidence.',
    sourceIds: ['raw-dasha-source-1'],
    provenance: { source: 'C9_DASHA', activationLevel: 'MD', ruleIds: ['RULE_MD'], natalRootIds: [] }
  }],
  overallStrength: CareerDashaCanonicalAnalysis['overallStrength'] = 'STRONG',
  overallEffect?: CareerDashaCanonicalAnalysis['overallEffect']
): CareerDashaCanonicalAnalysis {
  return {
    overallEffect: overallEffect ?? (direction === 'CHALLENGE' ? 'CHALLENGES' : 'ACTIVATES'),
    overallDirection: direction,
    overallStrength,
    dominantLevel: 'MD',
    evidence,
    hierarchy
  } as unknown as CareerDashaCanonicalAnalysis;
}

function d10(
  evidence: readonly object[] = [{
    identityKey: 'd10-semantic-1',
    id: 'd10-occurrence-1',
    role: 'PRIMARY',
    direction: 'SUPPORT',
    d10Effect: 'REINFORCES',
    d10Strength: 'STRONG',
    weight: 5,
    statement: 'D10 evidence.',
    sourceIds: ['raw-d10-source-1'],
    provenance: { source: 'C10_D10', ruleIds: ['RULE_D10'], sourceIds: ['d10-occurrence-1'], natalRootIds: [] },
    evidenceKind: 'OCCURRENCE'
  }],
  availability: 'AVAILABLE' | 'UNAVAILABLE' = 'AVAILABLE'
): CareerD10CanonicalAnalysis {
  return { availability, evidence } as unknown as CareerD10CanonicalAnalysis;
}

function finalSynthesis(conflicts: readonly CareerFinalConflict[] = []): CareerFinalSynthesisResult {
  return { conflicts } as unknown as CareerFinalSynthesisResult;
}

function period(
  level: 'MD' | 'AD' | 'PD',
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE',
  effect: 'ACTIVATES' | 'PARTIALLY_ACTIVATES' | 'CHALLENGES' | 'DOES_NOT_ACTIVATE' | 'UNKNOWN' | 'INSUFFICIENT_DATA',
  sourceId: string,
  start?: string,
  end?: string
) {
  const usable = direction !== 'UNAVAILABLE' && effect !== 'UNKNOWN' && effect !== 'INSUFFICIENT_DATA';
  return {
    level,
    planet: Planet.SATURN,
    role: level === 'MD' ? 'PRIMARY_DRIVER' : level === 'AD' ? 'MODIFIER' : 'REFINEMENT',
    effect,
    direction,
    strength: usable ? 'STRONG' : 'UNDETERMINED',
    evidence: usable ? [activationEvidence(level, direction, effect, sourceId)] : [],
    statement: `${level} period.`,
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    active: usable,
    activatedPromiseEvidenceIds: ['natal-semantic-1'],
    challengedPromiseEvidenceIds: [],
    expressionEvidenceIds: []
  };
}

function hierarchy(options: {
  md?: ReturnType<typeof period>;
  ad?: ReturnType<typeof period>;
  pd?: ReturnType<typeof period>;
} = {}): CareerDashaActivationHierarchy {
  const md = options.md ?? period('MD', 'SUPPORT', 'ACTIVATES', 'md', '2025-01-01', '2026-01-01');
  const ad = options.ad ?? period('AD', 'SUPPORT', 'ACTIVATES', 'ad', '2025-02-01', '2025-06-01');
  const pd = options.pd ?? period('PD', 'SUPPORT', 'ACTIVATES', 'pd', '2025-03-01', '2025-04-01');
  return {
    md, ad, pd,
    overallEffect: 'ACTIVATES',
    overallDirection: 'SUPPORT',
    overallStrength: 'STRONG',
    dominantLevel: 'MD',
    statement: 'Canonical hierarchy.'
  } as unknown as CareerDashaActivationHierarchy;
}

function build(
  options: {
    natal?: CareerNatalAnalysis;
    dasha?: CareerDashaCanonicalAnalysis;
    d10?: CareerD10CanonicalAnalysis;
    conflicts?: readonly CareerFinalConflict[];
  } = {}
) {
  const natalInput = options.natal ?? natal();
  const dashaInput = options.dasha ?? dasha('SUPPORT', hierarchy());
  const d10Input = options.d10 ?? d10();
  const final = finalSynthesis(options.conflicts);
  return buildCareerAnalyticalAxes({
    natal: natalInput,
    dasha: dashaInput,
    d10: d10Input,
    finalSynthesis: final
  });
}

describe('B01 independent Career analytical axes', () => {
  it('keeps strong promise separate from weak activation strength', () => {
    const axes = build({
      natal: natal('SUPPORT', 'VERY_STRONG'),
      dasha: dasha('SUPPORT', hierarchy(), undefined, 'WEAK', 'PARTIALLY_ACTIVATES')
    });

    expect(axes.promise.result?.strength).toBe('VERY_STRONG');
    expect(axes.activation.result?.strength).toBe('WEAK');
    expect(axes.activation.result?.effect).toBe('PARTIALLY_ACTIVATES');
  });

  it('keeps strong natal promise distinct from weak or challenging activation', () => {
    const axes = build({
      natal: natal('SUPPORT', 'VERY_STRONG'),
      dasha: dasha('CHALLENGE', hierarchy({
        md: period('MD', 'CHALLENGE', 'CHALLENGES', 'md', '2025-01-01', '2026-01-01'),
        ad: period('AD', 'CHALLENGE', 'CHALLENGES', 'ad', '2025-02-01', '2025-06-01'),
        pd: period('PD', 'CHALLENGE', 'CHALLENGES', 'pd', '2025-03-01', '2025-04-01')
      }), [{
        identityKey: 'dasha-semantic-1',
        id: 'dasha-occurrence-1',
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'CHALLENGES',
        direction: 'CHALLENGE',
        strength: 'STRONG',
        statement: 'Dasha challenge evidence.',
        sourceIds: ['raw-dasha-source-1'],
        provenance: { source: 'C9_DASHA', activationLevel: 'MD', ruleIds: ['RULE_MD'], natalRootIds: [] }
      }])
    });

    expect(axes.promise.result).toEqual({ direction: 'SUPPORT', strength: 'VERY_STRONG' });
    expect(axes.promise.supportingEvidenceOccurrenceIds).toContain('raw-natal-source-1');
    expect(axes.promise.supportingEvidenceOccurrenceIds).not.toContain('natal-semantic-1');
    expect(axes.promise.supportingEvidenceOccurrenceIds).not.toContain('natal-semantic-1');
    expect(axes.activation.result?.direction).toBe('CHALLENGE');
    expect(axes.promise.status).toBe('AVAILABLE');
    expect(axes.activation.status).toBe('AVAILABLE');
    expect(axes.activation.conflictingEvidenceOccurrenceIds).toContain('dasha-occurrence-1');
    expect(axes.activation.conflictingEvidenceOccurrenceIds).not.toContain('raw-dasha-source-1');
  });

  it('keeps strong promise while exposing elevated D10 risk as a separate axis', () => {
    const axes = build({
      natal: natal('SUPPORT', 'VERY_STRONG'),
      dasha: dasha('SUPPORT', hierarchy(), [{
        identityKey: 'dasha-limiting-semantic',
        id: 'dasha-limiting-occurrence',
        level: 'MD',
        role: 'PRIMARY_DRIVER',
        effect: 'DOES_NOT_ACTIVATE',
        direction: 'NEUTRAL',
        strength: 'WEAK',
        statement: 'Dasha non-activation is a limiting condition.',
        sourceIds: ['raw-dasha-limiting-source'],
        provenance: { source: 'C9_DASHA', activationLevel: 'MD', ruleIds: ['RULE_DASHA_LIMIT'], natalRootIds: [] }
      }]),
      d10: d10([{
        identityKey: 'd10-semantic-risk',
        id: 'd10-risk-occurrence',
        role: 'PRIMARY',
        direction: 'CHALLENGE',
        d10Effect: 'CONFLICTS',
        d10Strength: 'STRONG',
        weight: 5,
        statement: 'D10 challenge.',
        sourceIds: ['raw-d10-risk-source'],
        provenance: { source: 'C10_D10', ruleIds: ['RULE_D10_RISK'], sourceIds: ['d10-risk-occurrence'], natalRootIds: [] },
        evidenceKind: 'OCCURRENCE'
      }, {
        identityKey: 'd10-weakening-semantic',
        id: 'd10-weakening-occurrence',
        role: 'MODIFIER',
        direction: 'NEUTRAL',
        d10Effect: 'WEAKENS',
        d10Strength: 'WEAK',
        weight: 1,
        statement: 'D10 weakening condition.',
        sourceIds: ['d10-weakening-occurrence'],
        provenance: { source: 'C10_D10', ruleIds: ['RULE_D10_WEAKENS'], sourceIds: ['d10-weakening-occurrence'], natalRootIds: [] },
        evidenceKind: 'OCCURRENCE'
      }])
    });

    expect(axes.promise.result?.strength).toBe('VERY_STRONG');
    expect(axes.risk.result?.assessment).toBe('ADVERSE_EVIDENCE_PRESENT');
    expect(axes.risk.supportingEvidenceOccurrenceIds).toContain('d10-risk-occurrence');
    expect(axes.risk.supportingEvidenceOccurrenceIds).toContain('d10-weakening-occurrence');
    expect(axes.risk.supportingEvidenceOccurrenceIds).toContain('dasha-limiting-occurrence');
  });

  it('marks sustainability unavailable instead of inferring it from promise or D10', () => {
    const axes = build();
    expect(axes.sustainability.status).toBe('UNAVAILABLE');
    expect(axes.sustainability.result?.assessment).toBe('NOT_ASSESSED');
    expect(axes.sustainability.supportingEvidenceOccurrenceIds).toEqual([]);
    expect(axes.sustainability.unavailableReason).toContain('cannot be inferred');
  });

  it('marks timing unavailable when the canonical Dasha hierarchy is absent', () => {
    const axes = build({ dasha: dasha('UNAVAILABLE', undefined, []) });
    expect(axes.timing.status).toBe('UNAVAILABLE');
    expect(axes.timing.result?.candidateWindows).toEqual([]);
  });

  it('marks timing partial when candidate periods are missing source dates or activation levels', () => {
    const axes = build({
      dasha: dasha('SUPPORT', hierarchy({
        md: period('MD', 'SUPPORT', 'ACTIVATES', 'md', undefined, undefined),
        ad: period('AD', 'UNAVAILABLE', 'INSUFFICIENT_DATA', 'ad'),
        pd: period('PD', 'UNAVAILABLE', 'INSUFFICIENT_DATA', 'pd')
      }))
    });
    expect(axes.timing.status).toBe('PARTIAL');
    expect(axes.timing.result?.untimedLevels).toContain('MD');
    expect(axes.timing.result?.candidateWindows).toHaveLength(1);
    expect(axes.timing.result?.candidateWindows[0]?.supportingEvidenceOccurrenceIds).toContain('md');
    expect(axes.timing.result?.candidateWindows[0]?.supportingEvidenceOccurrenceIds).not.toContain('occurrence-md');
  });

  it('marks timing not applicable when all canonical periods are assessed as neutral/non-activating', () => {
    const axes = build({
      dasha: dasha('NEUTRAL', hierarchy({
        md: period('MD', 'NEUTRAL', 'DOES_NOT_ACTIVATE', 'md', '2025-01-01', '2026-01-01'),
        ad: period('AD', 'NEUTRAL', 'DOES_NOT_ACTIVATE', 'ad', '2025-02-01', '2025-06-01'),
        pd: period('PD', 'NEUTRAL', 'DOES_NOT_ACTIVATE', 'pd', '2025-03-01', '2025-04-01')
      }))
    });
    expect(axes.timing.status).toBe('NOT_APPLICABLE');
    expect(axes.timing.coverage.status).toBe('COMPLETE');
    expect(axes.timing.result?.candidateWindows).toEqual([]);
  });

  it('resolves C11 conflict semantic IDs back to occurrence IDs without mixing namespaces', () => {
    const conflict = {
      source: 'D10',
      direction: 'SUPPORT',
      severity: 'HIGH',
      evidenceIds: ['d10-semantic-1'],
      statement: 'D10 support counter-evidence.'
    } as CareerFinalConflict;
    const axes = build({ conflicts: [conflict] });
    expect(axes.risk.conflictingEvidenceOccurrenceIds).toContain('d10-occurrence-1');
    expect(axes.risk.conflictingEvidenceOccurrenceIds).not.toContain('d10-semantic-1');
  });

  it('resolves C11 conflicts within their source namespace when semantic keys collide', () => {
    const natalWithSharedKey = natal('SUPPORT', 'STRONG', [{
      identityKey: 'shared-semantic-key',
      evidenceId: 'shared-semantic-key',
      ruleId: 'RULE_NATAL_SHARED',
      layer: 'PRIMARY_PROMISE',
      direction: 'SUPPORT',
      strength: 'STRONG',
      priority: 80,
      weight: 4,
      statement: 'Natal support.',
      relatedEvidenceIds: [],
      sourceIds: ['natal-source-occurrence']
    }]);
    const d10WithSharedKey = d10([{
      identityKey: 'shared-semantic-key',
      id: 'd10-canonical-occurrence',
      role: 'PRIMARY',
      direction: 'SUPPORT',
      d10Effect: 'REINFORCES',
      d10Strength: 'STRONG',
      weight: 4,
      statement: 'D10 support.',
      sourceIds: ['d10-raw-source'],
      provenance: { source: 'C10_D10', ruleIds: ['RULE_D10_SHARED'], sourceIds: ['d10-raw-source'], natalRootIds: [] },
      evidenceKind: 'OCCURRENCE'
    }]);
    const conflict = {
      source: 'D10',
      direction: 'SUPPORT',
      severity: 'HIGH',
      evidenceIds: ['shared-semantic-key'],
      statement: 'D10 counter-evidence.'
    } as CareerFinalConflict;

    const axes = build({ natal: natalWithSharedKey, d10: d10WithSharedKey, conflicts: [conflict] });
    expect(axes.risk.conflictingEvidenceOccurrenceIds).toContain('d10-canonical-occurrence');
    expect(axes.risk.conflictingEvidenceOccurrenceIds).not.toContain('natal-source-occurrence');
  });

  it('marks risk coverage partial when C11 conflict provenance cannot be resolved to occurrences', () => {
    const conflict = {
      source: 'EXPRESSION',
      direction: 'CHALLENGE',
      severity: 'HIGH',
      evidenceIds: ['expression-semantic-id'],
      statement: 'Expression conflict.'
    } as CareerFinalConflict;
    const axes = build({ conflicts: [conflict] });

    expect(axes.risk.status).toBe('PARTIAL');
    expect(axes.risk.coverage.missingSources)
      .toContain('C11_EXPRESSION_CONFLICT_OCCURRENCE_MAPPING');
    expect(axes.risk.conflictingEvidenceOccurrenceIds).toEqual([]);
  });

  it('exposes all currently supported axes without manufacturing sustainability', () => {
    const axes = build();
    expect(axes.promise.status).toBe('AVAILABLE');
    expect(axes.activation.status).toBe('AVAILABLE');
    expect(axes.risk.status).toBe('AVAILABLE');
    expect(axes.timing.status).toBe('AVAILABLE');
    expect(axes.sustainability.status).toBe('UNAVAILABLE');
  });

  it('does not create a probability or alter the C11 conclusion contract', () => {
    const axes = build();
    expect(axes.timing.result?.guarantee).toBe('NONE');
    expect(axes).not.toHaveProperty('probability');
    expect(axes).not.toHaveProperty('finalStatus');
    expect(axes).not.toHaveProperty('finalDirection');
  });
});
