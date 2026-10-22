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
  readonly careerDashaEvidence?: readonly DomainEvidence[];
  readonly careerBaseline?: TCareerBaseline;
  readonly wealthBaseline?: TWealthBaseline;
  readonly careerErrorCode?: 'INVALID_SELECTED_PERIOD_CONTEXT' | 'INCOMPLETE_CANONICAL_INPUT';
  readonly wealthErrorCode?: 'INVALID_SELECTED_PERIOD_CONTEXT';
}

/**
 * Evidence reference in the synthesis result.
 *
 * Classification is based on explicit source polarity/effect only.
 * Mixed evidence stays MIXED (maps to PARTIALLY_ACTIVATES in status).
 * For RULE references (referenceKind: 'RULE'), classification and polarity are omitted.
 *
 * Provenance tracking:
 * - stage: Distinguishes high-level domain (CAREER/WEALTH)
 * - provenanceStage: For CAREER, distinguishes source stage (EXPRESSION/QUALIFICATION/ACTIVATION)
 * - referenceKind: Distinguishes evidence-based vs rule-based references (EVIDENCE/RULE)
 */
export interface SynthesisEvidenceReference {
  readonly classification?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED';
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly dimension?: WealthDimension;
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly source?: string;
  readonly ruleId?: string;
  readonly level?: 'MD' | 'AD';
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
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
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
 * promiseEvidenceIds and dashaRuleReferences are preserved verbatim from PBA-05 activation
 * for evidence parity with the AI context projection.
 * insufficientReason is preserved verbatim from PBA-05 activation for diagnostics (PBA-05).
 */
export interface SynthesisWealthDimensionRow {
  readonly dimension: WealthDimension;
  readonly effect: TimingActivationEffect;
  readonly dataStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  readonly diagnostics: readonly SynthesisDiagnostic[];
  readonly promiseEvidenceIds: readonly string[];
  readonly dashaRuleReferences: readonly {
    readonly ruleId: string;
    readonly source: string;
    readonly level: 'MD' | 'AD';
  }[];
  readonly insufficientReason: 'NO_PROMISE_EVIDENCE' | 'PROMISE_NOT_LINKED' | 'LINKED';
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
 * Resolves wealth data status from input availability, evidence resolution, and activation effect.
 *
 * COMPLETE requires:
 * - ALL promiseEvidenceIds to resolve to valid WEALTH NATAL_PROMISE evidence with compatible/absent dimension (Medium-6)
 * - A determinate activation effect (ACTIVATES, CHALLENGES, PARTIALLY_ACTIVATES, or DOES_NOT_ACTIVATE)
 *
 * PARTIAL is returned when:
 * - Input is complete but effect is UNKNOWN or INSUFFICIENT_DATA (indeterminate effect)
 * - Input is partially resolved (some promise IDs unresolved)
 * - Activation exists but no promise evidence
 *
 * INSUFFICIENT_DATA is returned when no activation and no promise evidence.
 */
function deriveWealthDataStatus(
  hasActivation: boolean,
  resolvedCount: number,
  totalCount: number,
  effect: TimingActivationEffect
): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
  if (!hasActivation && totalCount === 0) {
    return 'INSUFFICIENT_DATA';
  }
  if (hasActivation && totalCount === 0) {
    return 'PARTIAL';
  }
  if (totalCount > 0 && resolvedCount === totalCount) {
    // Input is complete; gate COMPLETE on determinate effect
    if (effect === 'UNKNOWN' || effect === 'INSUFFICIENT_DATA') {
      return 'PARTIAL';
    }
    return 'COMPLETE';
  }
  return 'PARTIAL';
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
 * Validates whether evidence is a valid WEALTH NATAL_PROMISE record.
 *
 * Checks domain and phase only (not dimension - dimension is checked separately).
 * Invalid domain/phase → should emit UNRESOLVED ref + WEALTH_EVIDENCE_INVALID diagnostic.
 */
function isValidWealthPromiseEvidence(evidence: DomainEvidence): boolean {
  return (
    evidence.domain === 'WEALTH' &&
    evidence.phase === 'NATAL_PROMISE'
  );
}

/**
 * Compares two evidence records field-by-field for duplicate detection.
 *
 * Returns true if all semantically relevant fields are identical. Identical duplicates are
 * deduplicated silently (first occurrence kept). Differing duplicates trigger EVIDENCE_ID_AMBIGUOUS.
 *
 * Semantically relevant fields compared:
 * - id, domain, phase, dimension, polarity, house, planet, ruleId (structural identity)
 * - identityKey, source, sourceType, role, statement, strength, priority (content identity)
 * - manifestationRuleIds (rule attachment identity)
 * - timing (structural comparison of period/level/planet fields)
 *
 * Fields intentionally excluded from duplicate identity:
 * - relatedEvidenceIds: Source provenance - two records can be semantically identical even if
 *   derived from different upstream evidence sources
 * - notes: Free-form commentary that does not affect the semantic meaning of the evidence
 * - provenance: Origin metadata (timestamps, engine versions) that does not affect evidence semantics
 * - evidenceFamily: Taxonomic grouping for manifestation synthesis, not evidence content
 */
function areEvidenceRecordsIdentical(a: DomainEvidence, b: DomainEvidence): boolean {
  // Structural identity fields
  if (a.id !== b.id) return false;
  if (a.domain !== b.domain) return false;
  if (a.phase !== b.phase) return false;
  if (a.dimension !== b.dimension) return false;
  if (a.polarity !== b.polarity) return false;
  if (a.house !== b.house) return false;
  if (a.planet !== b.planet) return false;
  if (a.ruleId !== b.ruleId) return false;

  // Content identity fields
  if (a.identityKey !== b.identityKey) return false;
  if (a.source !== b.source) return false;
  if (a.sourceType !== b.sourceType) return false;
  if (a.role !== b.role) return false;
  if (a.statement !== b.statement) return false;
  if (a.strength !== b.strength) return false;
  if (a.priority !== b.priority) return false;

  // Rule attachment identity
  if (a.manifestationRuleIds !== b.manifestationRuleIds) {
    // Compare arrays by value if both present
    if (a.manifestationRuleIds && b.manifestationRuleIds) {
      if (a.manifestationRuleIds.length !== b.manifestationRuleIds.length) return false;
      for (let i = 0; i < a.manifestationRuleIds.length; i++) {
        if (a.manifestationRuleIds[i] !== b.manifestationRuleIds[i]) return false;
      }
    } else if (a.manifestationRuleIds !== b.manifestationRuleIds) {
      // One is undefined, the other is not
      return false;
    }
  }

  // Timing structural comparison
  if (a.timing !== b.timing) {
    if (a.timing && b.timing) {
      if (a.timing.period !== b.timing.period) return false;
      if (a.timing.level !== b.timing.level) return false;
      if (a.timing.planet !== b.timing.planet) return false;
    } else if (a.timing !== b.timing) {
      // One is undefined, the other is not
      return false;
    }
  }

  return true;
}

/**
 * Resolves wealth promise evidence references.
 *
 * Resolves promiseEvidenceIds against the provided wealthEvidence to build
 * WEALTH_NATAL_PROMISE references with existing id/identityKey/dimension/polarity.
 * Unresolvable IDs → UNRESOLVED + EVIDENCE_REFERENCE_UNRESOLVED diagnostic.
 *
 * Validates domain/phase/dimension consistency:
 * - Invalid domain/phase → WEALTH_EVIDENCE_INVALID diagnostic, UNRESOLVED ref, preserves original ID
 * - Dimension mismatch → WEALTH_EVIDENCE_DIMENSION_MISMATCH diagnostic, preserves source dimension,
 *   marks ref UNRESOLVED (High-3).
 *
 * Detects duplicate IDs and marks refs touching ambiguous IDs as UNRESOLVED
 * with EVIDENCE_ID_AMBIGUOUS diagnostic (High-2).
 *
 * Returns references, unresolved IDs, and diagnostics.
 *
 * Note: unresolved IDs surface via missingInputs (EVIDENCE_REFERENCE_UNRESOLVED entries),
 * not via diagnostics in the wealth section.
 */
function resolveWealthPromiseEvidenceReferences(
  promiseEvidenceIds: readonly string[],
  wealthEvidence: readonly DomainEvidence[],
  requestingDimension: WealthDimension
): {
  readonly references: readonly SynthesisEvidenceReference[];
  readonly unresolvedIds: readonly string[];
  readonly diagnostics: readonly SynthesisDiagnostic[];
} {
  const evidenceMap = new Map<string, DomainEvidence>();
  const duplicateIds = new Set<string>();

  for (const e of wealthEvidence) {
    const existing = evidenceMap.get(e.id);
    if (existing) {
      // Field-by-field comparison
      if (!areEvidenceRecordsIdentical(existing, e)) {
        duplicateIds.add(e.id);
      }
      // If identical, silently deduplicate (keep first - don't overwrite)
    } else {
      evidenceMap.set(e.id, e);
    }
  }

  const references: SynthesisEvidenceReference[] = [];
  const unresolvedIds: string[] = [];
  const diagnostics: SynthesisDiagnostic[] = [];

  for (const id of promiseEvidenceIds) {
    const evidence = evidenceMap.get(id);
    if (evidence) {
      // Check for ambiguous ID (duplicate)
      if (duplicateIds.has(id)) {
        references.push(Object.freeze({
          classification: 'UNRESOLVED',
          evidenceId: id,
          stage: 'WEALTH' as const,
          provenanceStage: 'WEALTH_NATAL_PROMISE' as const,
          referenceKind: 'EVIDENCE' as const
        }));
        unresolvedIds.push(id);
        diagnostics.push(Object.freeze({
          code: 'EVIDENCE_ID_AMBIGUOUS',
          message: `Evidence ID ${id} appears multiple times in wealth evidence with conflicting properties`
        }));
        continue;
      }

      // Check for invalid domain/phase
      if (!isValidWealthPromiseEvidence(evidence)) {
        references.push(Object.freeze({
          classification: 'UNRESOLVED',
          evidenceId: evidence.id,
          identityKey: evidence.identityKey,
          dimension: evidence.dimension,
          polarity: evidence.polarity,
          source: evidence.source,
          ruleId: evidence.ruleId,
          stage: 'WEALTH' as const,
          provenanceStage: 'WEALTH_NATAL_PROMISE' as const,
          referenceKind: 'EVIDENCE' as const
        }));
        unresolvedIds.push(id);
        diagnostics.push(Object.freeze({
          code: 'WEALTH_EVIDENCE_INVALID',
          message: `Evidence ${id} has invalid domain ${evidence.domain} or phase ${evidence.phase} for WEALTH_NATAL_PROMISE`
        }));
        continue;
      }

      // Check for dimension mismatch (High-3)
      const dimensionMismatch = evidence.dimension !== undefined && evidence.dimension !== requestingDimension;
      if (dimensionMismatch) {
        references.push(Object.freeze({
          classification: 'UNRESOLVED',
          evidenceId: evidence.id,
          identityKey: evidence.identityKey,
          dimension: evidence.dimension, // Preserve source dimension
          polarity: evidence.polarity,
          source: evidence.source,
          ruleId: evidence.ruleId,
          stage: 'WEALTH' as const,
          provenanceStage: 'WEALTH_NATAL_PROMISE' as const,
          referenceKind: 'EVIDENCE' as const
        }));
        unresolvedIds.push(id);
        diagnostics.push(Object.freeze({
          code: 'WEALTH_EVIDENCE_DIMENSION_MISMATCH',
          message: `Evidence ${id} has dimension ${evidence.dimension} but requesting dimension is ${requestingDimension}`
        }));
        continue;
      }

      references.push(Object.freeze({
        classification: classifyEvidence(evidence),
        evidenceId: evidence.id,
        identityKey: evidence.identityKey,
        dimension: evidence.dimension,
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
      if ((a.classification ?? '') !== (b.classification ?? '')) return (a.classification ?? '').localeCompare(b.classification ?? '');
      if (a.evidenceId !== b.evidenceId) return (a.evidenceId ?? '').localeCompare(b.evidenceId ?? '');
      return 0;
    })),
    unresolvedIds: Object.freeze(unresolvedIds),
    diagnostics: Object.freeze(diagnostics)
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
  const { selectedPeriod, careerActivation, wealthActivation, careerEvidence, wealthEvidence, careerDashaEvidence, careerBaseline, wealthBaseline, careerErrorCode, wealthErrorCode } = input;

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

  // Build career dasha evidence map once (High-4)
  const dashaEvidenceMap = new Map<string, DomainEvidence>();
  const dashaDuplicateIds = new Set<string>();

  if (careerDashaEvidence) {
    for (const e of careerDashaEvidence) {
      const existing = dashaEvidenceMap.get(e.id);
      if (existing) {
        // Field-by-field comparison
        if (!areEvidenceRecordsIdentical(existing, e)) {
          dashaDuplicateIds.add(e.id);
          // Emit EVIDENCE_ID_AMBIGUOUS diagnostic at map-build time
          careerDiagnostics.push(Object.freeze({
            code: 'EVIDENCE_ID_AMBIGUOUS',
            message: `Evidence ID ${e.id} appears multiple times in career dasha evidence with conflicting properties`
          }));
        }
        // If identical, silently deduplicate (keep first - don't overwrite)
      } else {
        dashaEvidenceMap.set(e.id, e);
      }
    }
  }

  if (careerActivation) {
    careerQualificationBasis = careerActivation.qualificationBasis;

    // Forward diagnostics from career activation (e.g., adapter fallback, evidence collisions)
    for (const diag of careerActivation.diagnostics) {
      careerDiagnostics.push(Object.freeze({
        code: diag.code,
        message: diag.message
      }));
    }

    if (careerQualificationBasis === 'PROXY_DIRECTION') {
      careerDiagnostics.push(Object.freeze({
        code: 'CAREER_QUALIFICATION_UNAVAILABLE',
        message: 'Career qualification used PROXY_DIRECTION interim contract; canonical C11 qualification unavailable'
      }));
    } else if (careerQualificationBasis === 'UNAVAILABLE') {
      careerDiagnostics.push(Object.freeze({
        code: 'CAREER_QUALIFICATION_UNAVAILABLE',
        message: 'Career qualification unavailable: canonical inputs provided but no qualifying mechanisms for this chart'
      }));
    }

    for (const exprActivation of careerActivation.expressionActivations) {
      const mdEffect = exprActivation.activation.mdActivation.effect;
      const adEffect = exprActivation.activation.adActivation.effect;
      const status = deriveCareerStatus(mdEffect, adEffect, exprActivation.linkedLevels);

      const rowDiagnostics: SynthesisDiagnostic[] = [];
      if (exprActivation.expressionSource === 'ADAPTER_FALLBACK') {
        rowDiagnostics.push({
          code: 'EXPRESSION_SOURCE_ADAPTER_FALLBACK',
          message: 'Expression derived from adapter fallback; no reliable mapping to caller expressions'
        });
      }

      const row: SynthesisCareerExpressionRow = {
        expressionRefKey: exprActivation.expressionRefKey,
        status,
        linkedLevels: exprActivation.linkedLevels,
        qualificationBasis: careerQualificationBasis,
        // Omit matchBasis if the PBA-04 row type lacks the field
        ...(exprActivation.matchBasis !== undefined ? { matchBasis: exprActivation.matchBasis } : {}),
        diagnostics: rowDiagnostics,
        // Full PBA-04 traceability (High-4)
        expressionEvidenceIds: exprActivation.expressionEvidenceIds,
        qualifiedEvidenceIds: exprActivation.qualifiedEvidenceIds,
        unqualifiedEvidenceIds: exprActivation.unqualifiedEvidenceIds,
        mdDashaEvidenceIds: exprActivation.mdDashaEvidenceIds,
        adDashaEvidenceIds: exprActivation.adDashaEvidenceIds,
        expressionSource: exprActivation.expressionSource
      };

      careerExpressions.push(row);
    }
  } else {
    careerQualificationBasis = 'UNAVAILABLE';
    careerDiagnostics.push(Object.freeze({
      code: 'CAREER_ACTIVATION_MISSING',
      message: 'Career activation not provided'
    }));
  }

  // Emit PARTIAL_CAREER_ACTIVATION_FAILED diagnostic if career activation is missing
  // This signals partial synthesis (one domain failed, the other succeeded)
  if (!careerActivation && wealthActivation) {
    const careerErrorMessage = careerErrorCode
      ? `Career activation failed (${careerErrorCode}); wealth activation succeeded.`
      : 'Career activation failed; wealth activation succeeded.';
    careerDiagnostics.push(Object.freeze({
      code: 'PARTIAL_CAREER_ACTIVATION_FAILED',
      message: `${careerErrorMessage} Synthesis proceeds with partial domain coverage.`
    }));
  }

  // Emit SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic if both activations are missing
  // This makes the empty-result state unambiguous
  if (!careerActivation && !wealthActivation) {
    const bothFailMessage = [
      careerErrorCode ? `Career activation failed (${careerErrorCode})` : 'Career activation failed',
      wealthErrorCode ? `wealth activation failed (${wealthErrorCode})` : 'wealth activation failed'
    ].join('; ');
    careerDiagnostics.push(Object.freeze({
      code: 'SYNTHESIS_PARTIAL_NO_DOMAINS',
      message: `${bothFailMessage}. Synthesis proceeds with no domain coverage.`
    }));
  }

  // Build wealth section
  const wealthDiagnostics: SynthesisDiagnostic[] = [];
  const wealthDimensions: Record<WealthDimension, SynthesisWealthDimensionRow> = {
    ACCUMULATION: {
      dimension: 'ACCUMULATION',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: [],
      diagnostics: [],
      promiseEvidenceIds: [],
      dashaRuleReferences: [],
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    },
    GAINS: {
      dimension: 'GAINS',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: [],
      diagnostics: [],
      promiseEvidenceIds: [],
      dashaRuleReferences: [],
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    },
    FORTUNE: {
      dimension: 'FORTUNE',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: [],
      diagnostics: [],
      promiseEvidenceIds: [],
      dashaRuleReferences: [],
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    },
    SPECULATION: {
      dimension: 'SPECULATION',
      effect: 'INSUFFICIENT_DATA',
      dataStatus: 'INSUFFICIENT_DATA',
      linkedLevels: [],
      diagnostics: [],
      promiseEvidenceIds: [],
      dashaRuleReferences: [],
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    }
  };

  if (wealthActivation) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];

      // Honest dataStatus (Medium-6): compute from successfully resolved promise refs
      // COMPLETE requires ALL promiseEvidenceIds to resolve to valid WEALTH NATAL_PROMISE evidence
      let resolvedCount = 0;
      const totalCount = dimActivation.promiseEvidenceIds.length;
      if (wealthEvidence && totalCount > 0) {
        const evidenceMap = new Map<string, DomainEvidence>();
        const duplicateIds = new Set<string>();
        for (const e of wealthEvidence) {
          const existing = evidenceMap.get(e.id);
          if (existing) {
            // Field-by-field comparison
            if (!areEvidenceRecordsIdentical(existing, e)) {
              duplicateIds.add(e.id);
            }
            // If identical, silently deduplicate (keep first - don't overwrite)
          } else {
            evidenceMap.set(e.id, e);
          }
        }
        for (const id of dimActivation.promiseEvidenceIds) {
          const evidence = evidenceMap.get(id);
          // Skip ambiguous IDs and invalid evidence (wrong domain/phase/dimension)
          if (evidence &&
            !duplicateIds.has(id) &&
            isValidWealthPromiseEvidence(evidence) &&
            (evidence.dimension === undefined || evidence.dimension === dim)) {
            resolvedCount++;
          }
        }
      }

      const dataStatus = deriveWealthDataStatus(
        dimActivation.linkedLevels.length > 0,
        resolvedCount,
        totalCount,
        dimActivation.effect
      );

      const dimDiagnostics: SynthesisDiagnostic[] = [];
      // Emit diagnostic when dimension is linked (activation present) and effect is indeterminate
      // This signals the "complete input, linked, but indeterminate effect" condition
      if (dimActivation.linkedLevels.length > 0 &&
        (dimActivation.effect === 'UNKNOWN' || dimActivation.effect === 'INSUFFICIENT_DATA') &&
        totalCount > 0 && resolvedCount === totalCount) {
        dimDiagnostics.push({
          code: 'WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE',
          message: `Wealth dimension ${dim} has complete input but indeterminate activation effect (${dimActivation.effect})`
        });
      }

      wealthDimensions[dim] = {
        dimension: dim,
        effect: dimActivation.effect,
        dataStatus,
        linkedLevels: dimActivation.linkedLevels,
        diagnostics: dimDiagnostics,
        promiseEvidenceIds: dimActivation.promiseEvidenceIds,
        dashaRuleReferences: dimActivation.dashaRuleReferences,
        insufficientReason: dimActivation.insufficientReason
      };
    }
  } else {
    wealthDiagnostics.push(Object.freeze({
      code: 'WEALTH_ACTIVATION_MISSING',
      message: 'Wealth activation not provided'
    }));
  }

