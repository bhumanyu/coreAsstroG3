import type { Horoscope, Planet } from '../../types';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
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
  type D10CareerContext
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
import { synthesizeCareerFinal } from '../careerWealth/finalSynthesis/careerFinalSynthesis';
import { getActiveDasha } from '../../engine/dasha/vimshottari';

export function interpretCareerV2(
  horoscope: Horoscope,
  options?: DomainReasoningOptions
): DomainInterpretation {
  const legacyCareer = interpretCareerTheme(horoscope);
  const rawEvidence = legacyCareer.evidence;
  const rawMappedEvidence = buildCareerEvidence(rawEvidence);
  const evidence = linkCareerEvidence(rawMappedEvidence);

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
      legacyCareer.conclusion?.summary
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

  const currentDasha = horoscope.dashaInterpretation?.current;
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
    legacyCareer.metadata?.vargaConfirmationStatus,
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

  // If CW01 strategy is requested, resolve through CW01 reasoning hierarchy
  if (options?.strategy === 'CW01') {
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
      dashaInterpretation: horoscope.dashaInterpretation,
      d10Context
    });

    const rawAsOf = options?.asOf ?? horoscope.dashaInterpretation?.at;
    const asOfDate = rawAsOf ? (typeof rawAsOf === 'string' ? new Date(rawAsOf) : rawAsOf) : undefined;

    let careerTimingSynthesis: CareerTimingSynthesis;
    if (asOfDate && !isNaN(asOfDate.getTime())) {
      const activeDashaState = horoscope.vimshottari ? getActiveDasha(horoscope.vimshottari, asOfDate) : null;
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
      cw01Result.supportingEvidenceIds,
      cw01Result.challengingEvidenceIds
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
        legacyCareer.conclusion?.summary,
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
      unresolvedQuestions: []
    });

    const careerManifestationSynthesis = synthesizeCareerManifestations(
      evidence,
      careerDashaSynthesis,
      careerTimingSynthesis,
      horoscope
    );

    const careerFinalSynthesis = synthesizeCareerFinal({
      natalPromise: cw01Result.finalStrength,
      dashaSynthesis: careerDashaSynthesis,
      timingSynthesis: careerTimingSynthesis,
      manifestationSynthesis: careerManifestationSynthesis,
      d10Relationship
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
        careerFinalSynthesis
      },
      reasoningTrace: cw01Result.reasoningTrace,
      reasoningVersion: 'CW-05'
    });
  }

  const manifestations = deriveCareerManifestations(evidence, rawEvidence);

  // Conclusion strength logic with D10 downgrade handling and hierarchy preservation
  const conclusionStrength = resolveCareerConclusionStrength(
    natalStrength,
    d10Relationship,
    conflicts
  );

  const conclusionData = buildCareerConclusionData(
    natalStrength,
    d10Relationship,
    timingActivations,
    transitTrigger,
    conflicts,
    manifestations,
    supportingEvidence.map((item) => item.id),
    challengingEvidence.map((item) => item.id)
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: conclusionStrength,
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
      legacyCareer.conclusion?.summary,
      d10Relationship,
      {
        timingActivations,
        conflicts,
        manifestations,
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

  const d10Context: D10CareerContext = {
    relationship: d10Relationship,
    statement: buildD10Statement(d10Evidence, d10Relationship)
  };

  const careerDashaSynthesis = buildCareerDashaSynthesis({
    dashaInterpretation: horoscope.dashaInterpretation,
    d10Context
  });

  const rawAsOf = options?.asOf ?? horoscope.dashaInterpretation?.at;
  const asOfDate = rawAsOf ? (typeof rawAsOf === 'string' ? new Date(rawAsOf) : rawAsOf) : undefined;

  let careerTimingSynthesis: CareerTimingSynthesis;
  if (asOfDate && !isNaN(asOfDate.getTime())) {
    const activeDashaState = horoscope.vimshottari ? getActiveDasha(horoscope.vimshottari, asOfDate) : null;
    const careerTransitSynthesis = synthesizeCareerTransit(horoscope, activeDashaState, asOfDate, careerDashaSynthesis);
    careerTimingSynthesis = synthesizeCareerTiming(natalStrength, careerDashaSynthesis, careerTransitSynthesis);
  } else {
    careerTimingSynthesis = Object.freeze({
      natalPromise: natalStrength,
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

  const careerManifestationSynthesis = synthesizeCareerManifestations(
    mergedEvidence,
    careerDashaSynthesis,
    careerTimingSynthesis,
    horoscope
  );

  const careerFinalSynthesis = synthesizeCareerFinal({
    natalPromise: natalStrength,
    dashaSynthesis: careerDashaSynthesis,
    timingSynthesis: careerTimingSynthesis,
    manifestationSynthesis: careerManifestationSynthesis,
    d10Relationship
  });

  return buildDomainInterpretation({
    domain: 'CAREER',
    evidence: mergedEvidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations,
    conflicts,
    conclusion,
    timingActivations,
    dataCompleteness,
    conclusionData: {
      ...conclusionData,
      careerDashaSynthesis,
      careerTimingSynthesis,
      careerManifestationSynthesis,
      careerFinalSynthesis
    },
    reasoningVersion: 'CW-05'
  });
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
