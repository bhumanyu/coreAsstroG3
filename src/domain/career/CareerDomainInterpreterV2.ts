import type { Horoscope, Planet } from '../../types';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import {
  mapDashaInterpretationToActiveDashaTimingContext,
  type ActiveDashaTimingContext
} from '../../core/analysis';
import {
  buildDomainInterpretation,
  createDomainEvidence,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createVargaConfirmation,
  createDomainConclusion,
  calculateEvidenceConfidence,
  detectDomainConflicts
} from '../interpretation';
import type {
  DomainEvidence,
  DomainInterpretation,
  DomainStrength,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect,
  DomainManifestation,
  NatalPromise,
  DashaActivation,
  TransitTrigger,
  VargaConfirmation
} from '../interpretation';
import type {
  CareerManifestationMode,
  CareerManifestation,
  CareerTimingActivation,
  CareerDataCompleteness,
  CareerEvidenceClassification
} from './careerTypes';
import {
  linkCareerEvidence,
  resolveRelatedCareerPromiseEvidenceIds
} from './careerEvidenceLinker';
import {
  buildCareerEvidence
} from './careerEvidenceMapper';
import {
  deriveCareerManifestations,
  buildCareerManifestations,
  calculateManifestationConfidence
} from './careerManifestations';
import {
  buildCareerDashaSynthesis,
  type D10CareerContext,
  type CareerDashaSynthesis
} from './careerDasha';
import { getCareerDashaEvidencePriority } from './careerDasha/careerDashaRules';
import {
  buildCareerConclusion,
  buildCareerConclusionData,
  resolveCareerConclusionStrength,
  resolveCurrentActivation,
  resolveCurrentPressure,
  buildCareerHeadline,
  calculateDomainStrength,
  calculateVargaStrength,
  buildCareerNatalStatement,
  buildCareerDashaStatement,
  buildCareerTransitStatement,
  buildD10Statement
} from './careerConclusion';
import { calculateCareerDataCompleteness } from './careerDataCompleteness';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { evaluateCareerReasoningHierarchy } from './careerReasoningHierarchy';
import { synthesizeCareerTransit, synthesizeCareerTiming, type CareerTimingSynthesis } from '../timing/careerWealthTiming';
import { synthesizeCareerManifestations } from './manifestation/careerManifestationSynthesis';
import type { CareerManifestationSynthesis } from './manifestation/careerManifestationSynthesisTypes';
import { synthesizeCareerFinal } from '../careerWealth/finalSynthesis/careerFinalSynthesis';
import type { CareerWealthFinalSynthesis } from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import {
  buildCareerStructuralReasoning,
  toDomainEvidence,
  type CareerStructuralReasoning
} from './careerStructuralReasoningIntegration';

/**
 * P2-08D: Canonical C11 Final Synthesis Integration
 *
 * Import the canonical C11 integration adapter and types.
 * This provides the authoritative career conclusion from the canonical C11 module.
 */
import {
  buildCareerFinalAnalysis
} from './careerFinalSynthesis/careerFinalSynthesisIntegration';
import type {
  CareerFinalSynthesisIntegrationInput
} from './careerFinalSynthesis/careerFinalSynthesisCanonicalTypes';
import type {
  CareerFinalSynthesisResult,
  CareerFinalDirection,
  CareerFinalStrength
} from './careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerNatalAnalysis
} from './careerNatalAnalysis';
import {
  buildCareerNatalAnalysis
} from './careerNatalConvergence';
import {
  buildCareerExpression
} from './careerExpressionIntegration';
import {
  buildCareerDashaAnalysis
} from './careerDasha/careerDashaIntegration';
import {
  buildCareerD10Analysis
} from './careerD10/careerD10Integration';
import {
  mapCanonicalCareerEvidence,
  validateC11References
} from './canonicalCareerEvidenceMapper';

/**
 * ARCHITECTURAL NOTE: Canonical C11 Final Synthesis Boundary
 *
 * The canonical type contract for Career Final Synthesis is defined at:
 * src/domain/career/careerFinalSynthesis/careerFinalSynthesisTypes.ts
 *
 * This interpreter uses the canonical C11 synthesis implementation as the single
 * authoritative career conclusion source (implemented in P2-08D).
 *
 * Evidence Assembly (P2-11C Gate 5):
 * - Canonical evidence mapper (mapCanonicalCareerEvidence) produces evidence from
 *   canonical C4-C10 analysis
 * - Legacy evidence paths (buildCareerEvidence, toDomainEvidence, dashaFactorsEvidence)
 *   are disabled to prevent double-counting
 * - Each natal/expression/dasha/d10 fact is counted exactly once via identityKey deduplication
 * - C11 is used for reference validation (cross-checks canonical evidence IDs against C11 finalIds)
 *
 * The legacy synthesis from careerWealth/finalSynthesis/careerFinalSynthesis.ts is
 * retained as a compatibility artifact in conclusionData.careerFinalSynthesis for
 * backward compatibility with existing consumers. New code should read from
 * conclusionData.canonicalCareerFinalSynthesis instead.
 *
 * The P2-11B CanonicalCareerOrchestrator and its deferred identity mappings remain
 * intentionally out of the production synthesis path.
 */
import {
  ReasoningTraceBuilder,
  validateEvidenceNodes,
  validateReasoningTrace,
  mapActivationStatusToEdgeType,
  mapTimingStatusToEdgeType,
  mapDivisionalRelationshipToEdgeType,
  mapManifestationStatusToEdgeType,
  mapPromiseStatusToEdgeType,
  type ReasoningEdgeType,
  type ReasoningTraceGraph
} from '../careerWealth/reasoningTrace';
import { analysisAsOfDate } from '../../core/analysis/analysisTime';

