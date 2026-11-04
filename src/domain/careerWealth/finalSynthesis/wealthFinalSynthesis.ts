import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  FinalDomainConfidence,
  ManifestationSummary,
  WealthDimensionFinalSynthesis,
  WealthRiskProfile,
  WealthRiskQualification,
  WealthRiskReasonCode,
  SynthesisAxisStatus
} from './careerWealthFinalSynthesisTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import type { DomainStrength } from '../../reasoning/reasoningTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type { WealthTransitDimensionSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type { WealthDimensionManifestationSynthesis } from '../../wealth/manifestation/wealthManifestationTypes';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import {
  enforceWealthNatalCeiling,
  enforceWealthDimensionIsolation
} from './finalSynthesisGuardrails';
import {
  calculateFinalConfidenceV2
} from './finalConfidenceModel';

const WEALTH_DIMENSIONS: readonly WealthDimension[] = [
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
];

function mapStrengthToPromiseStatus(strength: DomainStrength | undefined): FinalDomainStatus {
  switch (strength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'MIXED':
      return 'MIXED';
    case 'WEAK':
    case 'VERY_WEAK':
      return 'CHALLENGED';
    case 'UNDETERMINED':
    default:
      return 'INSUFFICIENT_DATA';
  }
}

function deriveAxisStatus(effect: string | undefined): SynthesisAxisStatus {
  if (!effect) return 'INSUFFICIENT_DATA';
  const norm = effect.toUpperCase();
  if (
    norm === 'SUPPORTS' ||
    norm === 'STRONGLY_SUPPORTS' ||
    norm === 'ACTIVATES' ||
    norm === 'PARTIALLY_ACTIVATES' ||
    norm === 'SUPPORT'
  ) {
    return 'SUPPORT';
  }
  if (norm === 'CHALLENGES' || norm === 'STRONGLY_CHALLENGES' || norm === 'CHALLENGE') {
    return 'CHALLENGE';
  }
  if (norm === 'MIXED' || norm === 'MODIFIES') {
    return 'MIXED';
  }
  if (norm === 'NEUTRAL' || norm === 'DOES_NOT_ACTIVATE') {
    return 'NEUTRAL';
  }
  return 'INSUFFICIENT_DATA';
}

function mapManifestationStatus(status: string | undefined): FinalDomainStatus {
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      return 'VERY_STRONG';
    case 'SUPPORTED':
      return 'STRONG';
    case 'MIXED':
      return 'MIXED';
    case 'CHALLENGED':
      return 'CHALLENGED';
    case 'INSUFFICIENT_DATA':
    default:
      return 'INSUFFICIENT_DATA';
  }
}

function calculateWealthEvidenceSourceCount(input: {
  readonly natalEvidenceIds: readonly string[];
  readonly dimTiming?: WealthTransitDimensionSynthesis;
  readonly d2Synthesis?: readonly DomainEvidence[];
  readonly dimManifestation?: WealthDimensionManifestationSynthesis;
}): number {
  let count = 0;

  if (input.natalEvidenceIds.length > 0) {
    count += 1;
  }

  // One timing source = one count
  if (
    input.dimTiming &&
    (input.dimTiming.dashaEffect !== 'INSUFFICIENT_DATA' ||
      (input.dimTiming.factors && input.dimTiming.factors.length > 0))
  ) {
    count += 1;
  }

  if (input.dimManifestation) {
    count += 1;
  }

  return count;
}

/**
 * CW-05 policy: a qualitative speculation-risk conclusion requires a known natal
 * speculation promise and at least one independent corroborating producer
 * (timing or manifestation). D2 is unavailable under the current Wealth contract
 * and cannot corroborate or conflict with this classification.
 */