  // Emit PARTIAL_WEALTH_ACTIVATION_FAILED diagnostic if wealth activation is missing
  // This signals partial synthesis (one domain failed, the other succeeded)
  if (!wealthActivation && careerActivation) {
    const wealthErrorMessage = wealthErrorCode
      ? `Wealth activation failed (${wealthErrorCode}); career activation succeeded.`
      : 'Wealth activation failed; career activation succeeded.';
    wealthDiagnostics.push(Object.freeze({
      code: 'PARTIAL_WEALTH_ACTIVATION_FAILED',
      message: `${wealthErrorMessage} Synthesis proceeds with partial domain coverage.`
    }));
  }

  // Build evidence references
  const evidenceReferences: SynthesisEvidenceReference[] = [];
  const careerUnresolvedIds: string[] = [];
  const wealthUnresolvedIds: Array<{ readonly dimension: WealthDimension; readonly id: string }> = [];

  // Career evidence references with stage-specific provenance (High-1)
  if (careerActivation) {
    const evidenceMap = new Map<string, DomainEvidence>();
    const duplicateIds = new Set<string>();

    for (const e of careerEvidence ?? []) {
      const existing = evidenceMap.get(e.id);
      if (existing) {
        // Field-by-field comparison
        if (!areEvidenceRecordsIdentical(existing, e)) {
          duplicateIds.add(e.id);
          // Emit EVIDENCE_ID_AMBIGUOUS diagnostic at map-build time
          careerDiagnostics.push(Object.freeze({
            code: 'EVIDENCE_ID_AMBIGUOUS',
            message: `Evidence ID ${e.id} appears multiple times in career evidence with conflicting properties`
          }));
        }
        // If identical, silently deduplicate (keep first - don't overwrite)
      } else {
        evidenceMap.set(e.id, e);
      }
    }



    for (const exprActivation of careerActivation.expressionActivations) {
      // EXPRESSION stage: from expressionEvidenceIds
      for (const id of exprActivation.expressionEvidenceIds) {
        const evidence = evidenceMap.get(id);
        if (evidence) {
          // Check for ambiguous ID (duplicate)
          if (duplicateIds.has(id)) {
            careerUnresolvedIds.push(id);
            evidenceReferences.push(Object.freeze({
              classification: 'UNRESOLVED',
              evidenceId: id,
              stage: 'CAREER' as const,
              provenanceStage: 'CAREER_EXPRESSION' as const,
              referenceKind: 'EVIDENCE' as const
            }));
            // Diagnostic already emitted at map-build time
            continue;
          }

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
          // Check for ambiguous ID (duplicate)
          if (duplicateIds.has(id)) {
            careerUnresolvedIds.push(id);
            evidenceReferences.push(Object.freeze({
              classification: 'UNRESOLVED',
              evidenceId: id,
              stage: 'CAREER' as const,
              provenanceStage: 'CAREER_QUALIFICATION' as const,
              referenceKind: 'EVIDENCE' as const
            }));
            // Diagnostic already emitted at map-build time
            continue;
          }

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
          // Check for ambiguous ID (duplicate)
          if (duplicateIds.has(id)) {
            careerUnresolvedIds.push(id);
            evidenceReferences.push(Object.freeze({
              classification: 'UNRESOLVED',
              evidenceId: id,
              stage: 'CAREER' as const,
              provenanceStage: 'CAREER_QUALIFICATION' as const,
              referenceKind: 'EVIDENCE' as const
            }));
            // Diagnostic already emitted at map-build time
            continue;
          }

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

      // ACTIVATION stage: from mdDashaEvidenceIds and adDashaEvidenceIds (High-4)
      // Resolve against careerDashaEvidence if provided, otherwise mark UNRESOLVED
      for (const id of exprActivation.mdDashaEvidenceIds) {
        if (!careerDashaEvidence) {
          // No C9 evidence set provided - emit UNRESOLVED with diagnostic
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
          careerDiagnostics.push(Object.freeze({
            code: 'C9_EVIDENCE_SET_MISSING',
            message: `Career dasha evidence ID ${id} cannot be resolved: careerDashaEvidence not provided`
          }));
          continue;
        }

        const evidence = dashaEvidenceMap.get(id);
        if (evidence) {
          // Check for ambiguous ID (duplicate)
          if (dashaDuplicateIds.has(id)) {
            careerUnresolvedIds.push(id);
            evidenceReferences.push(Object.freeze({
              classification: 'UNRESOLVED',
              evidenceId: id,
              stage: 'CAREER' as const,
              provenanceStage: 'CAREER_ACTIVATION' as const,
              referenceKind: 'EVIDENCE' as const
            }));
            // Diagnostic already emitted at map-build time
            continue;
          }

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
          careerDiagnostics.push(Object.freeze({
            code: 'C9_EVIDENCE_REFERENCE_UNRESOLVED',
            message: `Career dasha evidence ID ${id} not found in careerDashaEvidence`
          }));
        }
      }

      for (const id of exprActivation.adDashaEvidenceIds) {
        if (!careerDashaEvidence) {
          // No C9 evidence set provided - emit UNRESOLVED with diagnostic
          careerUnresolvedIds.push(id);
          evidenceReferences.push(Object.freeze({
            classification: 'UNRESOLVED',
            evidenceId: id,
            stage: 'CAREER' as const,
            provenanceStage: 'CAREER_ACTIVATION' as const,
            referenceKind: 'EVIDENCE' as const
          }));
          careerDiagnostics.push(Object.freeze({
            code: 'C9_EVIDENCE_SET_MISSING',
            message: `Career dasha evidence ID ${id} cannot be resolved: careerDashaEvidence not provided`
          }));
          continue;
        }

        const evidence = dashaEvidenceMap.get(id);
        if (evidence) {
          // Check for ambiguous ID (duplicate)
          if (dashaDuplicateIds.has(id)) {
            careerUnresolvedIds.push(id);
            evidenceReferences.push(Object.freeze({
              classification: 'UNRESOLVED',
              evidenceId: id,
              stage: 'CAREER' as const,
              provenanceStage: 'CAREER_ACTIVATION' as const,
              referenceKind: 'EVIDENCE' as const
            }));
            // Diagnostic already emitted at map-build time
            continue;
          }

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
          careerDiagnostics.push(Object.freeze({
            code: 'C9_EVIDENCE_REFERENCE_UNRESOLVED',
            message: `Career dasha evidence ID ${id} not found in careerDashaEvidence`
          }));
        }
      }
    }
  }

  // Build career section (after evidence resolution so diagnostics are available)
  const careerSection: SynthesisCareerSection = Object.freeze({
    qualificationBasis: careerQualificationBasis,
    expressions: Object.freeze(careerExpressions.map(e => Object.freeze(e)).sort((a, b) =>
      a.expressionRefKey.localeCompare(b.expressionRefKey)
    )),
    diagnostics: Object.freeze(careerDiagnostics.map(d => Object.freeze(d)).sort((a, b) =>
      a.code.localeCompare(b.code)
    ))
  });

  // Wealth promise evidence references with stage-specific provenance
  if (wealthActivation && wealthEvidence) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];
      const { references, unresolvedIds, diagnostics } = resolveWealthPromiseEvidenceReferences(
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
      for (const diag of diagnostics) {
        wealthDiagnostics.push(diag);
      }
    }
  }