export function interpretCareerV2(
  horoscope: Horoscope,
  options: DomainReasoningOptions
): DomainInterpretation {
  const context = options.context;
  const asOfDate = analysisAsOfDate(context);

  const themeInterpretation = interpretCareerTheme({
    horoscope,
    dashaInterpretation: options.temporalState.dashaInterpretation
  });
  const rawEvidence = themeInterpretation.evidence;
  const activeDashaReport = options.temporalState.dashaInterpretation;

  /**
   * P2-08D: Canonical C11 Final Synthesis Integration
   *
   * Build the canonical C4-C7 natal analysis, C8 expression, C9 Dasha, and C10 D10
   * to produce the authoritative career conclusion via the canonical C11 module.
   *
   * This replaces the legacy synthesis from careerConclusion.ts as the single
   * authoritative career conclusion source in the production path.
   */
  const canonicalNatalAnalysis: CareerNatalAnalysis = buildCareerNatalAnalysis({
    horoscope
  });

  const canonicalExpressionAnalysis = buildCareerExpression({
    natal: canonicalNatalAnalysis
  });

  const canonicalDashaAnalysis = buildCareerDashaAnalysis({
    horoscope,
    natal: canonicalNatalAnalysis,
    expression: canonicalExpressionAnalysis
  });

  const canonicalD10Analysis = buildCareerD10Analysis({
    horoscope,
    natal: canonicalNatalAnalysis,
    expression: canonicalExpressionAnalysis
  });

  const canonicalC11Input: CareerFinalSynthesisIntegrationInput = Object.freeze({
    natal: canonicalNatalAnalysis,
    expression: canonicalExpressionAnalysis,
    dasha: canonicalDashaAnalysis,
    d10: canonicalD10Analysis,
    timing: undefined // Will be set after careerTimingSynthesis is computed
  });

  /**
   * P2-11C Gate 5: Canonical Evidence Cutover
   *
   * Map canonical C4-C10 outputs to DomainEvidence using the canonical mapper.
   * This replaces the legacy evidence assembly paths with a single canonical source.
   *
   * Legacy evidence paths are disabled to prevent double-counting:
   * - buildCareerEvidence(rawEvidence) → disabled (legacy C8/C9/C10-equivalent)
   * - toDomainEvidence(structuralReasoning) → disabled (legacy C4)
   * - dashaFactorsEvidence → disabled (legacy dasha factors)
   *
   * The canonical mapper:
   * - Preserves identityKey, ruleId, sourceIds as distinct concepts
   * - Deduplicates by identityKey without weight inflation
   * - Maps C4-C7 to NATAL_PROMISE, C8 to MODIFIER, C9 to DASHA_ACTIVATION, C10 to VARGA_CONFIRMATION
   * - Uses C11 for reference validation (cross-checks canonical evidence IDs against C11 finalIds)
   * - Excludes unmappable strengths rather than defaulting them
   *
   * Note: We build a preliminary C11 input without timing here to get canonical evidence.
   * The final C11 synthesis will be recomputed with timing later.
   * This two-pass approach is intentional: canonical evidence mapper needs C11 finalIds for validation,
   * but timing synthesis requires canonical evidence (circular dependency resolved by two-pass build).
   */
  const preliminaryC11Result: CareerFinalSynthesisResult = buildCareerFinalAnalysis(canonicalC11Input);

  const canonicalEvidenceInput = Object.freeze({
    natal: canonicalNatalAnalysis,
    expression: canonicalExpressionAnalysis,
    dasha: canonicalDashaAnalysis,
    d10: canonicalD10Analysis,
    finalSynthesis: preliminaryC11Result
  });

  const canonicalEvidence = mapCanonicalCareerEvidence(canonicalEvidenceInput);

  /**
   * P2-11C Gate 5: C11 Reference Validation (informational, non-fatal)
   *
   * Cross-check canonical evidence IDs against C11 finalIds for observability.
   * Validation discrepancies are logged but do not affect the evidence output.
   * This is a diagnostic check, not a blocking validation.
   *
   * Rationale for dual C11 builds:
   * - Preliminary C11 (without timing) is built to get canonical evidence IDs for mapper input
   * - Final C11 (with timing) is built after careerTimingSynthesis is computed
   * - This two-pass approach is intentional: canonical evidence mapper needs C11 finalIds for validation,
   *   but timing synthesis requires canonical evidence (circular dependency resolved by two-pass build)
   */
  const c11Validation = validateC11References(canonicalEvidence, preliminaryC11Result);

  if (c11Validation.unreferenced.length > 0 || c11Validation.missing.length > 0) {
    // Log validation discrepancies for observability (non-fatal)
    // In production, this would use a proper logging framework
    console.warn(`[CareerDomainInterpreterV2] C11 reference validation: ${c11Validation.unreferenced.length} unreferenced, ${c11Validation.missing.length} missing`);
  }

  /**
   * P2-11C Gate 5: Evidence Assembly
   *
   * Use canonicalEvidence as the single authoritative evidence source.
   * This replaces the legacy mergedEvidence assembly (evidenceWithStructural + dashaFactorsEvidence).
   *
   * All downstream code uses canonicalEvidence instead of legacy evidence arrays.
   */
  const evidence = canonicalEvidence;

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalSupporting = supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalPromiseEvidence = evidence.filter((item) => item.phase === 'NATAL_PROMISE');
  const natalPromiseEvidenceIds = natalPromiseEvidence.map((item) => item.id);

  const conflicts = detectDomainConflicts('CAREER', evidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const dataCompleteness = calculateCareerDataCompleteness(evidence);

  const natalConfidence = calculateEvidenceConfidence(
    natalPromiseEvidence,
    {
      dataCompleteness: dataCompleteness.primaryFactors === 'COMPLETE' ? 'COMPLETE' : (dataCompleteness.primaryFactors === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT'),
      hasPrimaryChallenge,
      hasVargaConflict: false
    }
  );

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildCareerNatalStatement(
      supportingEvidence,
      challengingEvidence,
      themeInterpretation.conclusion?.summary
    ),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((item) => item.id),
    challengingEvidenceIds: natalChallenging.map((item) => item.id)
  });

  // Dasha Timing & Multi-period evaluation (MD / AD / PD)
  const dashaEvidence = evidence.filter(
    (item) => item.phase === 'DASHA_ACTIVATION' || item.source === 'DASHA'
  );
  const dashaSupporting = dashaEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const dashaChallenging = dashaEvidence.filter((item) => item.polarity === 'CHALLENGING');

  const rawDashaPromiseLinks = dashaEvidence.flatMap((item) =>
    item.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))
  );
  const dashaPromiseEvidenceIds = Array.from(new Set(rawDashaPromiseLinks));
  const dashaEffect = evaluateDashaEffect(dashaEvidence, dashaPromiseEvidenceIds);

  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildCareerDashaStatement(dashaEvidence, dashaEffect),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaPromiseEvidenceIds
  });

  const currentDasha = activeDashaReport?.current;
  const mdPlanet = currentDasha?.mahadasha?.planet;
  const adPlanet = currentDasha?.antardasha?.planet;
  const pdPlanet = currentDasha?.pratyantardasha?.planet;

  const mdActivation = evaluateCareerTimingActivation('MD', dashaEvidence, natalPromiseEvidenceIds, mdPlanet);
  const adActivation = evaluateCareerTimingActivation('AD', dashaEvidence, natalPromiseEvidenceIds, adPlanet);
  const pdActivation = evaluateCareerTimingActivation('PD', dashaEvidence, natalPromiseEvidenceIds, pdPlanet);
  const timingActivations: readonly CareerTimingActivation[] = Object.freeze([
    mdActivation,
    adActivation,
    pdActivation
  ]);

  // Transit Trigger evaluation
  //
  // P2-11C Gate 5: Transit evidence deferment
  //
  // Canonical evidence mapper does not emit transit evidence (no canonical transit producer exists in Gate 5).
  // Transit activation is intentionally deferred to a future gate when a canonical transit evidence producer is available.
  // transitEvidence and transitTrigger will be empty/NO_MATERIAL_TRIGGER until transit is re-enabled.
  //
  // Legacy transit evidence path (themeInterpretation.transitEvidence) is disabled to prevent double-counting.
  const transitEvidence = evidence.filter(
    (item) => item.phase === 'TRANSIT_TRIGGER' || item.source === 'TRANSIT'
  );
  const transitSupporting = transitEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const transitChallenging = transitEvidence.filter((item) => item.polarity === 'CHALLENGING');

  const rawTransitPromiseLinks = transitEvidence.flatMap((item) =>
    item.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))
  );
  const transitPromiseEvidenceIds = Array.from(new Set(rawTransitPromiseLinks));
  const transitEffect = evaluateTransitEffect(transitEvidence, transitPromiseEvidenceIds);

  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(transitSupporting, transitChallenging),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildCareerTransitStatement(transitEvidence, transitEffect),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitPromiseEvidenceIds
  });

  // D10 Varga Confirmation
  const d10Evidence = evidence.filter((item) => item.source === 'D10');
  const d10Relationship = evaluateD10Relationship(
    rawEvidence,
    themeInterpretation.metadata?.vargaConfirmationStatus,
    d10Evidence,
    natalPromiseEvidenceIds
  );

  const vargaConfirmation = createVargaConfirmation({
    domain: 'CAREER',
    varga: 'D10',
    relationship: d10Relationship,
    strength: calculateVargaStrength(evidence, 'D10'),
    confidence: calculateEvidenceConfidence(d10Evidence),
    statement: buildD10Statement(d10Evidence, d10Relationship),
    evidenceIds: d10Evidence.map((item) => item.id)
  });
  const vargaConfirmations: readonly VargaConfirmation[] = [vargaConfirmation];

  // CW-01 reasoning hierarchy is the authoritative production reasoning path
  const cw01Result = evaluateCareerReasoningHierarchy({
    evidence,
    d10Confirmation: vargaConfirmation,
    dashaTimings: {
      md: {
        level: 'MD',
        effect: mdActivation.effect,
        evidenceIds: mdActivation.evidenceIds ?? [],
        confidence: 1.0
      },
      ad: {
        level: 'AD',
        effect: adActivation.effect,
        evidenceIds: adActivation.evidenceIds ?? [],
        confidence: 1.0
      },
      pd: {
        level: 'PD',
        effect: pdActivation.effect,
        evidenceIds: pdActivation.evidenceIds ?? [],
        confidence: 1.0
      }
    },
    transitEvidence,
    rawConflicts: conflicts
  });

  const d10Context: D10CareerContext = {
    relationship: d10Relationship,
    statement: buildD10Statement(d10Evidence, d10Relationship)
  };

  const careerDashaSynthesis = buildCareerDashaSynthesis({
    dashaInterpretation: activeDashaReport,
    d10Context
  });

  let careerTimingSynthesis: CareerTimingSynthesis;
  if (asOfDate && !isNaN(asOfDate.getTime())) {
    const activeDashaState = mapDashaInterpretationToActiveDashaTimingContext(options.temporalState.dashaInterpretation);
    const careerTransitSynthesis = synthesizeCareerTransit(horoscope, activeDashaState, asOfDate, careerDashaSynthesis);
    careerTimingSynthesis = synthesizeCareerTiming(cw01Result.natalStrength, careerDashaSynthesis, careerTransitSynthesis);
  } else {
    careerTimingSynthesis = Object.freeze({
      natalPromise: cw01Result.natalStrength,
      dashaEffect: careerDashaSynthesis?.combined?.combinedEffect ?? 'INSUFFICIENT_DATA',
      transitEffect: 'INSUFFICIENT_DATA',
      overallEffect: 'INSUFFICIENT_DATA',
      confidence: 0.5,
      factors: Object.freeze([]),
      summary: 'Timing calculation unavailable: asOf date not provided.'
    });
  }

  const conclusionData = buildCareerConclusionData(
    natalStrength,
    d10Relationship,
    timingActivations,
    transitTrigger,
    conflicts,
    cw01Result.manifestations,
    cw01Result.supportingSourceIds,
    cw01Result.challengingSourceIds
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: cw01Result.finalStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      dataCompleteness: dataCompleteness.primaryFactors === 'COMPLETE' ? 'COMPLETE' : (dataCompleteness.primaryFactors === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT'),
      hasVargaConflict,
      hasPrimaryChallenge
    }),
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      themeInterpretation.conclusion?.summary,
      d10Relationship,
      {
        timingActivations,
        conflicts,
        manifestations: cw01Result.manifestations,
        conclusionData
      }
    ),
    primaryEvidenceIds: cw01Result.primaryEvidenceIds,
    supportingEvidenceIds: cw01Result.supportingEvidenceIds,
    challengingEvidenceIds: cw01Result.challengingEvidenceIds,
    unresolvedQuestions: [],
    primarySourceIds: cw01Result.primarySourceIds,
    supportingSourceIds: cw01Result.supportingSourceIds,
    challengingSourceIds: cw01Result.challengingSourceIds,
    unresolvedSourceIds: cw01Result.unresolvedSourceIds
  });

  const careerManifestationSynthesis = synthesizeCareerManifestations(
    evidence,
    careerDashaSynthesis,
    careerTimingSynthesis,
    horoscope
  );

  /**
   * P2-11C Gate 5: Canonical C11 Final Synthesis with Timing
   *
   * Rebuild the canonical C11 synthesis with the computed timing synthesis.
   * This is the final authoritative C11 result used for the conclusion.
   */
  const finalCanonicalC11Input: CareerFinalSynthesisIntegrationInput = Object.freeze({
    natal: canonicalNatalAnalysis,
    expression: canonicalExpressionAnalysis,
    dasha: canonicalDashaAnalysis,
    d10: canonicalD10Analysis,
    timing: careerTimingSynthesis
  });

  const canonicalC11Result: CareerFinalSynthesisResult = buildCareerFinalAnalysis(finalCanonicalC11Input);

  /**
   * P2-08D: Presentation/Compatibility Adapter
   *
   * Map the canonical C11 result to the existing DomainInterpretation structure.
   * This adapter:
   * - Does NOT call legacy resolveCareerConclusionStrength
   * - Does NOT call legacy final synthesis to decide the conclusion again
   * - Does NOT combine canonical + legacy into a third conclusion
   * - Maps C11 fields to existing DomainConclusion fields for compatibility
   *
   * Confidence mapping: C11 (HIGH/MEDIUM/LOW) → DomainInterpretation (HIGH/MODERATE/LOW)
   */
  const mapC11ConfidenceToDomain = (c11Confidence: 'HIGH' | 'MEDIUM' | 'LOW'): 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNDETERMINED' => {
    switch (c11Confidence) {
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MODERATE';
      case 'LOW': return 'LOW';
      default: return 'UNDETERMINED';
    }
  };

  /**
   * P2-08D: Exhaustive Strength Mapping
   *
   * Map canonical C11 CareerFinalStrength to DomainStrength.
   * This is exhaustive over the C11 strength union to catch future changes at compile time.
   */
  const mapC11StrengthToDomain = (c11Strength: CareerFinalStrength): DomainStrength => {
    switch (c11Strength) {
      case 'VERY_STRONG': return 'VERY_STRONG';
      case 'STRONG': return 'STRONG';
      case 'MODERATE': return 'MODERATE';
      case 'MIXED': return 'MIXED';
      case 'WEAK': return 'WEAK';
      case 'VERY_WEAK': return 'VERY_WEAK';
      case 'UNDETERMINED': return 'UNDETERMINED';
    }
  };

  /**
   * P2-08D: Trace Adapter Helpers
   *
   * Map canonical C11 fields to legacy trace graph shape.
   * These are internal adapters for reasoning trace compatibility only.
   *
   * IMPORTANT: UNDETERMINED strength never maps to a positive status.
   * Within the SUPPORT branch, only explicitly-supported strengths produce positive statuses.
   * UNDETERMINED/MIXED strengths map to INSUFFICIENT_DATA to represent unavailable/insufficient data.
   */
  const mapC11DirectionToLegacyStatus = (
    direction: CareerFinalDirection,
    strength: CareerFinalStrength
  ): string => {
    if (direction === 'SUPPORT') {
      if (strength === 'VERY_STRONG' || strength === 'STRONG') return 'VERY_STRONG';
      if (strength === 'MODERATE') return 'STRONG';
      // WEAK/VERY_WEAK: no valid positive status weaker than MODERATE in legacy union
      // UNDETERMINED/MIXED: insufficient data, not a positive status
      return 'INSUFFICIENT_DATA';
    }
    if (direction === 'CHALLENGE') return 'CHALLENGED';
    if (direction === 'CONDITIONAL') return 'MODERATE';
    if (direction === 'MIXED') return 'MIXED';
    // NEUTRAL/UNAVAILABLE directions map to unavailable representation
    return 'INSUFFICIENT_DATA';
  };

  const mapC11DashaEffectToLegacyStatus = (dashaEffect: string): string => {
    if (dashaEffect === 'ACTIVATES') return 'SUPPORT';
    if (dashaEffect === 'PARTIALLY_ACTIVATES') return 'MIXED';
    if (dashaEffect === 'CHALLENGES') return 'CHALLENGE';
    return 'INSUFFICIENT_DATA';
  };

  const mapC11TimingStatusToLegacyStatus = (timingStatus: string): string => {
    if (timingStatus === 'ACTIVE') return 'SUPPORT';
    if (timingStatus === 'PARTIALLY_ACTIVE') return 'MIXED';
    if (timingStatus === 'CHALLENGED') return 'CHALLENGE';
    return 'INSUFFICIENT_DATA';
  };

  const mapC11DirectionToLegacyVarga = (direction: CareerFinalDirection): string => {
    if (direction === 'SUPPORT') return 'CONFIRMS';
    if (direction === 'CHALLENGE') return 'CONFLICTS';
    if (direction === 'CONDITIONAL') return 'MODIFIES';
    return 'UNAVAILABLE';
  };

  /**
   * P2-08D: Evidence Role Mapping from C11
   *
   * Map C11 evidenceTrace and conflicts to DomainConclusion evidence role fields.
   * C11 provides:
   * - evidenceIds: all evidence IDs (deduplicated)
   * - conflicts: layer conflicts with direction and evidenceIds
   *
   * DomainConclusion expects:
   * - primaryEvidenceIds: primary supporting evidence
   * - supportingEvidenceIds: secondary supporting evidence
   * - challengingEvidenceIds: challenging evidence
   *
   * Since C11 doesn't distinguish primary vs supporting evidence (it provides a flat list),
   * we map challenging evidence from conflicts and omit primary/supporting distinction
   * rather than fabricating it. The full canonical result remains available in
   * conclusionData.canonicalCareerFinalSynthesis for consumers that need role-aware evidence.
   *
   * P2-08D-03: finalStatus and finalDirection Mapping Limitation
   *
   * DomainConclusion does not have fields for finalStatus or finalDirection.
   * These C11 fields are preserved in conclusionData.canonicalCareerFinalSynthesis
   * and are not inferred from strength. Consumers requiring these fields should
   * read them directly from the canonical C11 result.
   *
   * P2-08D-03: Evidence ID and Source ID Mapping Limitation
   *
   * C11 evidenceIds are canonical identity keys from the C11 reasoning hierarchy,
   * not occurrence-level evidence IDs that map to the DomainEvidence list in evidence.
   * Similarly, C11 sourceIds are provenance occurrences that may not map cleanly to DomainEvidence.
   * To maintain traceability invariants, we omit both evidence IDs and source IDs from the
   * DomainConclusion adapter. Consumers requiring evidence-level provenance should read
   * from canonicalC11Result.evidenceIds and canonicalC11Result.sourceIds directly.
   */
  const c11AdaptedConclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: mapC11StrengthToDomain(canonicalC11Result.finalStrength),
    confidence: mapC11ConfidenceToDomain(canonicalC11Result.confidence),
    statement: canonicalC11Result.statement,
    primaryEvidenceIds: [], // C11 doesn't distinguish primary vs supporting
    supportingEvidenceIds: [], // Omitted to maintain traceability invariants
    challengingEvidenceIds: [], // Omitted to maintain traceability invariants
    unresolvedQuestions: [],
    primarySourceIds: undefined, // C11 doesn't distinguish primary vs supporting sources
    supportingSourceIds: undefined, // Omitted to maintain traceability invariants
    challengingSourceIds: undefined, // C11 conflicts don't expose source-level granularity
    unresolvedSourceIds: undefined
  });

  /**
   * P2-08D: Legacy Synthesis (Compatibility Artifact Only)
   *
   * Legacy synthesis is retained solely for diagnostic/compatibility purposes.
   * It is NOT used as the authoritative conclusion in the production path.
   * The canonical C11 result (canonicalC11Result) is the single authoritative source.
   *
   * This legacy result is exposed in conclusionData.careerFinalSynthesis for backward
   * compatibility with any existing consumers that have not yet migrated to canonical C11.
   * New code should read from conclusionData.canonicalCareerFinalSynthesis instead.
   */
  const legacyCareerFinalSynthesis = synthesizeCareerFinal({
    natalPromise: cw01Result.natalStrength,
    dashaSynthesis: careerDashaSynthesis,
    timingSynthesis: careerTimingSynthesis,
    manifestationSynthesis: careerManifestationSynthesis,
    d10Synthesis: d10Evidence,
    d10Relationship,
    natalEvidenceIds: natalPromiseEvidenceIds,
    natalRuleIds: natalPromiseEvidence.map((e) => e.ruleId ?? e.id).filter(Boolean)
  });

  /**
   * P2-08D: Trace Adapter for Canonical C11 → Reasoning Trace Graph
   *
   * The reasoning trace graph builder expects a legacy CareerWealthFinalSynthesis shape.
   * This adapter maps canonical C11 fields to the legacy shape without fabricating data.
   *
   * Mapping strategy:
   * - promiseStatus: derived from C11 natalDirection/natalStrength
   * - activationStatus: derived from C11 dashaEffect
   * - timingStatus: derived from C11 timingStatus
   * - divisionalStatus: derived from C11 d10Direction
   * - manifestationStatus: derived from C11 expressionStatus
   * - finalStatus/confidence: direct from C11
   *
   * P2-08D-04: Typed Adapter Contract
   *
   * This interface defines the exact shape required by buildCareerReasoningTraceGraph
   * for the careerFinalSynthesis parameter. It structurally matches the subset of
   * CareerWealthFinalSynthesis that the trace builder actually reads.
   */
  interface C11TraceGraphShape {
    readonly promiseStatus: string;
    readonly activationStatus: string;
    readonly timingStatus: string;
    readonly divisionalStatus: string;
    readonly manifestationStatus: string;
    readonly finalStatus: string;
    readonly confidence: string;
  }

  const legacyShapeForTraceGraph: C11TraceGraphShape = Object.freeze({
    promiseStatus: mapC11DirectionToLegacyStatus(canonicalC11Result.natalDirection, canonicalC11Result.natalStrength),
    activationStatus: mapC11DashaEffectToLegacyStatus(canonicalC11Result.dashaEffect),
    timingStatus: mapC11TimingStatusToLegacyStatus(canonicalC11Result.timingStatus),
    divisionalStatus: mapC11DirectionToLegacyVarga(canonicalC11Result.d10Direction),
    manifestationStatus: mapC11DirectionToLegacyStatus(canonicalC11Result.expressionStatus, canonicalC11Result.finalStrength),
    finalStatus: canonicalC11Result.finalStatus,
    confidence: canonicalC11Result.confidence
  });

  const reasoningTraceGraph = buildCareerReasoningTraceGraph({
    evidence,
    natalStrength: cw01Result.natalStrength,
    careerDashaSynthesis,
    careerTimingSynthesis,
    d10Relationship,
    careerManifestationSynthesis,
    careerFinalSynthesis: legacyShapeForTraceGraph as CareerWealthFinalSynthesis // P2-08D: Use C11-derived shape for trace graph (typed as C11TraceGraphShape, asserted to full type for function signature compatibility)
  });

  return buildDomainInterpretation({
    domain: 'CAREER',
    evidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations: cw01Result.manifestations,
    conflicts,
    conclusion: c11AdaptedConclusion, // P2-08D: Use canonical C11 conclusion
    timingActivations,
    dataCompleteness,
    conclusionData: {
      ...conclusionData,
      currentActivation: cw01Result.currentActivation,
      currentPressure: cw01Result.currentPressure,
      careerDashaSynthesis,
      careerTimingSynthesis,
      careerManifestationSynthesis,
      careerFinalSynthesis: legacyCareerFinalSynthesis, // P2-08D: Legacy compatibility artifact (not authoritative)
      canonicalCareerFinalSynthesis: canonicalC11Result, // P2-08D: Canonical C11 result (authoritative)
      reasoningTraceGraph
    },
    reasoningTrace: cw01Result.reasoningTrace,
    reasoningVersion: 'CW-01' // Keep version as CW-01 for downstream compatibility
  }, {
    asOf: context.asOf
  });
}

