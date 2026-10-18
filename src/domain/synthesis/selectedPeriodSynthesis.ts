import type {
  SelectedPeriodActivationContext
} from '../../core/analysis';

import {
  validateSelectedPeriodContext
} from '../../core/analysis';

import type {
  SelectedExpressionActivation,
  SelectedCareerDashaActivationSuccess
} from '../career/careerDasha/selectedCareerDashaActivation';

import type {
  SelectedWealthPeriodActivation
} from '../wealth/selectedWealthDashaActivation';

import type {
  DomainEvidence
} from '../interpretation/DomainEvidence';

import type {
  TimingActivationEffect
} from '../interpretation/DomainInterpretationTypes';

import type {
  WealthDimension
} from '../wealth/wealthTypes';

import type {
  CareerFinalSynthesisResult
} from '../career/careerFinalSynthesis/careerFinalSynthesisTypes';

import type {
  CareerWealthFinalSynthesis
} from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';

/**
 * Input for building selected-period synthesis.
 *
 * Pure additive synthesis: projects selected-period activations onto baselines without mutation.
 */
export interface BuildSelectedPeriodSynthesisInput<TCareerBaseline, TWealthBaseline> {
  readonly selectedPeriod: SelectedPeriodActivationContext;
  readonly careerActivation?: SelectedCareerDashaActivationSuccess;
  readonly wealthActivation?: SelectedWealthPeriodActivation;
  readonly careerEvidence?: readonly DomainEvidence[];
  readonly wealthEvidence?: readonly DomainEvidence[];
  readonly careerBaseline?: TCareerBaseline;
  readonly wealthBaseline?: TWealthBaseline;
}

/**
 * Evidence reference in the synthesis result.
 *
 * Classification is based on explicit source polarity/effect only.
 * Mixed evidence stays MIXED (maps to PARTIALLY_ACTIVATES in status).
 *
 * Provenance tracking:
 * - stage: Distinguishes high-level domain (CAREER/WEALTH)
 * - provenanceStage: For CAREER, distinguishes source stage (EXPRESSION/QUALIFICATION/ACTIVATION)
 * - referenceKind: Distinguishes evidence-based vs rule-based references (EVIDENCE/RULE)
 */
export interface SynthesisEvidenceReference {
  readonly classification: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED';
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly dimension?: WealthDimension;
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly source?: string;
  readonly ruleId?: string;
  readonly stage: 'CAREER' | 'WEALTH';
  readonly provenanceStage?: 'CAREER_EXPRESSION' | 'CAREER_QUALIFICATION' | 'CAREER_ACTIVATION' | 'WEALTH_NATAL_PROMISE' | 'WEALTH_DASHA_RULE';
  readonly referenceKind?: 'EVIDENCE' | 'RULE';
}

/**
 * Missing input diagnostic.
 */
export interface SynthesisMissingInput {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly code: string;
  readonly description: string;
}

/**
 * Provenance tracking per analysis stage.
 */
export interface SynthesisProvenance {
  readonly career: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
    readonly qualificationBasis?: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  };
  readonly wealth: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
  };
}

/**
 * Career section in the synthesis result.
 */
export interface SynthesisCareerSection {
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly expressions: readonly SynthesisCareerExpressionRow[];
  readonly diagnostics: readonly SynthesisDiagnostic[];
}

/**
 * Career expression row in the synthesis result.
 *
 * Status is derived from explicit C9 MD/AD activation effects across linkedLevels.
 * matchBasis is omitted if the PBA-04 row type lacks the field.
 *
 * Full PBA-04 traceability: all evidence ID collections are carried through verbatim.
 * Status is a C9 activation derivation conditioned on the row's qualification basis —
 * activation never creates natal promise.
 */
export interface SynthesisCareerExpressionRow {
  readonly expressionRefKey: string;
  readonly status: TimingActivationEffect;
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION';
  readonly matchBasis?: 'UNAMBIGUOUS' | 'AMBIGUOUS';
  readonly diagnostics: readonly SynthesisDiagnostic[];
  readonly expressionEvidenceIds: readonly string[];
  readonly qualifiedEvidenceIds: readonly string[];
  readonly unqualifiedEvidenceIds: readonly string[];
  readonly mdDashaEvidenceIds: readonly string[];
  readonly adDashaEvidenceIds: readonly string[];
  readonly expressionSource: 'CALLER' | 'ADAPTER_FALLBACK';
}

