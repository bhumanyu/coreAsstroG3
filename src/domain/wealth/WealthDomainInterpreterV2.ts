import type { Horoscope, Planet } from '../../types';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import {
  WealthEvidenceFamily,
  type WealthEvidence
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import {
  buildDomainInterpretation,
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
  WealthDimension,
  WealthDimensionStatus,
  WealthDimensionInterpretation,
  WealthDataCompleteness,
  WealthTimingActivation,
  WealthPeriodTimingActivation,
  WealthConclusionData,
  WealthEvidenceClassification,
  WealthManifestationMode
} from './wealthTypes';
import {
  buildWealthEvidence,
  classifyWealthEvidence,
  mapWealthRole,
  mapWealthPhase,
  mapWealthSource,
  mapWealthPolarity,
  mapWealthStrength,
  mapWealthPriority,
  mapWealthDimension,
  mapWealthDashaPeriod,
  isWealthTransitEvidence
} from './wealthEvidenceMapper';
import {
  linkWealthEvidence,
  resolveRelatedWealthPromiseEvidenceIds
} from './wealthEvidenceLinker';
import {
  deriveWealthManifestations,
  buildWealthManifestations,
  calculateManifestationConfidence,
  WEALTH_ACCUMULATION_FAMILIES,
  WEALTH_GAINS_FAMILIES,
  WEALTH_FORTUNE_FAMILIES,
  WEALTH_SPECULATION_FAMILIES
} from './wealthManifestations';
import {
  buildWealthConclusion,
  buildWealthConclusionData,
  buildWealthHeadline,
  resolveWealthConclusionStrength,
  calculateDomainStrength,
  calculateVargaStrength,
  buildWealthNatalStatement,
  buildWealthDashaStatement,
  buildWealthTransitStatement,
  buildD2Statement
} from './wealthConclusion';
import { calculateWealthDataCompleteness } from './wealthDataCompleteness';
import { calculateWealthConfidence } from './wealthConfidence';
import { detectWealthConflicts } from './wealthConflicts';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { evaluateWealthReasoningHierarchy } from './wealthReasoningHierarchy';
import { synthesizeWealthTiming, type WealthTimingSynthesis } from '../timing/careerWealthTiming';
import { synthesizeWealthManifestations } from './manifestation/wealthManifestationSynthesis';
import type { WealthManifestationSynthesis } from './manifestation/wealthManifestationTypes';
import { synthesizeWealthFinal } from '../careerWealth/finalSynthesis/wealthFinalSynthesis';
import type { CareerWealthFinalSynthesis } from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import {
  ReasoningTraceBuilder,
  validateEvidenceNodes,
  validateReasoningTrace,
  mapAxisStatusToEdgeType,
  mapActivationStatusToEdgeType,
  mapDivisionalRelationshipToEdgeType,
  mapManifestationStatusToEdgeType,
  mapPromiseStatusToEdgeType,
  type ReasoningEdgeType,
  type ReasoningTraceGraph
} from '../careerWealth/reasoningTrace';
import { getActiveDasha } from '../../engine/dasha/vimshottari';

export function interpretWealthV2(
  horoscope: Horoscope,
  options?: DomainReasoningOptions
): DomainInterpretation {
  const legacyWealth = interpretWealthTheme(horoscope);
  const rawEvidence = legacyWealth.evidence;
  const rawMappedEvidence = buildWealthEvidence(rawEvidence);
  const evidence = linkWealthEvidence(rawMappedEvidence);

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalEvidence = evidence.filter((item) => item.phase === 'NATAL_PROMISE');
  const natalSupporting = supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalPromiseEvidenceIds = natalEvidence.map((item) => item.id);

  // D2 Varga confirmation
  const d2Evidence = evidence.filter((item) => item.source === 'D2');
  const d2Relationship = evaluateD2Relationship(
    natalEvidence,
    d2Evidence,
    natalPromiseEvidenceIds,
    rawEvidence,
    legacyWealth.metadata?.vargaConfirmationStatus
  );

  // Dasha Timing & Multi-dimension evaluation
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

  const accumulationDasha = evaluateAccumulationDasha(dashaEvidence, evidence);
  const gainsDasha = evaluateGainsDasha(dashaEvidence, evidence);
  const fortuneDasha = evaluateFortuneDasha(dashaEvidence, evidence);
  const speculationDasha = evaluateSpeculationDasha(dashaEvidence, evidence);

  // Per-dimension evaluation
  const dimensions: readonly WealthDimensionInterpretation[] = Object.freeze([
    evaluateWealthDimension('ACCUMULATION', evidence, accumulationDasha),
    evaluateWealthDimension('GAINS', evidence, gainsDasha),
    evaluateWealthDimension('FORTUNE', evidence, fortuneDasha),
    evaluateWealthDimension('SPECULATION', evidence, speculationDasha)
  ]);

  const overallStatus = resolveOverallWealthStatus(dimensions);

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

  // Conflicts and completeness
  const conflicts = detectWealthConflicts(evidence, d2Relationship, dimensions, transitEvidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const dataCompleteness = calculateWealthDataCompleteness(evidence, rawEvidence);
  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);

  const natalConfidence = calculateEvidenceConfidence(natalEvidence, {
    dataCompleteness: dataCompleteness.primaryFactors === 'AVAILABLE' ? 'COMPLETE' : (dataCompleteness.primaryFactors === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT'),
    hasPrimaryChallenge,
    hasVargaConflict: false
  });

  const natalPromise = createNatalPromise({
    domain: 'WEALTH',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildWealthNatalStatement(
      supportingEvidence,
      challengingEvidence,
      legacyWealth.conclusion?.summary
    ),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((item) => item.id),
    challengingEvidenceIds: natalChallenging.map((item) => item.id)
  });

  const dashaActivation = createDashaActivation({
    domain: 'WEALTH',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildWealthDashaStatement(dashaEvidence, dashaEffect),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaPromiseEvidenceIds
  });

  const transitTrigger = createTransitTrigger({
    domain: 'WEALTH',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(transitSupporting, transitChallenging),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildWealthTransitStatement(transitEvidence, transitEffect),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitPromiseEvidenceIds
  });

  const vargaConfirmations: readonly VargaConfirmation[] = d2Evidence.length > 0
    ? [
        createVargaConfirmation({
          domain: 'WEALTH',
          varga: 'D2',
          relationship: d2Relationship,
          strength: calculateVargaStrength(evidence, 'D2'),
          confidence: calculateEvidenceConfidence(d2Evidence),
          statement: buildD2Statement(d2Evidence, d2Relationship),
          evidenceIds: d2Evidence.map((item) => item.id)
        })
      ]
    : [];

  // Multi-period timing (MD / AD / PD)
  const currentDasha = horoscope.dashaInterpretation?.current;

  const mdPlanet = currentDasha?.mahadasha?.planet;
  const adPlanet = currentDasha?.antardasha?.planet;
  const pdPlanet = currentDasha?.pratyantardasha?.planet;

  const mdPeriodTiming = evaluateWealthPeriodTimingActivation(
    'MD',
    dashaEvidence,
    evidence,
    natalPromiseEvidenceIds,
    mdPlanet
  );
  const adPeriodTiming = evaluateWealthPeriodTimingActivation(
    'AD',
    dashaEvidence,
    evidence,
    natalPromiseEvidenceIds,
    adPlanet
  );
  const pdPeriodTiming = evaluateWealthPeriodTimingActivation(
    'PD',
    dashaEvidence,
    evidence,
    natalPromiseEvidenceIds,
    pdPlanet
  );

  const periodTimingActivations: readonly WealthPeriodTimingActivation[] = Object.freeze([
    mdPeriodTiming,
    adPeriodTiming,
    pdPeriodTiming
  ]);

  // If CW01 strategy is requested, resolve through CW01 reasoning hierarchy
  if (options?.strategy === 'CW01') {
    const cw01Result = evaluateWealthReasoningHierarchy({
      evidence,
      dashaTimings: {
        md: {
          level: 'MD',
          effect: mdPeriodTiming.dimensions.accumulation === 'ACTIVATES' || mdPeriodTiming.dimensions.gains === 'ACTIVATES' ? 'ACTIVATES' : (mdPeriodTiming.dimensions.accumulation === 'CHALLENGES' ? 'CHALLENGES' : 'PARTIALLY_ACTIVATES'),
          evidenceIds: mdPeriodTiming.evidenceIds,
          confidence: 1.0
        },
        ad: {
          level: 'AD',
          effect: adPeriodTiming.dimensions.accumulation === 'ACTIVATES' || adPeriodTiming.dimensions.gains === 'ACTIVATES' ? 'ACTIVATES' : (adPeriodTiming.dimensions.accumulation === 'CHALLENGES' ? 'CHALLENGES' : 'PARTIALLY_ACTIVATES'),
          evidenceIds: adPeriodTiming.evidenceIds,
          confidence: 1.0
        },
        pd: {
          level: 'PD',
          effect: pdPeriodTiming.dimensions.accumulation === 'ACTIVATES' || pdPeriodTiming.dimensions.gains === 'ACTIVATES' ? 'ACTIVATES' : (pdPeriodTiming.dimensions.accumulation === 'CHALLENGES' ? 'CHALLENGES' : 'PARTIALLY_ACTIVATES'),
          evidenceIds: pdPeriodTiming.evidenceIds,
          confidence: 1.0
        }
      },
      transitEvidence,
      rawConflicts: conflicts
    });

    const accumulationStatus: WealthDimensionStatus = cw01Result.dimensionResults.ACCUMULATION.natalStrength === 'VERY_STRONG' || cw01Result.dimensionResults.ACCUMULATION.natalStrength === 'STRONG' ? 'STRONGLY_SUPPORTED' : (cw01Result.dimensionResults.ACCUMULATION.natalStrength === 'MODERATE' ? 'SUPPORTED' : 'CHALLENGED');
    const gainsStatus: WealthDimensionStatus = cw01Result.dimensionResults.GAINS.natalStrength === 'VERY_STRONG' || cw01Result.dimensionResults.GAINS.natalStrength === 'STRONG' ? 'STRONGLY_SUPPORTED' : (cw01Result.dimensionResults.GAINS.natalStrength === 'MODERATE' ? 'SUPPORTED' : 'CHALLENGED');
    const fortuneStatus: WealthDimensionStatus = cw01Result.dimensionResults.FORTUNE.natalStrength === 'VERY_STRONG' || cw01Result.dimensionResults.FORTUNE.natalStrength === 'STRONG' ? 'STRONGLY_SUPPORTED' : (cw01Result.dimensionResults.FORTUNE.natalStrength === 'MODERATE' ? 'SUPPORTED' : 'CHALLENGED');
    const speculationStatus: WealthDimensionStatus = cw01Result.dimensionResults.SPECULATION.natalStrength === 'VERY_STRONG' || cw01Result.dimensionResults.SPECULATION.natalStrength === 'STRONG' ? 'STRONGLY_SUPPORTED' : (cw01Result.dimensionResults.SPECULATION.natalStrength === 'MODERATE' ? 'SUPPORTED' : 'CHALLENGED');
    const overallStatus: WealthDimensionStatus = cw01Result.finalStrength === 'VERY_STRONG' || cw01Result.finalStrength === 'STRONG' ? 'STRONGLY_SUPPORTED' : (cw01Result.finalStrength === 'MODERATE' ? 'SUPPORTED' : 'CHALLENGED');

    const dimInterpretations: readonly WealthDimensionInterpretation[] = Object.freeze([
      {
        dimension: 'ACCUMULATION',
        status: accumulationStatus,
        supportingEvidenceIds: cw01Result.dimensionResults.ACCUMULATION.evidenceIds,
        challengingEvidenceIds: [],
        dashaEffect: cw01Result.dimensionResults.ACCUMULATION.timingEffect as TimingActivationEffect
      },
      {
        dimension: 'GAINS',
        status: gainsStatus,
        supportingEvidenceIds: cw01Result.dimensionResults.GAINS.evidenceIds,
        challengingEvidenceIds: [],
        dashaEffect: cw01Result.dimensionResults.GAINS.timingEffect as TimingActivationEffect
      },
      {
        dimension: 'FORTUNE',
        status: fortuneStatus,
        supportingEvidenceIds: cw01Result.dimensionResults.FORTUNE.evidenceIds,
        challengingEvidenceIds: [],
        dashaEffect: cw01Result.dimensionResults.FORTUNE.timingEffect as TimingActivationEffect
      },
      {
        dimension: 'SPECULATION',
        status: speculationStatus,
        supportingEvidenceIds: cw01Result.dimensionResults.SPECULATION.evidenceIds,
        challengingEvidenceIds: [],
        dashaEffect: cw01Result.dimensionResults.SPECULATION.timingEffect as TimingActivationEffect
      }
    ]);

    const conclusionData = buildWealthConclusionData({
      overallStatus,
      dimensions: dimInterpretations,
      d2Relationship: 'UNAVAILABLE',
      manifestations: cw01Result.manifestations,
      conflicts,
      evidence,
      periodTimingActivations
    });

    const conclusion = createDomainConclusion({
      domain: 'WEALTH',
      strength: cw01Result.finalStrength,
      confidence: calculateEvidenceConfidence(evidence, {
        dataCompleteness: dataCompleteness.primaryFactors === 'AVAILABLE' ? 'COMPLETE' : (dataCompleteness.primaryFactors === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT'),
        hasVargaConflict,
        hasPrimaryChallenge
      }),
      statement: buildWealthConclusion(
        natalPromise,
        dashaActivation,
        transitTrigger,
        legacyWealth.conclusion?.summary,
        {
          vargaConfirmations,
          conclusionData
        }
      ),
      primaryEvidenceIds: cw01Result.primaryEvidenceIds,
      supportingEvidenceIds: cw01Result.supportingEvidenceIds,
      challengingEvidenceIds: cw01Result.challengingEvidenceIds,
      unresolvedQuestions: []
    });

    const timingActivations = Object.freeze([
      { dimension: 'ACCUMULATION' as WealthDimension, effect: cw01Result.dimensionResults.ACCUMULATION.timingEffect as TimingActivationEffect },
      { dimension: 'GAINS' as WealthDimension, effect: cw01Result.dimensionResults.GAINS.timingEffect as TimingActivationEffect },
      { dimension: 'FORTUNE' as WealthDimension, effect: cw01Result.dimensionResults.FORTUNE.timingEffect as TimingActivationEffect },
      { dimension: 'SPECULATION' as WealthDimension, effect: cw01Result.dimensionResults.SPECULATION.timingEffect as TimingActivationEffect }
    ]);

    const wealthManifestationSynthesis = synthesizeWealthManifestations(
      evidence,
      undefined,
      'UNAVAILABLE'
    );

    const wealthFinalSynthesis = synthesizeWealthFinal({
      natalPromise: {
        ACCUMULATION: cw01Result.dimensionResults.ACCUMULATION.natalStrength,
        GAINS: cw01Result.dimensionResults.GAINS.natalStrength,
        FORTUNE: cw01Result.dimensionResults.FORTUNE.natalStrength,
        SPECULATION: cw01Result.dimensionResults.SPECULATION.natalStrength
      },
      manifestationSynthesis: wealthManifestationSynthesis,
      d2Synthesis: d2Evidence,
      d2Relationship: 'UNAVAILABLE',
      natalEvidenceIds: natalPromiseEvidenceIds,
      natalRuleIds: natalEvidence.map((e) => e.ruleId ?? e.id).filter(Boolean)
    });

    const reasoningTraceGraph = buildWealthReasoningTraceGraph({
      evidence,
      overallStatus: cw01Result.finalStrength,
      wealthTimingSynthesis: undefined,
      d2Relationship: 'UNAVAILABLE',
      wealthManifestationSynthesis,
      wealthFinalSynthesis
    });

    return buildDomainInterpretation({
      domain: 'WEALTH',
      evidence,
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      manifestations: cw01Result.manifestations,
      conflicts,
      conclusion,
      timingActivations,
      periodTimingActivations,
      dataCompleteness,
      conclusionData: {
        ...conclusionData,
        currentActivation: cw01Result.currentActivation,
        currentPressure: cw01Result.currentPressure,
        wealthManifestationSynthesis,
        wealthFinalSynthesis,
        reasoningTraceGraph
      },
      reasoningTrace: cw01Result.reasoningTrace,
      reasoningVersion: options?.strategy === 'CW01' ? 'CW-01' : undefined
    });
  }

  const manifestations = deriveWealthManifestations(evidence, rawEvidence);

  const conclusionStrength = resolveWealthConclusionStrength(
    natalStrength,
    d2Relationship,
    conflicts
  );

  const conclusionData = buildWealthConclusionData({
    overallStatus,
    dimensions,
    d2Relationship,
    manifestations,
    conflicts,
    evidence,
    periodTimingActivations
  });

  const conclusion = createDomainConclusion({
    domain: 'WEALTH',
    strength: conclusionStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      dataCompleteness: dataCompleteness.primaryFactors === 'AVAILABLE' ? 'COMPLETE' : (dataCompleteness.primaryFactors === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT'),
      hasVargaConflict,
      hasPrimaryChallenge
    }),
    statement: buildWealthConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      legacyWealth.conclusion?.summary,
      {
        vargaConfirmations,
        conclusionData
      }
    ),
    primaryEvidenceIds: evidence
      .filter((item) => item.priority >= 90 || item.role === 'PRIMARY')
      .map((item) => item.id),
    supportingEvidenceIds: supportingEvidence.map((item) => item.id),
    challengingEvidenceIds: challengingEvidence.map((item) => item.id),
    unresolvedQuestions: []
  });

  const timingActivations = Object.freeze([
    {
      dimension: 'ACCUMULATION' as WealthDimension,
      effect: accumulationDasha
    },
    {
      dimension: 'GAINS' as WealthDimension,
      effect: gainsDasha
    },
    {
      dimension: 'FORTUNE' as WealthDimension,
      effect: fortuneDasha
    },
    {
      dimension: 'SPECULATION' as WealthDimension,
      effect: speculationDasha
    }
  ]);

  const rawAsOf = options?.asOf ?? horoscope.dashaInterpretation?.at;
  const asOfDate = rawAsOf ? (typeof rawAsOf === 'string' ? new Date(rawAsOf) : rawAsOf) : undefined;

  const getDimStatus = (dim: WealthDimension): WealthDimensionStatus | undefined =>
    dimensions.find((d) => d.dimension === dim)?.status;

  const mapStatusToNatalPromise = (status?: WealthDimensionStatus): DomainStrength => {
    switch (status) {
      case 'STRONGLY_SUPPORTED':
        return 'STRONG';
      case 'SUPPORTED':
        return 'MODERATE';
      case 'MIXED':
        return 'MIXED';
      case 'CHALLENGED':
      case 'LIMITED':
        return 'WEAK';
      case 'INSUFFICIENT_DATA':
      default:
        return 'UNDETERMINED';
    }
  };

  const natalPromises: Partial<Record<WealthDimension, DomainStrength>> = {
    ACCUMULATION: mapStatusToNatalPromise(getDimStatus('ACCUMULATION')),
    GAINS: mapStatusToNatalPromise(getDimStatus('GAINS')),
    FORTUNE: mapStatusToNatalPromise(getDimStatus('FORTUNE')),
    SPECULATION: mapStatusToNatalPromise(getDimStatus('SPECULATION'))
  };

  let wealthTimingSynthesis: WealthTimingSynthesis;
  if (asOfDate && !isNaN(asOfDate.getTime())) {
    const activeDashaState = horoscope.vimshottari ? getActiveDasha(horoscope.vimshottari, asOfDate) : null;
    const mapActivationToEffect = (eff: string): 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA' => {
      if (eff === 'ACTIVATES' || eff === 'PARTIALLY_ACTIVATES') return 'SUPPORTS';
      if (eff === 'CHALLENGES') return 'CHALLENGES';
      if (eff === 'MODIFIES') return 'MIXED';
      return 'NEUTRAL';
    };
    const dashaEffects: Partial<Record<WealthDimension, 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA'>> = {
      ACCUMULATION: mapActivationToEffect(accumulationDasha),
      GAINS: mapActivationToEffect(gainsDasha),
      FORTUNE: mapActivationToEffect(fortuneDasha),
      SPECULATION: mapActivationToEffect(speculationDasha)
    };
    wealthTimingSynthesis = synthesizeWealthTiming(horoscope, activeDashaState, asOfDate, natalPromises, dashaEffects);
  } else {
    wealthTimingSynthesis = Object.freeze({
      dimensions: {
        ACCUMULATION: Object.freeze({
          dimension: 'ACCUMULATION',
          natalPromise: natalPromises.ACCUMULATION ?? 'UNDETERMINED',
          dashaEffect: 'INSUFFICIENT_DATA',
          transitEffect: 'INSUFFICIENT_DATA',
          overallEffect: 'INSUFFICIENT_DATA',
          confidence: 0.5,
          factors: Object.freeze([]),
          summary: 'Timing calculation unavailable: asOf date not provided.'
        }),
        GAINS: Object.freeze({
          dimension: 'GAINS',
          natalPromise: natalPromises.GAINS ?? 'UNDETERMINED',
          dashaEffect: 'INSUFFICIENT_DATA',
          transitEffect: 'INSUFFICIENT_DATA',
          overallEffect: 'INSUFFICIENT_DATA',
          confidence: 0.5,
          factors: Object.freeze([]),
          summary: 'Timing calculation unavailable: asOf date not provided.'
        }),
        FORTUNE: Object.freeze({
          dimension: 'FORTUNE',
          natalPromise: natalPromises.FORTUNE ?? 'UNDETERMINED',
          dashaEffect: 'INSUFFICIENT_DATA',
          transitEffect: 'INSUFFICIENT_DATA',
          overallEffect: 'INSUFFICIENT_DATA',
          confidence: 0.5,
          factors: Object.freeze([]),
          summary: 'Timing calculation unavailable: asOf date not provided.'
        }),
        SPECULATION: Object.freeze({
          dimension: 'SPECULATION',
          natalPromise: natalPromises.SPECULATION ?? 'UNDETERMINED',
          dashaEffect: 'INSUFFICIENT_DATA',
          transitEffect: 'INSUFFICIENT_DATA',
          overallEffect: 'INSUFFICIENT_DATA',
          confidence: 0.5,
          factors: Object.freeze([]),
          summary: 'Timing calculation unavailable: asOf date not provided.'
        })
      },
      overallSummary: 'Timing calculation unavailable: asOf date not provided.'
    });
  }

  const wealthManifestationSynthesis = synthesizeWealthManifestations(
    evidence,
    wealthTimingSynthesis,
    d2Relationship
  );

  const wealthFinalSynthesis = synthesizeWealthFinal({
    natalPromise: natalPromises,
    timingSynthesis: wealthTimingSynthesis,
    manifestationSynthesis: wealthManifestationSynthesis,
    d2Synthesis: d2Evidence,
    d2Relationship,
    natalEvidenceIds: natalPromiseEvidenceIds,
    natalRuleIds: natalEvidence.map((e) => e.ruleId ?? e.id).filter(Boolean)
  });

  const reasoningTraceGraph = buildWealthReasoningTraceGraph({
    evidence,
    overallStatus,
    wealthTimingSynthesis,
    d2Relationship,
    wealthManifestationSynthesis,
    wealthFinalSynthesis
  });

  return buildDomainInterpretation({
    domain: 'WEALTH',
    evidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations,
    conflicts,
    conclusion,
    timingActivations,
    periodTimingActivations,
    dataCompleteness,
    conclusionData: {
      ...conclusionData,
      wealthTimingSynthesis,
      wealthManifestationSynthesis,
      wealthFinalSynthesis,
      reasoningTraceGraph
    }
  });
}