export function buildCareerReasoningTraceGraph(params: {
  readonly evidence: readonly DomainEvidence[];
  readonly natalStrength?: DomainStrength;
  readonly careerDashaSynthesis?: CareerDashaSynthesis;
  readonly careerTimingSynthesis?: CareerTimingSynthesis;
  readonly d10Relationship?: VargaRelationship;
  readonly careerManifestationSynthesis?: readonly CareerManifestationSynthesis[];
  readonly careerFinalSynthesis: CareerWealthFinalSynthesis;
}): ReasoningTraceGraph {
  const traceBuilder = new ReasoningTraceBuilder('CAREER');
  const natalNodeId = traceBuilder.addConclusionNode({
    axis: 'NATAL',
    subjectKey: 'NATAL_PROMISE',
    label: `Natal Career Promise: ${params.careerFinalSynthesis.promiseStatus ?? params.natalStrength ?? 'UNKNOWN'}`
  });
  const dashaNodeId = traceBuilder.addConclusionNode({
    axis: 'DASHA',
    subjectKey: 'DASHA_ACTIVATION',
    label: `Career Dasha Activation: ${params.careerFinalSynthesis.activationStatus ?? params.careerDashaSynthesis?.combined?.combinedEffect ?? 'UNKNOWN'}`
  });
  const timingNodeId = traceBuilder.addConclusionNode({
    axis: 'TIMING',
    subjectKey: 'TIMING_TRIGGER',
    label: `Career Timing Trigger: ${params.careerFinalSynthesis.timingStatus ?? params.careerTimingSynthesis?.overallEffect ?? 'UNKNOWN'}`
  });
  const divisionalNodeId = traceBuilder.addConclusionNode({
    axis: 'DIVISIONAL',
    subjectKey: 'D10_CONFIRMATION',
    label: `D10 Relationship: ${params.careerFinalSynthesis.divisionalStatus ?? params.d10Relationship ?? 'NEUTRAL'}`
  });
  const manifestationNodeId = traceBuilder.addConclusionNode({
    type: 'MANIFESTATION',
    axis: 'MANIFESTATION',
    subjectKey: 'CAREER_MANIFESTATION',
    label: `Career Manifestations: ${params.careerFinalSynthesis.manifestationStatus ?? (params.careerManifestationSynthesis?.length ? `${params.careerManifestationSynthesis.length} synthesized` : 'None')}`
  });
  const finalNodeId = traceBuilder.addConclusionNode({
    type: 'SYNTHESIS',
    axis: 'FINAL',
    subjectKey: 'FINAL_SYNTHESIS',
    label: `Career Final Status: ${params.careerFinalSynthesis.finalStatus} (${params.careerFinalSynthesis.confidence})`
  });

  for (const e of params.evidence) {
    if (e.provenance) {
      const evNodeId = traceBuilder.addEvidenceNode({
        provenance: e.provenance,
        label: e.statement,
        subjectKey: e.provenance.ruleId
      });
      const targetNodeId =
        e.provenance.axis === 'NATAL'
          ? natalNodeId
          : e.provenance.axis === 'DASHA'
            ? dashaNodeId
            : e.provenance.axis === 'TIMING'
              ? timingNodeId
              : e.provenance.axis === 'DIVISIONAL'
                ? divisionalNodeId
                : e.provenance.axis === 'MANIFESTATION'
                  ? manifestationNodeId
                  : natalNodeId;

      let edgeType: ReasoningEdgeType | undefined;
      if (e.provenance.effect === 'CHALLENGE') {
        edgeType = 'CHALLENGES';
      } else if (e.provenance.effect === 'SUPPORT') {
        if (e.provenance.axis === 'DASHA' || e.provenance.axis === 'TIMING') {
          edgeType = 'ACTIVATES';
        } else if (e.provenance.axis === 'DIVISIONAL') {
          edgeType = 'CONFIRMS';
        } else if (e.provenance.axis === 'MANIFESTATION') {
          edgeType = 'MANIFESTS';
        } else {
          edgeType = 'SUPPORTS';
        }
      } else if (e.provenance.effect === 'MIXED') {
        // MIXED evidence doesn't create a single directional edge
        // It represents conflicting influences that are tracked separately
        edgeType = undefined;
      }

      if (edgeType) {
        traceBuilder.addEdge({
          fromNodeId: evNodeId,
          toNodeId: targetNodeId,
          type: edgeType,
          explanation: `${e.provenance.ruleId} ${edgeType.toLowerCase()} ${e.provenance.axis.toLowerCase()} conclusion`
        });
      }
    }
  }

  // Natal -> Final: derived from params.careerFinalSynthesis.promiseStatus
  const natalEdgeType = mapPromiseStatusToEdgeType(params.careerFinalSynthesis.promiseStatus);
  if (natalEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: natalNodeId,
      toNodeId: finalNodeId,
      type: natalEdgeType,
      explanation: `Natal promise foundation ${natalEdgeType.toLowerCase()} final career synthesis`
    });
  }

  // Dasha -> Final: derived from params.careerFinalSynthesis.activationStatus
  const dashaEdgeType = mapActivationStatusToEdgeType(params.careerFinalSynthesis.activationStatus);
  if (dashaEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: dashaNodeId,
      toNodeId: finalNodeId,
      type: dashaEdgeType,
      explanation: `Dasha activation ${dashaEdgeType.toLowerCase()} final career synthesis`
    });
  }

  // Timing -> Final: derived from params.careerFinalSynthesis.timingStatus
  const timingEdgeType = mapTimingStatusToEdgeType(params.careerFinalSynthesis.timingStatus);
  if (timingEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: timingNodeId,
      toNodeId: finalNodeId,
      type: timingEdgeType,
      explanation: `Career timing trigger ${timingEdgeType.toLowerCase()} final career synthesis`
    });
  }

  // Divisional -> Final: derived from params.careerFinalSynthesis.divisionalStatus
  const d10EdgeType = mapDivisionalRelationshipToEdgeType(params.careerFinalSynthesis.divisionalStatus);
  if (d10EdgeType) {
    traceBuilder.addEdge({
      fromNodeId: divisionalNodeId,
      toNodeId: finalNodeId,
      type: d10EdgeType,
      explanation: `D10 varga confirmation ${d10EdgeType.toLowerCase()} final career synthesis`
    });
  }

  // Manifestation -> Final: derived from params.careerFinalSynthesis.manifestationStatus
  const manifestationEdgeType = mapManifestationStatusToEdgeType(params.careerFinalSynthesis.manifestationStatus);
  if (manifestationEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: manifestationNodeId,
      toNodeId: finalNodeId,
      type: manifestationEdgeType,
      explanation: 'Synthesized career manifestations qualify final career outcome'
    });
  }

  const graph = traceBuilder.build();
  validateReasoningTrace(graph);
  validateEvidenceNodes(graph, new Set(params.evidence.map((e) => e.id)));
  return graph;
}