/**
 * Diagnostic attached to a synthesis row.
 */
export interface SynthesisDiagnostic {
  readonly code: string;
  readonly message: string;
}

/**
 * Wealth section in the synthesis result.
 */
export interface SynthesisWealthSection {
  readonly dimensions: Readonly<Record<WealthDimension, SynthesisWealthDimensionRow>>;
  readonly diagnostics: readonly SynthesisDiagnostic[];
}

/**
 * Wealth dimension row in the synthesis result.
 *
 * Effect is preserved verbatim from PBA-05 dimension effect.
 * dataStatus describes input availability only, never a composite score.
 */
export interface SynthesisWealthDimensionRow {
  readonly dimension: WealthDimension;
  readonly effect: TimingActivationEffect;
  readonly dataStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  readonly diagnostics: readonly SynthesisDiagnostic[];
}

/**
 * Selected-period synthesis result.
 *
 * Discriminated union: invalid context returns error, valid context returns value.
 */
export type SelectedPeriodSynthesisResult<TCareerBaseline, TWealthBaseline> =
  | { readonly ok: false; readonly error: 'INVALID_SELECTED_PERIOD_CONTEXT' | 'ACTIVATION_PERIOD_MISMATCH' }
  | { readonly ok: true; readonly value: SelectedPeriodSynthesisValue<TCareerBaseline, TWealthBaseline> };

/**
 * Successful synthesis result.
 */
export interface SelectedPeriodSynthesisValue<TCareerBaseline, TWealthBaseline> {
  readonly synthesisVersion: 'PBA-06-v1';
  readonly period: {
    readonly selectedPeriodId: string;
    readonly mahadashaId: string;
    readonly mahadashaPlanet: string;
    readonly antardashaId: string;
    readonly antardashaPlanet: string;
    readonly interval: { readonly start: string; readonly end: string };
    readonly analysisAsOf: string;
    readonly temporalRelation: 'PAST' | 'CURRENT' | 'FUTURE';
  };
  readonly natalBaseline: {
    readonly career?: {
      readonly baseline: TCareerBaseline;
      readonly unchanged: true;
    };
    readonly wealth?: {
      readonly baseline: TWealthBaseline;
      readonly unchanged: true;
    };
  };
  readonly career: SynthesisCareerSection;
  readonly wealth: SynthesisWealthSection;
  readonly evidence: readonly SynthesisEvidenceReference[];
  readonly missingInputs: readonly SynthesisMissingInput[];
  readonly provenance: SynthesisProvenance;
}

/**
 * Derives career status from C9 MD/AD activation effects across linkedLevels.
 *
 * Status table:
 * - Empty rows/no result → INSUFFICIENT_DATA (never DOES_NOT_ACTIVATE)
 * - Support-only → ACTIVATES
 * - Challenge-only → CHALLENGES
 * - Partial or support+challenge → PARTIALLY_ACTIVATES
 * - Explicit non-activation only → DOES_NOT_ACTIVATE
 * - Neutral/indeterminate → UNKNOWN
 */
function deriveCareerStatus(
  mdEffect: TimingActivationEffect,
  adEffect: TimingActivationEffect,
  linkedLevels: readonly ('MD' | 'AD')[]
): TimingActivationEffect {
  if (linkedLevels.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const effects: TimingActivationEffect[] = [];
  if (linkedLevels.includes('MD')) {
    effects.push(mdEffect);
  }
  if (linkedLevels.includes('AD')) {
    effects.push(adEffect);
  }

  // Check for explicit non-activation
  if (effects.every(e => e === 'DOES_NOT_ACTIVATE')) {
    return 'DOES_NOT_ACTIVATE';
  }

  // Check for support-only
  if (effects.every(e => e === 'ACTIVATES')) {
    return 'ACTIVATES';
  }

  // Check for challenge-only
  if (effects.every(e => e === 'CHALLENGES')) {
    return 'CHALLENGES';
  }

  // Check for partial or mixed
  if (effects.some(e => e === 'PARTIALLY_ACTIVATES') ||
    (effects.some(e => e === 'ACTIVATES') && effects.some(e => e === 'CHALLENGES'))) {
    return 'PARTIALLY_ACTIVATES';
  }

  // Neutral/indeterminate
  return 'UNKNOWN';
}

/**
 * Resolves wealth data status from input availability.
 *
 * Describes input availability only, never a composite score.
 */
function deriveWealthDataStatus(
  hasActivation: boolean,
  hasEvidence: boolean
): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
  if (hasActivation && hasEvidence) {
    return 'COMPLETE';
  }
  if (hasActivation || hasEvidence) {
    return 'PARTIAL';
  }
  return 'INSUFFICIENT_DATA';
}