function qualifyWealthRisk(input: {
  readonly speculation: WealthDimensionFinalSynthesis;
}): WealthRiskQualification {
  const { speculation } = input;
  const timingAvailable = speculation.timingStatus !== 'INSUFFICIENT_DATA' ||
    speculation.activationStatus !== 'INSUFFICIENT_DATA';
  const manifestationAvailable = speculation.manifestationStatus !== 'INSUFFICIENT_DATA';
  const d2Available = false;
  const natalAvailable = speculation.primaryPromise !== 'UNDETERMINED';
  const corroborationAvailable = timingAvailable || manifestationAvailable || d2Available;
  const missingRequiredEvidenceFamilies: ('NATAL' | 'CORROBORATION')[] = [];
  const reasonCodes: WealthRiskReasonCode[] = [];
  const reasons: string[] = [];

  if (!natalAvailable) {
    missingRequiredEvidenceFamilies.push('NATAL');
    reasonCodes.push('SPECULATION_NATAL_UNAVAILABLE');
    reasons.push('Speculation natal promise is unavailable, so risk cannot be qualified.');
  }
  if (!corroborationAvailable) {
    missingRequiredEvidenceFamilies.push('CORROBORATION');
    reasonCodes.push('SPECULATION_CORROBORATION_UNAVAILABLE');
    reasons.push('No timing or manifestation producer corroborates the speculation assessment.');
  }
  if (!d2Available) {
    reasonCodes.push('D2_UNAVAILABLE');
    reasons.push('D2 Hora is unavailable and cannot corroborate this classification.');
  }
  const conflictingEvidence = speculation.status === 'MIXED' ||
    (speculation.activationStatus === 'CHALLENGE' && speculation.timingStatus === 'SUPPORT');
  if (conflictingEvidence) {
    reasonCodes.push('CONFLICTING_SPECULATION_EVIDENCE');
    reasons.push('Speculation evidence contains conflicting or mixed indications.');
  }
  if (speculation.evidenceIds.length === 0) {
    reasonCodes.push('EVIDENCE_IDS_UNAVAILABLE');
    reasons.push('The contributing producer result has no traceable speculation evidence IDs.');
  }

  const availableFamilies = [natalAvailable, timingAvailable, manifestationAvailable, d2Available]
    .filter(Boolean).length;
  const evidenceCoverage = availableFamilies >= 3 ? 'HIGH' : availableFamilies >= 2 ? 'MEDIUM' : 'LOW';
  let classification: WealthRiskProfile;

  if (missingRequiredEvidenceFamilies.length > 0) {
    classification = 'INSUFFICIENT_DATA';
  } else if (speculation.status === 'CHALLENGED' || speculation.primaryPromise === 'WEAK' || speculation.primaryPromise === 'VERY_WEAK') {
    classification = 'HIGH';
    reasonCodes.push('SPECULATION_CHALLENGED');
    reasons.push('Speculation is structurally challenged by the available evidence.');
  } else if (speculation.status === 'MIXED') {
    classification = speculation.activationStatus === 'CHALLENGE' || speculation.timingStatus === 'CHALLENGE' ? 'ELEVATED' : 'MODERATE';
    reasonCodes.push('SPECULATION_MIXED');
    reasons.push('Speculation has mixed indications; current challenge evidence determines the qualitative risk level.');
  } else if (speculation.status === 'STRONG' || speculation.status === 'VERY_STRONG') {
    classification = speculation.activationStatus === 'CHALLENGE' ? 'MODERATE' : 'LOW';
    reasonCodes.push('SPECULATION_SUPPORTED');
    reasons.push('Speculation is supported by the available evidence.');
  } else {
    classification = 'MODERATE';
    reasons.push('Speculation evidence is neither clearly supportive nor clearly challenged.');
  }

  if (classification !== 'INSUFFICIENT_DATA' && conflictingEvidence && classification === 'LOW') {
    classification = 'MODERATE';
  }
  if (speculation.activationStatus === 'CHALLENGE' || speculation.timingStatus === 'CHALLENGE') {
    reasonCodes.push('SPECULATION_TIMING_CHALLENGE');
  }

  return Object.freeze({
    classification,
    dimension: 'SPECULATION' as const,
    evidenceCoverage,
    evidenceFamilies: Object.freeze({
      natal: natalAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      timing: timingAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      manifestation: manifestationAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      d2: d2Available ? 'AVAILABLE' : 'UNAVAILABLE'
    }),
    missingRequiredEvidenceFamilies: Object.freeze(missingRequiredEvidenceFamilies),
    conflictingEvidence,
    d2Availability: d2Available ? 'AVAILABLE' : 'UNAVAILABLE',
    evidenceIds: Object.freeze([...speculation.evidenceIds]),
    reasonCodes: Object.freeze(reasonCodes),
    reasons: Object.freeze(reasons)
  });
}