export function buildCareerTimingStatement(
  period: 'MD' | 'AD' | 'PD',
  effect: TimingActivationEffect
): string {
  switch (effect) {
    case 'ACTIVATES':
      return `${period} period lord actively supports and activates natal career promise.`;
    case 'PARTIALLY_ACTIVATES':
      return `${period} period lord partially activates career potential alongside concurrent adjustments.`;
    case 'CHALLENGES':
      return `${period} period lord introduces timing friction or challenges to career initiatives.`;
    case 'DOES_NOT_ACTIVATE':
      return `${period} period lord does not directly activate natal career promise.`;
    case 'INSUFFICIENT_DATA':
      return `${period} timing data is insufficient or unavailable.`;
    case 'UNKNOWN':
    default:
      return `${period} activation could not be established from linked natal career evidence.`;
  }
}

export function evaluateCareerTimingActivation(
  period: 'MD' | 'AD' | 'PD',
  timingEvidence: readonly DomainEvidence[],
  natalPromiseEvidenceIds: readonly string[],
  planet?: Planet
): CareerTimingActivation {
  const periodEvidence = timingEvidence.filter((e) => e.timing?.period === period);
  const resolvedPlanet =
    planet ||
    periodEvidence.find((e) => e.timing?.planet)?.timing?.planet ||
    undefined;

  if (periodEvidence.length === 0) {
    return Object.freeze({
      period,
      ...(resolvedPlanet ? { planet: resolvedPlanet } : {}),
      effect: 'INSUFFICIENT_DATA',
      activatedPromiseEvidenceIds: Object.freeze([]),
      evidenceIds: Object.freeze([]),
      statement: `${period} timing data is insufficient or unavailable.`
    });
  }

  const linkedEvidence = periodEvidence.filter((item) =>
    item.relatedEvidenceIds.some((id) => natalPromiseEvidenceIds.includes(id))
  );

  if (linkedEvidence.length === 0) {
    return Object.freeze({
      period,
      ...(resolvedPlanet ? { planet: resolvedPlanet } : {}),
      effect: 'UNKNOWN',
      activatedPromiseEvidenceIds: Object.freeze([]),
      evidenceIds: Object.freeze(periodEvidence.map((item) => item.id)),
      statement: `${period} activation could not be established from linked natal career evidence.`
    });
  }

  const support = linkedEvidence.some((item) => item.polarity === 'SUPPORTING');
  const challenge = linkedEvidence.some((item) => item.polarity === 'CHALLENGING');

  let effect: TimingActivationEffect;
  if (support && challenge) {
    effect = 'PARTIALLY_ACTIVATES';
  } else if (support) {
    effect = 'ACTIVATES';
  } else if (challenge) {
    effect = 'CHALLENGES';
  } else {
    effect = 'DOES_NOT_ACTIVATE';
  }

  const activatedPromiseEvidenceIds = Array.from(
    new Set(linkedEvidence.flatMap((item) => item.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))))
  );

  return Object.freeze({
    period,
    ...(resolvedPlanet ? { planet: resolvedPlanet } : {}),
    effect,
    activatedPromiseEvidenceIds: Object.freeze(activatedPromiseEvidenceIds),
    evidenceIds: Object.freeze(periodEvidence.map((item) => item.id)),
    statement: buildCareerTimingStatement(period, effect)
  });
}