/**
 * Classifies evidence based on explicit source polarity/effect.
 *
 * Only explicit source polarity/effect is used.
 * Mixed stays MIXED (maps to PARTIALLY_ACTIVATES per PBA-05 semantics).
 * Unqualified evidence IDs are NOT challenging.
 * Missing/ambiguous → UNRESOLVED.
 */
function classifyEvidence(evidence: DomainEvidence): 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED' {
  if (evidence.polarity === 'SUPPORTING') {
    return 'SUPPORTING';
  }
  if (evidence.polarity === 'CHALLENGING') {
    return 'CHALLENGING';
  }
  if (evidence.polarity === 'NEUTRAL') {
    return 'NEUTRAL';
  }
  return 'UNRESOLVED';
}

/**
 * Resolves wealth promise evidence references.
 *
 * Resolves promiseEvidenceIds against the provided wealthEvidence to build
 * WEALTH_NATAL_PROMISE references with existing id/identityKey/dimension/polarity.
 * Unresolvable IDs → UNRESOLVED + EVIDENCE_REFERENCE_UNRESOLVED diagnostic.
 *
 * Validates dimension consistency: mismatch → diagnostic, preserves requested dimension.
 * Returns both resolved references and any unresolved IDs for diagnostic generation.
 */
function resolveWealthPromiseEvidenceReferences(
  promiseEvidenceIds: readonly string[],
  wealthEvidence: readonly DomainEvidence[],
  requestingDimension: WealthDimension
): { readonly references: readonly SynthesisEvidenceReference[]; readonly unresolvedIds: readonly string[] } {
  const evidenceMap = new Map<string, DomainEvidence>();
  const duplicateCheck = new Set<string>();
  const duplicateIds: string[] = [];

  for (const e of wealthEvidence) {
    if (evidenceMap.has(e.id)) {
      duplicateIds.push(e.id);
    }
    evidenceMap.set(e.id, e);
  }

  const references: SynthesisEvidenceReference[] = [];
  const unresolvedIds: string[] = [];

  for (const id of promiseEvidenceIds) {
    const evidence = evidenceMap.get(id);
    if (evidence) {
      const dimensionMismatch = evidence.dimension !== undefined && evidence.dimension !== requestingDimension;
      references.push(Object.freeze({
        classification: classifyEvidence(evidence),
        evidenceId: evidence.id,
        identityKey: evidence.identityKey,
        dimension: dimensionMismatch ? requestingDimension : evidence.dimension,
        polarity: evidence.polarity,
        source: evidence.source,
        ruleId: evidence.ruleId,
        stage: 'WEALTH' as const,
        provenanceStage: 'WEALTH_NATAL_PROMISE' as const,
        referenceKind: 'EVIDENCE' as const
      }));
    } else {
      references.push(Object.freeze({
        classification: 'UNRESOLVED',
        evidenceId: id,
        stage: 'WEALTH' as const,
        provenanceStage: 'WEALTH_NATAL_PROMISE' as const,
        referenceKind: 'EVIDENCE' as const
      }));
      unresolvedIds.push(id);
    }
  }

  return Object.freeze({
    references: Object.freeze(references.sort((a, b) => {
      if (a.classification !== b.classification) return a.classification.localeCompare(b.classification);
      if (a.evidenceId !== b.evidenceId) return (a.evidenceId ?? '').localeCompare(b.evidenceId ?? '');
      return 0;
    })),
    unresolvedIds: Object.freeze(unresolvedIds)
  });
}

