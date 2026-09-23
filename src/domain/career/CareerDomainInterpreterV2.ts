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
  buildCareerEvidence,
  classifyCareerEvidence,
  mapCareerRole,
  mapCareerPhase,
  mapCareerSource,
  mapCareerPolarity,
  mapCareerStrength,
  mapCareerPriority
} from './careerEvidenceMapper';
import {
  linkCareerEvidence,
  resolveRelatedCareerPromiseEvidenceIds
} from './careerEvidenceLinker';
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
// C4-C11 Pipeline Integration
import {
  resolveCareerStructuralReasoning,
  type CareerStructuralReasoning
} from './careerStructuralReasoning';
import {
  interpretCareerPlanetaryRelevance,
  interpretCareerPlanetaryRelevanceBatch,
  type CareerPlanetaryRelevance,
  type CareerPlanetaryRelevanceContext
} from './careerPlanetaryRelevance';
import {
  resolveCareerExpression,
  type CareerExpressionAnalysis,
  type CareerExpressionContext,
  type CareerExpressionPlanetContext
} from './careerExpression';
import {
  interpretCareerHouseRelationships
} from './careerHouseRelationshipSemantics';
import {
  interpretCareerLordRelationships
} from './careerLordRelationshipSemantics';
import type {
  CareerHouseRelationship
} from './careerHouseRelationship';
import {
  classifyCareerHouse
} from './careerTypes';