export function evaluateDashaEffect(
  dashaEvidence: readonly DomainEvidence[],
  activatedPromiseEvidenceIds?: readonly string[]
): TimingActivationEffect {
  if (dashaEvidence.length === 0) {
    return 'INSUFFICIENT_DATA';
  }
  const linkedPromiseIds = activatedPromiseEvidenceIds
    ? new Set(activatedPromiseEvidenceIds)
    : new Set(dashaEvidence.flatMap((e) => e.relatedEvidenceIds));

  if (linkedPromiseIds.size === 0) {
    return 'UNKNOWN';
  }

  const hasSupport = dashaEvidence.some((e) => e.polarity === 'SUPPORTING');
  const hasChallenge = dashaEvidence.some((e) => e.polarity === 'CHALLENGING');

  if (hasSupport && !hasChallenge) {
    return 'ACTIVATES';
  }
  if (hasSupport && hasChallenge) {
    return 'PARTIALLY_ACTIVATES';
  }
  if (hasChallenge && !hasSupport) {
    return 'CHALLENGES';
  }
  return 'ACTIVATES';
}

export function evaluateTransitEffect(
  transitEvidence: readonly DomainEvidence[],
  triggeredPromiseEvidenceIds?: readonly string[]
): TransitTriggerEffect {
  if (transitEvidence.length === 0) {
    return 'NO_MATERIAL_TRIGGER';
  }
  const linkedPromiseIds = triggeredPromiseEvidenceIds
    ? new Set(triggeredPromiseEvidenceIds)
    : new Set(transitEvidence.flatMap((e) => e.relatedEvidenceIds));

  if (linkedPromiseIds.size === 0) {
    return 'UNKNOWN';
  }

  const hasSupport = transitEvidence.some((e) => e.polarity === 'SUPPORTING');
  const hasChallenge = transitEvidence.some((e) => e.polarity === 'CHALLENGING');

  if (hasSupport && !hasChallenge) {
    return 'TRIGGER';
  }
  if (hasSupport && hasChallenge) {
    return 'MODIFIER';
  }
  if (hasChallenge && !hasSupport) {
    return 'CHALLENGE';
  }
  return 'TRIGGER';
}