export function buildWealthReasoningTraceGraph(params: {
  readonly evidence: readonly DomainEvidence[];
  readonly overallStatus?: WealthDimensionStatus | string;
  readonly wealthTimingSynthesis?: WealthTimingSynthesis;
  readonly d2Relationship?: VargaRelationship;
  readonly wealthManifestationSynthesis?: WealthManifestationSynthesis;
  readonly wealthFinalSynthesis: CareerWealthFinalSynthesis;
}): ReasoningTraceGraph {
  const traceBuilder = new ReasoningTraceBuilder('WEALTH');
  const natalNodeId = traceBuilder.addConclusionNode({
    axis: 'NATAL',
    subjectKey: 'NATAL_PROMISE',
    label: `Natal Wealth Promise: ${params.wealthFinalSynthesis.promiseStatus ?? params.overallStatus ?? 'UNKNOWN'}`
  });
  const dashaNodeId = traceBuilder.addConclusionNode({
    axis: 'DASHA',
    subjectKey: 'DASHA_ACTIVATION',
    label: `Wealth Dasha Activation: ${params.wealthFinalSynthesis.activationStatus ?? 'UNKNOWN'}`
  });
  const timingNodeId = traceBuilder.addConclusionNode({
    axis: 'TIMING',
    subjectKey: 'TIMING_TRIGGER',
    label: `Wealth Timing Trigger: ${params.wealthFinalSynthesis.timingStatus ?? 'UNKNOWN'}`
  });
  const divisionalNodeId = traceBuilder.addConclusionNode({
    axis: 'DIVISIONAL',
    subjectKey: 'D2_CONFIRMATION',
    label: `D2 Relationship: ${params.wealthFinalSynthesis.divisionalStatus ?? params.d2Relationship ?? 'NEUTRAL'}`
  });
  const manifestationNodeId = traceBuilder.addConclusionNode({
    type: 'MANIFESTATION',
    axis: 'MANIFESTATION',
    subjectKey: 'WEALTH_MANIFESTATION',
    label: `Wealth Manifestations: ${params.wealthFinalSynthesis.manifestationStatus ?? (params.wealthManifestationSynthesis ? 'Synthesized' : 'None')}`
  });
  const finalNodeId = traceBuilder.addConclusionNode({
    type: 'SYNTHESIS',
    axis: 'FINAL',
    subjectKey: 'FINAL_SYNTHESIS',
    label: `Wealth Final Status: ${params.wealthFinalSynthesis.finalStatus} (${params.wealthFinalSynthesis.confidence})`
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

  // Natal -> Final: derived from params.wealthFinalSynthesis.promiseStatus
  const natalEdgeType = mapPromiseStatusToEdgeType(params.wealthFinalSynthesis.promiseStatus ?? params.overallStatus);
  if (natalEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: natalNodeId,
      toNodeId: finalNodeId,
      type: natalEdgeType,
      explanation: `Natal promise foundation ${natalEdgeType.toLowerCase()} final wealth synthesis`
    });
  }

  // Dasha -> Final: derived from params.wealthFinalSynthesis.activationStatus
  const dashaEdgeType = mapActivationStatusToEdgeType(params.wealthFinalSynthesis.activationStatus);
  if (dashaEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: dashaNodeId,
      toNodeId: finalNodeId,
      type: dashaEdgeType,
      explanation: `Wealth dasha activation ${dashaEdgeType.toLowerCase()} final wealth synthesis`
    });
  }

  // Timing -> Final: derived from params.wealthFinalSynthesis.timingStatus
  const timingEdgeType = mapAxisStatusToEdgeType(params.wealthFinalSynthesis.timingStatus);
  if (timingEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: timingNodeId,
      toNodeId: finalNodeId,
      type: timingEdgeType,
      explanation: `Wealth timing trigger ${timingEdgeType.toLowerCase()} final wealth synthesis`
    });
  }

  // Divisional -> Final: derived from params.wealthFinalSynthesis.divisionalStatus
  const d2EdgeType = mapDivisionalRelationshipToEdgeType(params.wealthFinalSynthesis.divisionalStatus ?? params.d2Relationship);
  if (d2EdgeType) {
    traceBuilder.addEdge({
      fromNodeId: divisionalNodeId,
      toNodeId: finalNodeId,
      type: d2EdgeType,
      explanation: `D2 varga confirmation ${d2EdgeType.toLowerCase()} final wealth synthesis`
    });
  }

  // Manifestation -> Final: derived from params.wealthFinalSynthesis.manifestationStatus
  const manifestationEdgeType = mapManifestationStatusToEdgeType(params.wealthFinalSynthesis.manifestationStatus);
  if (manifestationEdgeType) {
    traceBuilder.addEdge({
      fromNodeId: manifestationNodeId,
      toNodeId: finalNodeId,
      type: manifestationEdgeType,
      explanation: 'Synthesized wealth manifestations qualify final wealth outcome'
    });
  }

  const graph = traceBuilder.build();
  validateReasoningTrace(graph);
  validateEvidenceNodes(graph, new Set(params.evidence.map((e) => e.id)));
  return graph;
}