  // Wealth dasha rule references without classification/polarity (High-1)
  if (wealthActivation) {
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimActivation = wealthActivation.dimensions[dim];
      for (const ruleRef of dimActivation.dashaRuleReferences) {
        evidenceReferences.push(Object.freeze({
          ruleId: ruleRef.ruleId,
          source: ruleRef.source,
          level: ruleRef.level,
          stage: 'WEALTH' as const,
          provenanceStage: 'WEALTH_DASHA_RULE' as const,
          referenceKind: 'RULE' as const
        }));
      }
    }
  }

  const wealthSection: SynthesisWealthSection = Object.freeze({
    dimensions: Object.freeze({
      ACCUMULATION: Object.freeze(wealthDimensions.ACCUMULATION),
      GAINS: Object.freeze(wealthDimensions.GAINS),
      FORTUNE: Object.freeze(wealthDimensions.FORTUNE),
      SPECULATION: Object.freeze(wealthDimensions.SPECULATION)
    }),
    diagnostics: Object.freeze(wealthDiagnostics.sort((a, b) =>
      a.code.localeCompare(b.code)
    ))
  });

  // Sort evidence references
  const sortedEvidenceReferences = Object.freeze(evidenceReferences.sort((a, b) => {
    if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
    if (a.provenanceStage !== b.provenanceStage) return (a.provenanceStage ?? '').localeCompare(b.provenanceStage ?? '');
    if (a.dimension !== b.dimension) return (a.dimension ?? '').localeCompare(b.dimension ?? '');
    if (a.classification !== b.classification) return (a.classification ?? '').localeCompare(b.classification ?? '');
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