/**
 * ARCHITECTURAL NOTE: Canonical C11 Final Synthesis Boundary
 *
 * The canonical type contract for Career Final Synthesis is now defined at:
 * src/domain/career/careerFinalSynthesis/careerFinalSynthesisTypes.ts
 *
 * This interpreter currently uses the legacy synthesis implementation from
 * src/domain/careerWealth/finalSynthesis/careerFinalSynthesis.ts for backward
 * compatibility and to preserve current runtime behavior.
 *
 * The legacy types in careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes.ts
 * are marked as deprecated and will be migrated to re-export from the canonical C11
 * boundary in a future update.
 *
 * Future migration will rewire this interpreter to use the canonical C11 synthesis
 * implementation from src/domain/career/careerFinalSynthesis/careerFinalSynthesis.ts
 * while preserving the existing output shape and runtime behavior.
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
  const rawMappedEvidence = buildCareerEvidence(rawEvidence);
  const evidence = linkCareerEvidence(rawMappedEvidence);

  // C4-C11 Pipeline Integration
  // Extract house relationships from theme interpretation for structural reasoning
  const careerHouseRelationships: CareerHouseRelationship[] = rawEvidence
    .filter((e) => e.careerHouseRelationship)
    .map((e) => e.careerHouseRelationship!)
    .filter(Boolean);

  // C4: Structural Reasoning
  const houseRelationshipSemantics = interpretCareerHouseRelationships(careerHouseRelationships);
  const structuralReasoning = resolveCareerStructuralReasoning(houseRelationshipSemantics);

  // C5: Planetary Relevance
  // Build planetary relevance contexts from horoscope data
  const planetaryRelevanceContexts: CareerPlanetaryRelevanceContext[] = [];
  for (const planet of Object.values(Planet)) {
    if (planet === Planet.RAHU || planet === Planet.KETU) continue; // Skip nodes

    const planetData = horoscope.planets[planet];
    if (!planetData) continue;

    const ruledHouses = planetData.ruledHouses || [];
    const occupiedHouse = planetData.house;
    const aspectsCareerHouse = planetData.aspects?.filter((h: number) =>
      classifyCareerHouse(h) !== 'NEUTRAL'
    ) || [];

    // Check for career relationship participation
    const careerRelationshipPlanets: Planet[] = careerHouseRelationships
      .filter((r) => r.lordA === planet || r.lordB === planet)
      .map((r) => (r.lordA === planet ? r.lordB : r.lordA))
      .filter(Boolean) as Planet[];

    const context: CareerPlanetaryRelevanceContext = {
      planet,
      ruledHouses,
      occupiedHouse,
      aspectsCareerHouse,
      careerRelationshipPlanets,
      careerYogaParticipation: false, // TODO: Integrate yoga detection
      naturalCareerKaraka: planet === Planet.SATURN, // Saturn is natural career karaka
      explicitCareerRelevant: false // TODO: Integrate explicit rules
    };
    planetaryRelevanceContexts.push(context);
  }

  const planetaryRelevanceResults = interpretCareerPlanetaryRelevanceBatch(planetaryRelevanceContexts);

  // C8: Expression Analysis
  // Build expression context from structural reasoning and planetary relevance
  const expressionPlanetContexts: CareerExpressionPlanetContext[] = planetaryRelevanceResults
    .filter((pr) => pr.relevance !== 'NEUTRAL')
    .map((pr) => ({
      planet: pr.planet,
      relevance: pr.relevance,
      roles: pr.roles,
      effect: pr.effect,
      condition: 'MODERATE', // TODO: Integrate proper condition assessment
      relatedHouses: pr.relatedHouses,
      relatedPlanets: pr.relatedPlanets
    }));

  const expressionContext: CareerExpressionContext = {
    structuralDirection: structuralReasoning.direction,
    structuralStrength: structuralReasoning.strength,
    structuralPrimarySupport: structuralReasoning.primarySupport,
    structuralPrimaryChallenge: structuralReasoning.primaryChallenge,
    relevantPlanets: expressionPlanetContexts
  };

  const expressionAnalysis = resolveCareerExpression(expressionContext);

  // Transform C4-C11 outputs into DomainEvidence
  const c4Evidence: DomainEvidence[] = structuralReasoning.evidence.map((se) =>
    createDomainEvidence({
      id: se.id,
      sourceType: 'STRUCTURAL_REASONING',
      domain: 'CAREER',
      role: se.role === 'PRIMARY' ? 'PRIMARY' : se.role === 'SUPPORTING' ? 'SUPPORTING' : se.role === 'CHALLENGING' ? 'CHALLENGING' : 'MODIFIER',
      phase: 'NATAL_PROMISE',
      source: 'C4_STRUCTURAL',
      polarity: se.direction === 'SUPPORT' ? 'SUPPORTING' : se.direction === 'CHALLENGE' ? 'CHALLENGING' : 'NEUTRAL',
      strength: se.weight >= 3 ? 'STRONG' : se.weight >= 2 ? 'MODERATE' : 'WEAK',
      priority: se.role === 'PRIMARY' ? 1 : se.role === 'SUPPORTING' ? 2 : 3,
      ruleId: se.id,
      house: se.relationship.houseA,
      statement: se.statement
    })
  );

  const c5Evidence: DomainEvidence[] = planetaryRelevanceResults
    .filter((pr) => pr.relevance !== 'NEUTRAL')
    .map((pr) =>
      createDomainEvidence({
        id: `C5_PLANETARY_${pr.planet}`,
        sourceType: 'PLANETARY_RELEVANCE',
        domain: 'CAREER',
        role: pr.relevance === 'PRIMARY' ? 'PRIMARY' : pr.relevance === 'SUPPORTING' ? 'SUPPORTING' : 'MODIFIER',
        phase: 'NATAL_PROMISE',
        source: 'C5_PLANETARY',
        polarity: pr.effect === 'SUPPORT' ? 'SUPPORTING' : pr.effect === 'CHALLENGE' ? 'CHALLENGING' : 'NEUTRAL',
        strength: pr.relevance === 'PRIMARY' ? 'STRONG' : pr.relevance === 'SUPPORTING' ? 'MODERATE' : 'WEAK',
        priority: pr.relevance === 'PRIMARY' ? 1 : pr.relevance === 'SUPPORTING' ? 2 : 3,
        ruleId: `C5_${pr.planet}`,
        statement: pr.statement
      })
    );

  const c8Evidence: DomainEvidence[] = expressionAnalysis.expressions
    .filter((expr) => expr.direction === 'SUPPORTED' || expr.direction === 'CONDITIONAL')
    .map((expr) =>
      createDomainEvidence({
        id: `C8_EXPRESSION_${expr.mode}`,
        sourceType: 'EXPRESSION_ANALYSIS',
        domain: 'CAREER',
        role: 'MANIFESTATION',
        phase: 'NATAL_PROMISE',
        source: 'C8_EXPRESSION',
        polarity: expr.direction === 'SUPPORTED' ? 'SUPPORTING' : 'NEUTRAL',
        strength: expr.strength === 'STRONG' ? 'STRONG' : expr.strength === 'MODERATE' ? 'MODERATE' : 'WEAK',
        priority: 4, // Manifestation is lower priority than structural/planetary
        ruleId: `C8_${expr.mode}`,
        statement: expr.statement
      })
    );

  // Merge legacy evidence with C4-C11 evidence
  const mergedEvidence = Object.freeze([...evidence, ...c4Evidence, ...c5Evidence, ...c8Evidence]);
  const finalEvidence = linkCareerEvidence(mergedEvidence);

  const supportingEvidence = finalEvidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = finalEvidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalSupporting = supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalPromiseEvidence = finalEvidence.filter((item) => item.phase === 'NATAL_PROMISE');
  const natalPromiseEvidenceIds = natalPromiseEvidence.map((item) => item.id);

  const conflicts = detectDomainConflicts('CAREER', finalEvidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const dataCompleteness = calculateCareerDataCompleteness(evidence, rawEvidence);

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

  const activeDashaReport = options.temporalState.dashaInterpretation;
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
  // INVARIANT & ARCHITECTURAL CONTRACT:
  // (a) Traceability vs. Natal Scoring Non-Double-Counting Invariant:
  //     These DASHA-sourced evidence items are injected into `mergedEvidence` for traceability and auditability only.
  //     The manifestation resolver (synthesizeCareerManifestations / resolveManifestation) explicitly excludes
  //     items with `source === 'DASHA'` from natal scoring and reads dasha contributions directly from the
  //     separate `careerDashaSynthesis` parameter, guaranteeing zero double-counting of dasha influences.
  // (b) Strength vs. Priority Distinction:
  //     `strength` here encodes factor magnitude (derived from `f.weight >= 2.0` -> 'STRONG' vs 'MODERATE')
  //     while `priority` (derived from `getCareerDashaEvidencePriority`) encodes the MD > AD > PD temporal and
  //     semantic hierarchy. These two are intentionally distinct orthogonal concepts.
  // TODO: Architectural note on evidence roles: Dasha factor evidence currently uses a blanket `role: 'MODIFIER'`.
  //       A period-derived role mapping (e.g. MD -> PRIMARY-equivalent, AD -> MODIFIER, PD -> REFINEMENT)
  //       can be evaluated if the EvidenceRole union is extended; currently the temporal/semantic hierarchy is cleanly
  //       governed by the `priority` field without risking cross-engine regressions.
  const dashaFactorsEvidence: readonly DomainEvidence[] = careerDashaSynthesis.factors.map((f) => {
    const priority = getCareerDashaEvidencePriority(f.period, f.category);

    return createDomainEvidence({
      id: f.id,
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'MODIFIER',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: f.statement,
      polarity: f.direction === 'SUPPORT' ? 'SUPPORTING' : f.direction === 'CHALLENGE' ? 'CHALLENGING' : 'NEUTRAL',
      strength: f.weight >= 2.0 ? 'STRONG' : 'MODERATE',
      priority,
      ruleId: f.id,
      ...(f.houses?.[0] !== undefined ? { house: f.houses[0] } : {})
    });
  });

  const mergedEvidence = Object.freeze([...evidence, ...dashaFactorsEvidence]);

  const conclusionData = buildCareerConclusionData(
    cw01Result.natalStrength,
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

  const careerFinalSynthesis = synthesizeCareerFinal({
    natalPromise: cw01Result.natalStrength,
    dashaSynthesis: careerDashaSynthesis,
    timingSynthesis: careerTimingSynthesis,
    manifestationSynthesis: careerManifestationSynthesis,
    d10Synthesis: d10Evidence,
    d10Relationship,
    natalEvidenceIds: natalPromiseEvidenceIds,
    natalRuleIds: natalPromiseEvidence.map((e) => e.ruleId ?? e.id).filter(Boolean)
  });

  const reasoningTraceGraph = buildCareerReasoningTraceGraph({
    evidence: mergedEvidence,
    natalStrength: cw01Result.natalStrength,
    careerDashaSynthesis,
    careerTimingSynthesis,
    d10Relationship,
    careerManifestationSynthesis,
    careerFinalSynthesis
  });

  return buildDomainInterpretation({
    domain: 'CAREER',
    evidence: mergedEvidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations: cw01Result.manifestations,
    conflicts,
    conclusion,
    timingActivations,
    dataCompleteness,
    conclusionData: {
      ...conclusionData,
      currentActivation: cw01Result.currentActivation,
      currentPressure: cw01Result.currentPressure,
      careerDashaSynthesis,
      careerTimingSynthesis,
      careerManifestationSynthesis,
      careerFinalSynthesis,
      reasoningTraceGraph
    },
    reasoningTrace: cw01Result.reasoningTrace,
    reasoningVersion: 'CW-01'
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
