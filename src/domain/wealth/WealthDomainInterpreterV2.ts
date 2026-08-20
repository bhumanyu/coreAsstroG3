import type { Horoscope } from '../../types';
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

export function interpretWealthV2(
  horoscope: Horoscope
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
    evidence
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
    dataCompleteness,
    conclusionData
  });
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
    return 'DOES_NOT_ACTIVATE';
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
    return 'DOES_NOT_ACTIVATE';
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
      effect: 'DOES_NOT_ACTIVATE',
      activatedPromiseEvidenceIds: Object.freeze([]),
      evidenceIds: Object.freeze([]),
      statement: `${period} period lord does not directly activate natal wealth promise.`
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