export function evaluateD2Relationship(
  natalEvidence?: readonly DomainEvidence[],
  d2Evidence?: readonly DomainEvidence[],
  relatedNatalEvidenceIds?: readonly string[],
  rawEvidence?: readonly WealthEvidence[],
  legacyStatus?: string
): VargaRelationship {
  if (d2Evidence && d2Evidence.length === 0 && (!rawEvidence || rawEvidence.length === 0)) {
    return 'UNAVAILABLE';
  }

  // DomainEvidence-based path (primary)
  if (d2Evidence && d2Evidence.length > 0) {
    const relevantD2 =
      relatedNatalEvidenceIds && relatedNatalEvidenceIds.length > 0
        ? d2Evidence.filter((item) =>
            item.relatedEvidenceIds.some((id) =>
              relatedNatalEvidenceIds.includes(id)
            )
          )
        : d2Evidence;

    if (
      relatedNatalEvidenceIds &&
      relatedNatalEvidenceIds.length > 0 &&
      relevantD2.length === 0
    ) {
      return 'UNAVAILABLE';
    }

    const supporting = relevantD2.filter((item) => item.polarity === 'SUPPORTING');
    const challenging = relevantD2.filter((item) => item.polarity === 'CHALLENGING');

    if (supporting.length > 0 && challenging.length === 0) {
      return 'CONFIRMS';
    }
    if (supporting.length > 0 && challenging.length > 0) {
      return 'PARTIALLY_CONFIRMS';
    }
    if (challenging.length > 0 && supporting.length === 0) {
      return 'CONFLICTS';
    }
    return 'UNAVAILABLE';
  }

  // Fallback hints from raw evidence or legacy status only if d2Evidence is not provided
  const d2Item = rawEvidence?.find(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.D2 ||
      e.vargaEvidence?.varga === 'D2'
  );

  if (d2Item?.vargaEvidence?.relationship) {
    return d2Item.vargaEvidence.relationship as VargaRelationship;
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

  if (d2Item) {
    if (d2Item.effect === 'SUPPORT') {
      return 'CONFIRMS';
    }
    if (d2Item.effect === 'CHALLENGE') {
      return 'CONFLICTS';
    }
    return 'MODIFIES';
  }

  return 'UNAVAILABLE';
}

export function evaluateWealthTiming(
  timingEvidence: readonly DomainEvidence[],
  relevantFamilies: readonly WealthEvidenceFamily[],
  allEvidence?: readonly DomainEvidence[]
): TimingActivationEffect {
  if (timingEvidence.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const relevant = timingEvidence.filter((item) => {
    if (
      item.evidenceFamily &&
      relevantFamilies.includes(item.evidenceFamily as WealthEvidenceFamily)
    ) {
      return true;
    }
    if (allEvidence && item.relatedEvidenceIds.length > 0) {
      const linkedItems = allEvidence.filter((e) =>
        item.relatedEvidenceIds.includes(e.id)
      );
      if (
        linkedItems.some(
          (e) =>
            e.evidenceFamily &&
            relevantFamilies.includes(e.evidenceFamily as WealthEvidenceFamily)
        )
      ) {
        return true;
      }
      if (
        relevantFamilies.includes(WealthEvidenceFamily.SECOND_HOUSE) &&
        linkedItems.some((e) => e.dimension === 'ACCUMULATION')
      ) {
        return true;
      }
      if (
        relevantFamilies.includes(WealthEvidenceFamily.ELEVENTH_HOUSE) &&
        linkedItems.some((e) => e.dimension === 'GAINS')
      ) {
        return true;
      }
      if (
        relevantFamilies.includes(WealthEvidenceFamily.NINTH_HOUSE) &&
        linkedItems.some((e) => e.dimension === 'FORTUNE')
      ) {
        return true;
      }
      if (
        relevantFamilies.includes(WealthEvidenceFamily.FIFTH_HOUSE) &&
        linkedItems.some((e) => e.dimension === 'SPECULATION')
      ) {
        return true;
      }
    }
    return false;
  });

  if (relevant.length === 0) {
    return 'DOES_NOT_ACTIVATE';
  }

  const supporting = relevant.filter((item) => item.polarity === 'SUPPORTING');
  const challenging = relevant.filter((item) => item.polarity === 'CHALLENGING');

  if (supporting.length > 0 && challenging.length > 0) {
    return 'PARTIALLY_ACTIVATES';
  }
  if (supporting.length > 0) {
    return 'ACTIVATES';
  }
  if (challenging.length > 0) {
    return 'CHALLENGES';
  }

  return 'DOES_NOT_ACTIVATE';
}

export function evaluateAccumulationDasha(
  timingEvidence: readonly DomainEvidence[],
  allEvidence?: readonly DomainEvidence[]
): TimingActivationEffect {
  return evaluateWealthTiming(
    timingEvidence,
    [WealthEvidenceFamily.SECOND_HOUSE, WealthEvidenceFamily.SECOND_LORD],
    allEvidence
  );
}

export function evaluateGainsDasha(
  timingEvidence: readonly DomainEvidence[],
  allEvidence?: readonly DomainEvidence[]
): TimingActivationEffect {
  return evaluateWealthTiming(
    timingEvidence,
    [WealthEvidenceFamily.ELEVENTH_HOUSE, WealthEvidenceFamily.ELEVENTH_LORD],
    allEvidence
  );
}

export function evaluateFortuneDasha(
  timingEvidence: readonly DomainEvidence[],
  allEvidence?: readonly DomainEvidence[]
): TimingActivationEffect {
  return evaluateWealthTiming(
    timingEvidence,
    [
      WealthEvidenceFamily.NINTH_HOUSE,
      WealthEvidenceFamily.NINTH_LORD,
      WealthEvidenceFamily.JUPITER
    ],
    allEvidence
  );
}

export function evaluateSpeculationDasha(
  timingEvidence: readonly DomainEvidence[],
  allEvidence?: readonly DomainEvidence[]
): TimingActivationEffect {
  return evaluateWealthTiming(
    timingEvidence,
    [WealthEvidenceFamily.FIFTH_HOUSE, WealthEvidenceFamily.FIFTH_LORD],
    allEvidence
  );
}

export function resolveDimensionStatus(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[]
): WealthDimensionStatus {
  if (supporting.length === 0 && challenging.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  if (supporting.length > 0 && challenging.length === 0) {
    return supporting.some(
      (item) => item.strength === 'STRONG' || item.strength === 'VERY_STRONG'
    )
      ? 'STRONGLY_SUPPORTED'
      : 'SUPPORTED';
  }

  if (supporting.length === 0 && challenging.length > 0) {
    return 'CHALLENGED';
  }

  return 'MIXED';
}

export function evaluateWealthDimension(
  dimension: WealthDimension,
  evidence: readonly DomainEvidence[],
  dashaEffect: TimingActivationEffect
): WealthDimensionInterpretation {
  const supporting = evidence.filter(
    (item) => item.dimension === dimension && item.polarity === 'SUPPORTING'
  );

  const challenging = evidence.filter(
    (item) => item.dimension === dimension && item.polarity === 'CHALLENGING'
  );

  const status = resolveDimensionStatus(supporting, challenging);

  return Object.freeze({
    dimension,
    status,
    supportingEvidenceIds: Object.freeze(supporting.map((item) => item.id)),
    challengingEvidenceIds: Object.freeze(challenging.map((item) => item.id)),
    dashaEffect
  });
}

export function resolveOverallWealthStatus(
  dimensions: readonly WealthDimensionInterpretation[]
): WealthDimensionStatus {
  const getDim = (dimName: WealthDimension): WealthDimensionInterpretation | undefined =>
    dimensions.find((d) => d.dimension === dimName);

  const accumulation = getDim('ACCUMULATION');
  const gains = getDim('GAINS');
  const fortune = getDim('FORTUNE');
  const speculation = getDim('SPECULATION');

  const isStrong = (dim?: WealthDimensionInterpretation): boolean =>
    dim?.status === 'STRONGLY_SUPPORTED';

  const isSupported = (dim?: WealthDimensionInterpretation): boolean =>
    dim?.status === 'SUPPORTED' || dim?.status === 'STRONGLY_SUPPORTED';

  const isChallenged = (dim?: WealthDimensionInterpretation): boolean =>
    dim?.status === 'CHALLENGED';

  if (isStrong(accumulation) && isStrong(gains)) {
    return 'STRONGLY_SUPPORTED';
  }

  if (isSupported(accumulation) || isSupported(gains) || isStrong(fortune)) {
    return 'SUPPORTED';
  }

  if (isChallenged(accumulation) && isChallenged(gains)) {
    return 'CHALLENGED';
  }

  return 'MIXED';
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

export function evaluateWealthTimingActivation(
  period: 'MD' | 'AD' | 'PD',
  timingEvidence: readonly DomainEvidence[],
  natalPromiseEvidenceIds: readonly string[]
): WealthTimingActivation {
  const periodEvidence = timingEvidence.filter((e) => e.timing?.period === period);

  if (periodEvidence.length === 0) {
    return Object.freeze({
      period,
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
      effect: 'UNKNOWN',
      activatedPromiseEvidenceIds: Object.freeze([]),
      evidenceIds: Object.freeze(periodEvidence.map((item) => item.id)),
      statement: `${period} activation could not be established from linked natal wealth evidence.`
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
    new Set(
      linkedEvidence.flatMap((item) =>
        item.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))
      )
    )
  );

  return Object.freeze({
    period,
    effect,
    activatedPromiseEvidenceIds: Object.freeze(activatedPromiseEvidenceIds),
    evidenceIds: Object.freeze(periodEvidence.map((item) => item.id)),
    statement: `${period} period lord ${effect === 'ACTIVATES' ? 'actively supports' : effect === 'CHALLENGES' ? 'introduces challenges to' : 'partially activates'} natal wealth potential.`
  });
}

export function evaluateWealthPeriodTimingActivation(
  period: 'MD' | 'AD' | 'PD',
  dashaEvidence: readonly DomainEvidence[],
  allEvidence: readonly DomainEvidence[],
  natalPromiseEvidenceIds: readonly string[],
  planet?: Planet
): WealthPeriodTimingActivation {
  const periodEvidence = dashaEvidence.filter((e) => e.timing?.period === period);
  const resolvedPlanet =
    planet ||
    periodEvidence.find((e) => e.timing?.planet)?.timing?.planet ||
    undefined;

  if (periodEvidence.length === 0) {
    return Object.freeze({
      period,
      ...(resolvedPlanet ? { planet: resolvedPlanet } : {}),
      dimensions: Object.freeze({
        accumulation: 'INSUFFICIENT_DATA' as TimingActivationEffect,
        gains: 'INSUFFICIENT_DATA' as TimingActivationEffect,
        fortune: 'INSUFFICIENT_DATA' as TimingActivationEffect,
        speculation: 'INSUFFICIENT_DATA' as TimingActivationEffect
      }),
      evidenceIds: Object.freeze([]),
      effect: 'INSUFFICIENT_DATA',
      activatedPromiseEvidenceIds: Object.freeze([]),
      statement: `${period} timing data is insufficient or unavailable.`
    });
  }

  const accumulation = evaluateAccumulationDasha(periodEvidence, allEvidence);
  const gains = evaluateGainsDasha(periodEvidence, allEvidence);
  const fortune = evaluateFortuneDasha(periodEvidence, allEvidence);
  const speculation = evaluateSpeculationDasha(periodEvidence, allEvidence);

  const baseActivation = evaluateWealthTimingActivation(
    period,
    dashaEvidence,
    natalPromiseEvidenceIds
  );

  return Object.freeze({
    period,
    ...(resolvedPlanet ? { planet: resolvedPlanet } : {}),
    dimensions: Object.freeze({
      accumulation,
      gains,
      fortune,
      speculation
    }),
    evidenceIds: Object.freeze(periodEvidence.map((item) => item.id)),
    effect: baseActivation.effect,
    activatedPromiseEvidenceIds: baseActivation.activatedPromiseEvidenceIds,
    statement: baseActivation.statement
  });
}

// Re-exports for backward compatibility and clean modular imports
export {
  buildWealthEvidence,
  classifyWealthEvidence,
  mapWealthRole,
  mapWealthPhase,
  mapWealthSource,
  mapWealthPolarity,
  mapWealthStrength,
  mapWealthPriority,
  mapWealthDimension,
  mapWealthDashaPeriod,
  isWealthTransitEvidence
} from './wealthEvidenceMapper';

export {
  linkWealthEvidence,
  resolveRelatedWealthPromiseEvidenceIds
} from './wealthEvidenceLinker';

export {
  deriveWealthManifestations,
  buildWealthManifestations,
  calculateManifestationConfidence,
  WEALTH_ACCUMULATION_FAMILIES,
  WEALTH_GAINS_FAMILIES,
  WEALTH_FORTUNE_FAMILIES,
  WEALTH_SPECULATION_FAMILIES
} from './wealthManifestations';

export {
  buildWealthConclusion,
  buildWealthConclusionData,
  buildWealthHeadline,
  resolveWealthConclusionStrength,
  calculateDomainStrength,
  calculateVargaStrength,
  buildWealthNatalStatement,
  buildWealthDashaStatement,
  buildWealthTransitStatement,
  buildD2Statement
} from './wealthConclusion';

export { calculateWealthDataCompleteness } from './wealthDataCompleteness';
export { calculateWealthConfidence } from './wealthConfidence';
export { detectWealthConflicts } from './wealthConflicts';
export * from './wealthTypes';