export function evaluateD10Relationship(
  rawEvidence?: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[],
  legacyStatus?: string,
  d10Evidence?: readonly DomainEvidence[],
  natalPromiseEvidenceIds?: readonly string[]
): VargaRelationship {
  /**
   * P2-11C Gate 5: Single-source cutover for D10 relationship evaluation
   *
   * Primary path: canonical D10 evidence (d10Evidence from canonical mapper)
   * Fallback path: rawEvidence/legacyStatus for backward compatibility
   *
   * The fallback is intentionally retained because:
   * 1. Legacy consumers may still call this function with rawEvidence directly
   * 2. Theme interpretation D10 hints (vargaEvidence) are not currently emitted by canonical mapper
   * 3. The fallback provides graceful degradation for edge cases
   *
   * Future gate: Remove fallback when canonical D10 evidence fully replaces legacy D10 production
   */
  if (d10Evidence && d10Evidence.length === 0 && (!rawEvidence || rawEvidence.length === 0)) {
    return 'UNAVAILABLE';
  }

  // DomainEvidence-based path (primary)
  if (d10Evidence && d10Evidence.length > 0) {
    const linkedD10 =
      natalPromiseEvidenceIds && natalPromiseEvidenceIds.length > 0
        ? d10Evidence.filter((e) =>
          e.relatedEvidenceIds.some((id) => natalPromiseEvidenceIds.includes(id))
        )
        : d10Evidence;

    if (linkedD10.length > 0) {
      const hasSupport = linkedD10.some((e) => e.polarity === 'SUPPORTING');
      const hasChallenge = linkedD10.some((e) => e.polarity === 'CHALLENGING');
      if (hasSupport && !hasChallenge) return 'CONFIRMS';
      if (hasSupport && hasChallenge) return 'MODIFIES';
      if (hasChallenge && !hasSupport) return 'CONFLICTS';
    }
    // No linked D10 → do not fabricate; fall through to raw/legacy hints below.
  }

  // Fallback hints from raw evidence or legacy status
  const d10Item = rawEvidence?.find(
    (e) =>
      e.evidenceFamily === CareerEvidenceFamily.D10 ||
      e.vargaEvidence?.varga === 'D10'
  );

  if (d10Item?.vargaEvidence?.relationship) {
    return d10Item.vargaEvidence.relationship as VargaRelationship;
  }

  if (legacyStatus === 'CONFIRMED' || legacyStatus === 'CONFIRMS') {
    return 'CONFIRMS';
  }
  if (legacyStatus === 'CONFLICTED' || legacyStatus === 'CONFLICTS') {
    return 'CONFLICTS';
  }
  if (legacyStatus === 'NOT_APPLICABLE' || legacyStatus === 'UNAVAILABLE') {
    return 'UNAVAILABLE';
  }

  if (d10Item) {
    if (d10Item.effect === 'SUPPORT') {
      return 'CONFIRMS';
    }
    if (d10Item.effect === 'CHALLENGE') {
      return 'CONFLICTS';
    }
    return 'MODIFIES';
  }

  return 'UNAVAILABLE';
}