export function synthesizeWealthFinal(
  input: WealthFinalSynthesisInput
): CareerWealthFinalSynthesis {
  const {
    natalPromise,
    timingSynthesis,
    manifestationSynthesis,
    d2Synthesis,
    natalEvidenceIds = [],
    natalRuleIds = []
  } = input;

  // Canonical Wealth containment: external D2 declarations cannot upgrade availability.
  const d2Relationship: VargaRelationship = 'UNAVAILABLE';
  const dimensionSyntheses: Partial<Record<WealthDimension, WealthDimensionFinalSynthesis>> = {};
  const manifestationSummaryList: ManifestationSummary[] = [];
  const strongestAreas: string[] = [];
  const challengedAreas: string[] = [];
  const evidenceIdSet = new Set<string>();
  const ruleIdSet = new Set<string>(['CW-05-WEALTH-SYNTHESIS']);
  const keySupport: string[] = [];
  const keyChallenges: string[] = [];

  const allNatalEvidenceIds = Array.isArray(natalEvidenceIds)
    ? natalEvidenceIds
    : Object.values(natalEvidenceIds).flat();
  const allNatalRuleIds = Array.isArray(natalRuleIds)
    ? natalRuleIds
    : Object.values(natalRuleIds).flat();

  allNatalEvidenceIds.forEach((id) => evidenceIdSet.add(id));
  allNatalRuleIds.forEach((id) => ruleIdSet.add(id));

  // 1. Process each dimension in strict isolation
  for (const dim of WEALTH_DIMENSIONS) {
    const dimNatal = natalPromise[dim] ?? 'UNDETERMINED';
    const dimManifestation = manifestationSynthesis?.dimensions?.[dim];
    const dimTiming = timingSynthesis?.dimensions?.[dim];

    const dashaEffect = dimTiming?.dashaEffect ?? (dimManifestation?.dashaSupport === 'SUPPORT' ? 'SUPPORTS' : dimManifestation?.dashaSupport === 'CHALLENGE' ? 'CHALLENGES' : 'INSUFFICIENT_DATA');
    const timingEffect = dimTiming?.overallEffect ?? (dimManifestation?.transitSupport === 'SUPPORT' ? 'SUPPORTS' : dimManifestation?.transitSupport === 'CHALLENGE' ? 'CHALLENGES' : 'INSUFFICIENT_DATA');
    const divisionalEffect: VargaRelationship = 'UNAVAILABLE';

    const promiseStatus = mapStrengthToPromiseStatus(dimNatal);
    const activationStatus = deriveAxisStatus(dashaEffect);
    const timingStatus = deriveAxisStatus(timingEffect);
    const divisionalStatus = divisionalEffect;
    const manifestationStatus = mapManifestationStatus(dimManifestation?.status);

    let candidate: FinalDomainStatus;

    if (dimNatal === 'UNDETERMINED' && (!dimManifestation || dimManifestation.status === 'INSUFFICIENT_DATA')) {
      candidate = 'INSUFFICIENT_DATA';
    } else if (dimNatal === 'WEAK' || dimNatal === 'VERY_WEAK') {
      candidate = 'CHALLENGED';
    } else if (dimManifestation?.status === 'STRONGLY_SUPPORTED') {
      candidate = dimNatal === 'VERY_STRONG' ? 'VERY_STRONG' : 'STRONG';
    } else if (dimManifestation?.status === 'SUPPORTED') {
      candidate = dimNatal === 'STRONG' || dimNatal === 'VERY_STRONG' ? 'STRONG' : 'MODERATE';
    } else if (dimManifestation?.status === 'MIXED') {
      candidate = 'MIXED';
    } else if (dimManifestation?.status === 'CHALLENGED') {
      candidate = 'CHALLENGED';
    } else if (dimNatal === 'STRONG' || dimNatal === 'VERY_STRONG') {
      candidate = 'STRONG';
    } else if (dimNatal === 'MODERATE') {
      candidate = 'MODERATE';
    } else if (dimNatal === 'MIXED') {
      candidate = 'MIXED';
    } else {
      candidate = 'INSUFFICIENT_DATA';
    }

    // D2 is unavailable and therefore does not alter promise strength or confidence.

    // Dasha timing impact (Activation Layer: genuine CHALLENGE downgrades candidate by 1 notch)
    if (activationStatus === 'CHALLENGE') {
      if (candidate === 'VERY_STRONG') {
        candidate = 'STRONG';
      } else if (candidate === 'STRONG') {
        candidate = 'MODERATE';
      } else if (candidate === 'MODERATE') {
        candidate = 'MIXED';
      }
    }

    // ARCHITECTURAL CONTRACT:
    // Transit timingEffect / timingStatus is a timing modifier only and cannot fabricate or overturn foundational promise.

    const dimFinalStatus = enforceWealthNatalCeiling(dimNatal, candidate);

    const dimEvidenceIdSet = new Set<string>();
    const dimRuleIdSet = new Set<string>();

    const dimNatalEv: readonly string[] = Array.isArray(natalEvidenceIds)
      ? natalEvidenceIds
      : (typeof natalEvidenceIds === 'object' && natalEvidenceIds !== null
          ? ((natalEvidenceIds as Partial<Record<WealthDimension, readonly string[]>>)[dim] ?? [])
          : []);
    const dimNatalR: readonly string[] = Array.isArray(natalRuleIds)
      ? natalRuleIds
      : (typeof natalRuleIds === 'object' && natalRuleIds !== null
          ? ((natalRuleIds as Partial<Record<WealthDimension, readonly string[]>>)[dim] ?? [])
          : []);

    dimNatalEv.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
    dimNatalR.forEach((id: string) => { dimRuleIdSet.add(id); ruleIdSet.add(id); });

    /*
     * Wealth synthesis currently models timing and activation at the dimension level
     * without a standalone CareerDashaSynthesis object. It intentionally supplies
     * activationConfidence: undefined and dashaEffectConsistent / dashaHierarchyRolesConsistent: undefined
     * (CW-05D framework with unavailable Dasha-consistency axis).
     */
    const dimConfidenceBreakdown = calculateFinalConfidenceV2({
      natalPromise: dimNatal,
      natalEvidenceCount: dimNatalEv.length,
      activationStatus,
      activationConfidence: undefined,
      dashaEffectConsistent: undefined,
      dashaHierarchyRolesConsistent: undefined,
      timingStatus,
      timingConfidence: dimTiming?.confidence,
      divisionalStatus,
      manifestationConfidences: dimManifestation ? [dimManifestation.confidence] : [],
      manifestationStatuses: dimManifestation ? [mapManifestationStatus(dimManifestation.status)] : [],
      evidenceSourceCount: calculateWealthEvidenceSourceCount({
        natalEvidenceIds: dimNatalEv,
        dimTiming,
        d2Synthesis,
        dimManifestation
      })
    });

    const dimConfidence: FinalDomainConfidence = dimConfidenceBreakdown.final;

    if (dimManifestation) {
      manifestationSummaryList.push({
        mode: dim,
        status: dimManifestation.status,
        confidence: dimManifestation.confidence
      });

      for (const f of dimManifestation.factors) {
        dimRuleIdSet.add(f.id);
        ruleIdSet.add(f.id);
        if (f.evidenceIds) f.evidenceIds.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
        if (f.dashaEvidenceIds) f.dashaEvidenceIds.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
        if (f.transitEvidenceIds) f.transitEvidenceIds.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
      }
    }

    if (dimTiming) {
      for (const f of dimTiming.factors) {
        dimRuleIdSet.add(f.id);
        ruleIdSet.add(f.id);
        if (f.natalEvidenceIds) f.natalEvidenceIds.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
        if (f.dashaEvidenceIds) f.dashaEvidenceIds.forEach((id: string) => { dimEvidenceIdSet.add(id); evidenceIdSet.add(id); });
      }
    }

    if (dimFinalStatus === 'STRONG' || dimFinalStatus === 'VERY_STRONG') {
      strongestAreas.push(dim);
      keySupport.push(`${dim}: ${dimFinalStatus.toLowerCase()}`);
    } else if (dimFinalStatus === 'CHALLENGED') {
      challengedAreas.push(dim);
      keyChallenges.push(`${dim}: challenged`);
    }

    const dimSummary = `${dim} dimension status is ${dimFinalStatus} (Promise: ${dimNatal}, Timing: ${timingEffect}).`;

    // Note: Wealth has no CareerDashaSynthesis-equivalent combined MD/AD/PD hierarchy object today;
    // activationConfidence, activationStrength, activationSummary, and activationHierarchy are left undefined.
    dimensionSyntheses[dim] = Object.freeze({
      dimension: dim,
      status: dimFinalStatus,
      finalStatus: dimFinalStatus,
      promiseStatus,
      activationStatus,
      timingStatus,
      divisionalStatus,
      manifestationStatus,
      confidence: dimConfidence,
      confidenceBreakdown: Object.freeze(dimConfidenceBreakdown),
      primaryPromise: dimNatal,
      dashaEffect,
      timingEffect,
      divisionalEffect,
      summary: dimSummary,
      ruleIds: Object.freeze([...dimRuleIdSet]),
      evidenceIds: Object.freeze([...dimEvidenceIdSet]),
      natalEvidenceIds: Object.freeze([...new Set(dimNatalEv)]),
      natalRuleIds: Object.freeze([...new Set(dimNatalR)])
    });
  }

  // Unvalidated D2 occurrences are retained only in the diagnostic d2Evidence field below.
  // They do not enter canonical evidence IDs, confidence coverage, or synthesis weights.

  // Guarantee strict dimension isolation
  const isolatedDimensions = enforceWealthDimensionIsolation(dimensionSyntheses);

  // 2. Synthesize Overall Wealth Status (Domain-level, without averaging)
  // ARCHITECTURAL CONTRACT: Speculation is intentionally excluded from overall Wealth status.
  // It is retained only as a separately named chart-derived propensity indication. It is not
  // actual financial exposure, user trading history, or a suitability/risk-capacity assessment.
  // Core Wealth status is determined strictly by Accumulation, Gains, and Fortune.
  const coreStatuses = [
    isolatedDimensions.ACCUMULATION.status,
    isolatedDimensions.GAINS.status,
    isolatedDimensions.FORTUNE.status
  ];

  const coreStrongCount = coreStatuses.filter((s) => s === 'VERY_STRONG' || s === 'STRONG').length;
  const coreModerateCount = coreStatuses.filter((s) => s === 'MODERATE').length;
  const coreChallengedCount = coreStatuses.filter((s) => s === 'CHALLENGED').length;
  const coreInsufficientCount = coreStatuses.filter((s) => s === 'INSUFFICIENT_DATA').length;

  let overallStatus: FinalDomainStatus;

  if (coreInsufficientCount === 3) {
    overallStatus = 'INSUFFICIENT_DATA';
  } else if (coreChallengedCount >= 2 && coreStrongCount === 0) {
    overallStatus = 'CHALLENGED';
  } else if (isolatedDimensions.ACCUMULATION.status === 'VERY_STRONG' && coreStrongCount >= 2 && coreChallengedCount === 0) {
    overallStatus = 'VERY_STRONG';
  } else if (isolatedDimensions.ACCUMULATION.status === 'STRONG' || coreStrongCount >= 2) {
    overallStatus = 'STRONG';
  } else if (coreStrongCount >= 1 || coreModerateCount >= 2) {
    overallStatus = 'MODERATE';
  } else if (coreChallengedCount > 0 && (coreStrongCount > 0 || coreModerateCount > 0)) {
    overallStatus = 'MIXED';
  } else {
    overallStatus = 'MODERATE';
  }

  // 3. Compute qualitative risk from the isolated speculation dimension only.
  // Foundational wealth promise and risk remain deliberately independent.
  const riskQualification = qualifyWealthRisk({
    speculation: isolatedDimensions.SPECULATION
  });
  const riskProfile: WealthRiskProfile = riskQualification.classification;

  // 4. Overall confidence describes evidence quality and consistency, never promise or risk.
  const timingDimensions = Object.values(timingSynthesis?.dimensions ?? {});
  const timingConfidences = timingDimensions
    .map((dimension) => dimension.confidence)
    .filter((confidence): confidence is number => typeof confidence === 'number');
  const timingConfidence = timingConfidences.length > 0
    ? timingConfidences.reduce((total, confidence) => total + confidence, 0) / timingConfidences.length
    : undefined;
  const manifestationDimensions = Object.values(manifestationSynthesis?.dimensions ?? {});
  const overallConfidenceBreakdown = calculateFinalConfidenceV2({
    natalPromise: natalPromise.ACCUMULATION ?? 'UNDETERMINED',
    natalEvidenceCount: allNatalEvidenceIds.length,
    activationStatus: isolatedDimensions.ACCUMULATION.activationStatus,
    activationConfidence: undefined,
    dashaEffectConsistent: undefined,
    dashaHierarchyRolesConsistent: undefined,
    timingStatus: isolatedDimensions.ACCUMULATION.timingStatus,
    timingConfidence,
    divisionalStatus: d2Relationship,
    manifestationConfidences: manifestationDimensions.map((dimension) => dimension.confidence),
    manifestationStatuses: manifestationDimensions.map((dimension) => mapManifestationStatus(dimension.status)),
    evidenceSourceCount: calculateWealthEvidenceSourceCount({
      natalEvidenceIds: allNatalEvidenceIds,
      dimTiming: timingSynthesis?.dimensions?.ACCUMULATION,
      d2Synthesis,
      dimManifestation: manifestationSynthesis?.dimensions?.ACCUMULATION
    })
  });
  const overallConfidence: FinalDomainConfidence = overallConfidenceBreakdown.final;

  // 5. Secondary strengths
  const secondaryStrengths: readonly WealthDimension[] = Object.freeze(
    WEALTH_DIMENSIONS.filter(
      (d) => isolatedDimensions[d].status === 'VERY_STRONG' || isolatedDimensions[d].status === 'STRONG'
    )
  );

  // 6. Build authoritative summary statement
  let summary = `Wealth domain synthesis evaluates to ${overallStatus} with ${overallConfidence} confidence.`;
  if (isolatedDimensions.ACCUMULATION.status === 'STRONG' || isolatedDimensions.ACCUMULATION.status === 'VERY_STRONG') {
    summary += ` Core accumulation capability remains stable.`;
  }

  return Object.freeze({
    reasoningVersion: 'CW-05' as const,
    domain: 'WEALTH' as const,
    status: overallStatus,
    finalStatus: overallStatus,
    promiseStatus: isolatedDimensions.ACCUMULATION.promiseStatus,
    activationStatus: isolatedDimensions.ACCUMULATION.activationStatus,
    timingStatus: isolatedDimensions.ACCUMULATION.timingStatus,
    divisionalStatus: 'UNAVAILABLE',
    d2AvailabilityReason: 'D2 calculation and interpretation have not passed independent validation; canonical Wealth reasoning keeps D2 UNAVAILABLE.',
    manifestationStatus: isolatedDimensions.ACCUMULATION.manifestationStatus,
    confidence: overallConfidence,
    confidenceBreakdown: Object.freeze(overallConfidenceBreakdown),
    primaryPromise: natalPromise.ACCUMULATION ?? 'UNDETERMINED',
    primaryStrength: natalPromise.ACCUMULATION ?? 'UNDETERMINED',
    secondaryStrengths,
    manifestationSummary: Object.freeze(manifestationSummaryList),
    strongestAreas: Object.freeze(strongestAreas),
    challengedAreas: Object.freeze(challengedAreas),
    dashaEffect: isolatedDimensions.ACCUMULATION.dashaEffect,
    timingEffect: isolatedDimensions.ACCUMULATION.timingEffect,
    divisionalEffect: d2Relationship,
    keySupport: Object.freeze(keySupport),
    keyChallenges: Object.freeze(keyChallenges),
    summary,
    ruleIds: Object.freeze([...ruleIdSet]),
    evidenceIds: Object.freeze([...evidenceIdSet]),
    natalEvidenceIds: Object.freeze([...new Set(allNatalEvidenceIds)]),
    natalRuleIds: Object.freeze([...new Set(allNatalRuleIds)]),
    d2Evidence: d2Synthesis ? Object.freeze([...d2Synthesis]) : undefined,
    dimensions: isolatedDimensions,
    speculativePropensity: isolatedDimensions.SPECULATION.status,
    riskProfile,
    riskQualification
  });
}