/**
 * Builds selected-period synthesis.
 *
 * Pure additive synthesis: projects selected-period activations onto baselines without mutation.
 * Does not invoke interpreters, Dasha resolvers, or horoscope calculation.
 *
 * Result structures are shallow-frozen; inputs are never mutated.
 *
 * @param input - The input containing selected period, activations, evidence, and baselines
 * @returns Discriminated result: error on invalid context or activation period mismatch, value on success
 */
export function buildSelectedPeriodSynthesis<TCareerBaseline, TWealthBaseline>(
  input: BuildSelectedPeriodSynthesisInput<TCareerBaseline, TWealthBaseline>
): SelectedPeriodSynthesisResult<TCareerBaseline, TWealthBaseline> {
  const { selectedPeriod, careerActivation, wealthActivation, careerEvidence, wealthEvidence, careerBaseline, wealthBaseline } = input;

  // Validate selected-period context
  if (!validateSelectedPeriodContext(selectedPeriod)) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD_CONTEXT' };
  }

  // Validate activation-context consistency (Medium-6)
  if (careerActivation) {
    if (careerActivation.selectedPeriodId !== selectedPeriod.selectedPeriodId ||
      careerActivation.interval.start !== selectedPeriod.interval.start ||
      careerActivation.interval.end !== selectedPeriod.interval.end ||
      careerActivation.temporalRelation !== selectedPeriod.temporalRelation) {
      return { ok: false, error: 'ACTIVATION_PERIOD_MISMATCH' };
    }
  }
  if (wealthActivation) {
    if (wealthActivation.selectedPeriodId !== selectedPeriod.selectedPeriodId ||
      wealthActivation.interval.start !== selectedPeriod.interval.start ||
      wealthActivation.interval.end !== selectedPeriod.interval.end ||
      wealthActivation.temporalRelation !== selectedPeriod.temporalRelation) {
      return { ok: false, error: 'ACTIVATION_PERIOD_MISMATCH' };
    }
  }

  // Build period section (verbatim copy)
  const period = Object.freeze({
    selectedPeriodId: selectedPeriod.selectedPeriodId,
    mahadashaId: selectedPeriod.mahadasha.id,
    mahadashaPlanet: selectedPeriod.mahadasha.planet,
    antardashaId: selectedPeriod.antardasha.id,
    antardashaPlanet: selectedPeriod.antardasha.planet,
    interval: Object.freeze({
      start: selectedPeriod.interval.start,
      end: selectedPeriod.interval.end
    }),
    analysisAsOf: selectedPeriod.analysisAsOf,
    temporalRelation: selectedPeriod.temporalRelation
  });

  // Build natal baseline (carry by reference with unchanged flags)
  const natalBaseline = Object.freeze({
    ...(careerBaseline !== undefined ? {
      career: Object.freeze({
        baseline: careerBaseline,
        unchanged: true as const
      })
    } : {}),
    ...(wealthBaseline !== undefined ? {
      wealth: Object.freeze({
        baseline: wealthBaseline,
        unchanged: true as const
      })
    } : {})
  });

  // Build career section
  const careerDiagnostics: SynthesisDiagnostic[] = [];
  let careerQualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE' = 'CANONICAL_STATUS';
  const careerExpressions: SynthesisCareerExpressionRow[] = [];

  if (careerActivation) {
    careerQualificationBasis = careerActivation.qualificationBasis;

    if (careerQualificationBasis === 'PROXY_DIRECTION') {
      careerDiagnostics.push(Object.freeze({
        code: 'CAREER_QUALIFICATION_UNAVAILABLE',
        message: 'Career qualification used PROXY_DIRECTION interim contract; canonical C11 qualification unavailable'
      }));
    }

    for (const exprActivation of careerActivation.expressionActivations) {
      const mdEffect = exprActivation.activation.mdActivation.effect;
      const adEffect = exprActivation.activation.adActivation.effect;
      const status = deriveCareerStatus(mdEffect, adEffect, exprActivation.linkedLevels);

      const rowDiagnostics: SynthesisDiagnostic[] = [];
      if (exprActivation.expressionSource === 'ADAPTER_FALLBACK') {
        rowDiagnostics.push(Object.freeze({
          code: 'EXPRESSION_SOURCE_ADAPTER_FALLBACK',
          message: 'Expression derived from adapter fallback; no reliable mapping to caller expressions'
        }));
      }

      const row: SynthesisCareerExpressionRow = Object.freeze({
        expressionRefKey: exprActivation.expressionRefKey,
        status,
        linkedLevels: exprActivation.linkedLevels,
        qualificationBasis: careerQualificationBasis,
        // Omit matchBasis if the PBA-04 row type lacks the field
        ...(exprActivation.matchBasis !== undefined ? { matchBasis: exprActivation.matchBasis } : {}),
        diagnostics: Object.freeze(rowDiagnostics),
        // Full PBA-04 traceability (High-4)
        expressionEvidenceIds: exprActivation.expressionEvidenceIds,
        qualifiedEvidenceIds: exprActivation.qualifiedEvidenceIds,
        unqualifiedEvidenceIds: exprActivation.unqualifiedEvidenceIds,
        mdDashaEvidenceIds: exprActivation.mdDashaEvidenceIds,
        adDashaEvidenceIds: exprActivation.adDashaEvidenceIds,
        expressionSource: exprActivation.expressionSource
      });

      careerExpressions.push(row);
    }
  } else {
    careerQualificationBasis = 'UNAVAILABLE';
    careerDiagnostics.push(Object.freeze({
      code: 'CAREER_ACTIVATION_MISSING',
      message: 'Career activation not provided'
    }));
  }

  const careerSection: SynthesisCareerSection = Object.freeze({
    qualificationBasis: careerQualificationBasis,
    expressions: Object.freeze(careerExpressions.sort((a, b) =>
      a.expressionRefKey.localeCompare(b.expressionRefKey)
    )),
    diagnostics: Object.freeze(careerDiagnostics)
  });

  // Build wealth section
  const wealthDiagnostics: SynthesisDiagnostic[] = [];
  const wealthDimensions: Record<WealthDimension, SynthesisWealthDimensionRow> = {
    ACCUMULATION: Object.freeze({
      dimension: 'ACCUMULATION',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      diagnostics: Object.freeze([])
    }),
    GAINS: Object.freeze({
      dimension: 'GAINS',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      diagnostics: Object.freeze([])
    }),
    FORTUNE: Object.freeze({
      dimension: 'FORTUNE',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      diagnostics: Object.freeze([])
    }),
    SPECULATION: Object.freeze({
      dimension: 'SPECULATION',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      diagnostics: Object.freeze([])
    })
  };

  if (wealthActivation) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];

      // Honest dataStatus (High-3): compute from successfully resolved promise refs
      let hasResolvedEvidence = false;
      if (wealthEvidence && dimActivation.promiseEvidenceIds.length > 0) {
        const evidenceMap = new Map<string, DomainEvidence>();
        for (const e of wealthEvidence) {
          evidenceMap.set(e.id, e);
        }
        for (const id of dimActivation.promiseEvidenceIds) {
          const evidence = evidenceMap.get(id);
          if (evidence && (evidence.dimension === undefined || evidence.dimension === dim)) {
            hasResolvedEvidence = true;
            break;
          }
        }
      }

      const dataStatus = deriveWealthDataStatus(
        dimActivation.linkedLevels.length > 0,
        hasResolvedEvidence
      );

      const dimDiagnostics: SynthesisDiagnostic[] = [];
      if (dimActivation.effect === 'INSUFFICIENT_DATA' && dataStatus === 'COMPLETE') {
        dimDiagnostics.push(Object.freeze({
          code: 'WEALTH_DIMENSION_INSUFFICIENT_DESPITE_COMPLETE_INPUT',
          message: `Wealth dimension ${dim} has complete input but insufficient activation data`
        }));
      }

      wealthDimensions[dim] = Object.freeze({
        dimension: dim,
        effect: dimActivation.effect,
        dataStatus,
        linkedLevels: dimActivation.linkedLevels,
        diagnostics: Object.freeze(dimDiagnostics)
      });
    }
  } else {
    wealthDiagnostics.push(Object.freeze({
      code: 'WEALTH_ACTIVATION_MISSING',
      message: 'Wealth activation not provided'
    }));
  }

  const wealthSection: SynthesisWealthSection = Object.freeze({
    dimensions: Object.freeze(wealthDimensions),
    diagnostics: Object.freeze(wealthDiagnostics)
  });

  // Build evidence references
  const evidenceReferences: SynthesisEvidenceReference[] = [];
  const careerUnresolvedIds: string[] = [];
  const wealthUnresolvedIds: Array<{ readonly dimension: WealthDimension; readonly id: string }> = [];

  // Career evidence references with stage-specific provenance (High-1)
  if (careerActivation && careerEvidence) {
    const evidenceMap = new Map<string, DomainEvidence>();
    for (const e of careerEvidence) {
      evidenceMap.set(e.id, e);
    }

    for (const exprActivation of careerActivation.expressionActivations) {
      // EXPRESSION stage: from expressionEvidenceIds
      for (const id of exprActivation.expressionEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          evidenceReferences.push(Object.freeze({
            classification: classifyEvidence(evidence),
            evidenceId: evidence.id,
            identityKey: evidence.identityKey,
            polarity: evidence.polarity,
            source: evidence.source,
            ruleId: evidence.ruleId,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_EXPRESSION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        } else {
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_EXPRESSION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        }
      }

      // QUALIFICATION stage: from qualifiedEvidenceIds and unqualifiedEvidenceIds
      for (const id of exprActivation.qualifiedEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          evidenceReferences.push(Object.freeze({
            classification: classifyEvidence(evidence),
            evidenceId: evidence.id,
            identityKey: evidence.identityKey,
            polarity: evidence.polarity,
            source: evidence.source,
            ruleId: evidence.ruleId,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_QUALIFICATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        } else {
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_QUALIFICATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        }
      }

      for (const id of exprActivation.unqualifiedEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          evidenceReferences.push(Object.freeze({
            classification: classifyEvidence(evidence),
            evidenceId: evidence.id,
            identityKey: evidence.identityKey,
            polarity: evidence.polarity,
            source: evidence.source,
            ruleId: evidence.ruleId,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_QUALIFICATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        } else {
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_QUALIFICATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        }
      }

      // ACTIVATION stage: from mdDashaEvidenceIds and adDashaEvidenceIds
      for (const id of exprActivation.mdDashaEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          evidenceReferences.push(Object.freeze({
            classification: classifyEvidence(evidence),
            evidenceId: evidence.id,
            identityKey: evidence.identityKey,
            polarity: evidence.polarity,
            source: evidence.source,
            ruleId: evidence.ruleId,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        } else {
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        }
      }

      for (const id of exprActivation.adDashaEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          evidenceReferences.push(Object.freeze({
            classification: classifyEvidence(evidence),
            evidenceId: evidence.id,
            identityKey: evidence.identityKey,
            polarity: evidence.polarity,
            source: evidence.source,
            ruleId: evidence.ruleId,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        } else {
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
        }
      }
    }
  }

  // Wealth promise evidence references with stage-specific provenance
  if (wealthActivation && wealthEvidence) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];
      const { references, unresolvedIds } = resolveWealthPromiseEvidenceReferences(
        dimActivation.promiseEvidenceIds,
        wealthEvidence,
        dim
      );
      for (const ref of references) {
        evidenceReferences.push(ref);
      }
      for (const id of unresolvedIds) {
        wealthUnresolvedIds.push({ dimension: dim, id });
      }
    }
  }

  // Wealth dasha rule references with proper classification (High-1)
  if (wealthActivation) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];
      for (const ruleRef of dimActivation.dashaRuleReferences) {
        evidenceReferences.push(Object.freeze({
          classification: 'NEUTRAL', // Rule references are neutral, not UNRESOLVED
          ruleId: ruleRef.ruleId,
          source: ruleRef.source,
          stage: 'WEALTH' as const,
          provenanceStage: 'WEALTH_DASHA_RULE' as const,
          referenceKind: 'RULE' as const
        }));
      }
    }
  }

  // Sort evidence references
  const sortedEvidenceReferences = Object.freeze(evidenceReferences.sort((a, b) => {
    if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
    if (a.provenanceStage !== b.provenanceStage) return (a.provenanceStage ?? '').localeCompare(b.provenanceStage ?? '');
    if (a.dimension !== b.dimension) return (a.dimension ?? '').localeCompare(b.dimension ?? '');
    if (a.classification !== b.classification) return a.classification.localeCompare(b.classification);
    if (a.evidenceId !== b.evidenceId) return (a.evidenceId ?? '').localeCompare(b.evidenceId ?? '');
    if (a.ruleId !== b.ruleId) return (a.ruleId ?? '').localeCompare(b.ruleId ?? '');
    if (a.source !== b.source) return (a.source ?? '').localeCompare(b.source ?? '');
    return 0;
  }));

  // Build missing inputs
  const missingInputs: SynthesisMissingInput[] = [];
  if (!careerActivation) {
    missingInputs.push(Object.freeze({
      domain: 'CAREER',
      code: 'CAREER_ACTIVATION_MISSING',
      description: 'Career activation not provided'
    }));
  }
  if (!wealthActivation) {
    missingInputs.push(Object.freeze({
      domain: 'WEALTH',
      code: 'WEALTH_ACTIVATION_MISSING',
      description: 'Wealth activation not provided'
    }));
  }
  if (!careerEvidence && careerActivation) {
    missingInputs.push(Object.freeze({
      domain: 'CAREER',
      code: 'CAREER_EVIDENCE_MISSING',
      description: 'Career evidence not provided despite activation'
    }));
  }
  if (!wealthEvidence && wealthActivation) {
    missingInputs.push(Object.freeze({
      domain: 'WEALTH',
      code: 'WEALTH_EVIDENCE_MISSING',
      description: 'Wealth evidence not provided despite activation'
    }));
  }

  // Add missing-input entries for unresolved evidence references (High-2)
  for (const id of careerUnresolvedIds) {
    missingInputs.push(Object.freeze({
      domain: 'CAREER',
      code: 'EVIDENCE_REFERENCE_UNRESOLVED',
      description: `Career evidence reference unresolved: ${id}`
    }));
  }
  for (const { dimension, id } of wealthUnresolvedIds) {
    missingInputs.push(Object.freeze({
      domain: 'WEALTH',
      code: 'EVIDENCE_REFERENCE_UNRESOLVED',
      description: `Wealth evidence reference unresolved for dimension ${dimension}: ${id}`
    }));
  }

  // Add missing-input entries for absent baselines (contract gaps)
  if (!careerBaseline) {
    missingInputs.push(Object.freeze({
      domain: 'CAREER',
      code: 'BASELINE_CAREER_UNAVAILABLE',
      description: 'Career baseline not provided'
    }));
  }
  if (!wealthBaseline) {
    missingInputs.push(Object.freeze({
      domain: 'WEALTH',
      code: 'BASELINE_WEALTH_UNAVAILABLE',
      description: 'Wealth baseline not provided'
    }));
  }

  const sortedMissingInputs = Object.freeze(missingInputs.sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.code.localeCompare(b.code);
  }));

  // Build provenance
  const provenance: SynthesisProvenance = Object.freeze({
    career: Object.freeze({
      status: careerActivation ? 'PRESENT' : 'MISSING',
      version: careerActivation ? 'PBA-04-v1' : undefined,
      qualificationBasis: careerActivation ? careerActivation.qualificationBasis : 'UNAVAILABLE'
    }),
    wealth: Object.freeze({
      status: wealthActivation ? 'PRESENT' : 'MISSING',
      version: wealthActivation ? 'PBA-05-v1' : undefined
    })
  });

  // Build final result
  const value: SelectedPeriodSynthesisValue<TCareerBaseline, TWealthBaseline> = Object.freeze({
    synthesisVersion: 'PBA-06-v1',
    period,
    natalBaseline,
    career: careerSection,
    wealth: wealthSection,
    evidence: sortedEvidenceReferences,
    missingInputs: sortedMissingInputs,
    provenance
  });

  return { ok: true, value };
}