// Re-exports from modular files for full backward compatibility
export {
  buildCareerEvidence,
  classifyCareerEvidence,
  mapCareerRole,
  mapCareerPhase,
  mapCareerSource,
  mapCareerPolarity,
  mapCareerStrength,
  mapCareerPriority
} from './careerEvidenceMapper';

export {
  linkCareerEvidence,
  resolveRelatedCareerPromiseEvidenceIds
} from './careerEvidenceLinker';

export {
  deriveCareerManifestations,
  buildCareerManifestations,
  calculateManifestationConfidence
} from './careerManifestations';

export {
  buildCareerConclusion,
  buildCareerConclusionData,
  resolveCareerConclusionStrength,
  resolveCurrentActivation,
  resolveCurrentPressure,
  buildCareerHeadline,
  calculateDomainStrength,
  calculateVargaStrength,
  buildCareerNatalStatement,
  buildCareerDashaStatement,
  buildCareerTransitStatement,
  buildD10Statement
} from './careerConclusion';

export { calculateCareerDataCompleteness } from './careerDataCompleteness';
export * from './careerTypes';

/**
 * Comparison-only legacy path helper for debugging/test infrastructure.
 * This function does NOT alter the returned DomainInterpretation and is gated
 * behind an explicit flag (default off). It compares legacy structural interpretation
 * with the canonical C4 structural reasoning for A/B testing purposes.
 * 
 * @param horoscope - The horoscope to analyze
 * @param options - Domain reasoning options
 * @param enableComparison - Flag to enable comparison (default false)
 * @returns Comparison result object (side-effect-free, does not affect interpretation)
 */
export function compareLegacyAndCanonicalStructuralReasoning(
  horoscope: Horoscope,
  options: DomainReasoningOptions,
  enableComparison: boolean = false
): {
  enabled: boolean;
  canonicalStructural: CareerStructuralReasoning;
  legacyEvidence: readonly DomainEvidence[];
  comparisonNotes: string[];
} {
  if (!enableComparison) {
    return {
      enabled: false,
      canonicalStructural: {
        direction: 'UNAVAILABLE',
        strength: 'UNDETERMINED',
        primarySupport: 0,
        primaryChallenge: 0,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Comparison disabled'
      } as CareerStructuralReasoning,
      legacyEvidence: [],
      comparisonNotes: ['Comparison disabled by default']
    };
  }

  // Build canonical C4 structural reasoning
  const canonicalStructural = buildCareerStructuralReasoning({ horoscope });

  // Extract legacy structural evidence from theme interpretation
  const themeInterpretation = interpretCareerTheme({
    horoscope,
    dashaInterpretation: options.temporalState.dashaInterpretation
  });
  const rawEvidence = themeInterpretation.evidence;
  const rawMappedEvidence = buildCareerEvidence(rawEvidence);
  const legacyEvidence = linkCareerEvidence(rawMappedEvidence);

  // Filter for legacy structural evidence (NATAL_STRUCTURE dimension)
  // Note: DomainEvidence does not preserve the dimension field from ThemeInterpretationEvidence,
  // so we filter by source and evidenceFamily instead
  const legacyStructuralEvidence = legacyEvidence.filter(
    (e) => e.source === 'D1' && (
      e.evidenceFamily === 'TENTH_HOUSE' ||
      e.evidenceFamily === 'TENTH_LORD' ||
      e.evidenceFamily === 'SIXTH_HOUSE' ||
      e.evidenceFamily === 'SIXTH_LORD' ||
      e.evidenceFamily === 'SECOND_HOUSE' ||
      e.evidenceFamily === 'SECOND_LORD' ||
      e.evidenceFamily === 'ELEVENTH_HOUSE' ||
      e.evidenceFamily === 'ELEVENTH_LORD'
    )
  );

  const comparisonNotes: string[] = [
    `Canonical C4 evidence count: ${canonicalStructural.evidence.length}`,
    `Legacy structural evidence count: ${legacyStructuralEvidence.length}`,
    `Canonical direction: ${canonicalStructural.direction}`,
    `Canonical strength: ${canonicalStructural.strength}`
  ];

  return {
    enabled: true,
    canonicalStructural,
    legacyEvidence: legacyStructuralEvidence,
    comparisonNotes
  };
}
