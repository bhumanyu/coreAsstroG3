import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  FinalDomainConfidence,
  ManifestationSummary,
  WealthDimensionFinalSynthesis,
  WealthRiskProfile,
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
  calculateFinalConfidenceV2,
  type FinalDomainStatusForConfidence
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

  if (
    input.d2Synthesis &&
    input.d2Synthesis.length > 0
  ) {
    count += 1;
  }

  if (input.dimManifestation) {
    count += 1;
  }

  return count;
}

export function synthesizeWealthFinal(
  input: WealthFinalSynthesisInput
): CareerWealthFinalSynthesis {
  const {
    natalPromise,
    timingSynthesis,
    manifestationSynthesis,
    d2Synthesis,
    d2Relationship = 'UNAVAILABLE',
    natalEvidenceIds = [],
    natalRuleIds = []
  } = input;

  const isD2Confirmed = d2Relationship === 'CONFIRMS' || d2Relationship === 'PARTIALLY_CONFIRMS';
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
    const divisionalEffect: VargaRelationship = d2Relationship !== 'UNAVAILABLE' ? d2Relationship : (dimManifestation?.d2Support === 'SUPPORT' ? 'CONFIRMS' : dimManifestation?.d2Support === 'CHALLENGE' ? 'CONFLICTS' : 'UNAVAILABLE');

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

    // D2 structural layer (Divisional Layer: D2 conflict downgrades candidate by 1 notch)
    if (divisionalStatus === 'CONFLICTS') {
      if (candidate === 'VERY_STRONG') {
        candidate = 'STRONG';
      } else if (candidate === 'STRONG') {
        candidate = 'MODERATE';
      } else if (candidate === 'MODERATE') {
        candidate = 'MIXED';
      }
    }

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

  if (d2Synthesis) {
    for (const item of d2Synthesis) {
      evidenceIdSet.add(item.id);
      if (item.ruleId) ruleIdSet.add(item.ruleId);
    }
  }

  // Guarantee strict dimension isolation
  const isolatedDimensions = enforceWealthDimensionIsolation(dimensionSyntheses);

  // 2. Synthesize Overall Wealth Status (Domain-level, without averaging)
  // ARCHITECTURAL CONTRACT: Speculation is intentionally excluded from the overall Wealth status
  // calculation and ONLY drives the riskProfile. Core wealth status is determined strictly by
  // Accumulation, Gains, and Fortune to prevent high-variance speculative exposure from
  // distorting foundational wealth capacity.
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

  // 3. Compute Risk Profile (Speculation isolation and exposure)
  const specStatus = isolatedDimensions.SPECULATION.status;
  const specNatal = natalPromise.SPECULATION;
  const specActivation = isolatedDimensions.SPECULATION.activationStatus;
  const specTiming = isolatedDimensions.SPECULATION.timingStatus;
  let riskProfile: WealthRiskProfile;

  if (specStatus === 'INSUFFICIENT_DATA') {
    riskProfile = 'INSUFFICIENT_DATA';
  } else if (specStatus === 'CHALLENGED' || specNatal === 'WEAK' || specNatal === 'VERY_WEAK') {
    riskProfile = overallStatus === 'STRONG' || overallStatus === 'VERY_STRONG' ? 'ELEVATED' : 'HIGH';
  } else if (specStatus === 'MIXED') {
    riskProfile = specActivation === 'CHALLENGE' || specTiming === 'CHALLENGE' ? 'ELEVATED' : 'MODERATE';
  } else if (specStatus === 'STRONG' || specStatus === 'VERY_STRONG') {
    riskProfile = specActivation === 'CHALLENGE' ? 'MODERATE' : 'LOW';
  } else if (specStatus === 'MODERATE') {
    riskProfile = 'MODERATE';
  } else {
    riskProfile = 'MODERATE';
  }

  // 4. Overall Confidence
  const allConf = Object.values(isolatedDimensions).map((d) => d.confidence);
  const highConfCount = allConf.filter((c) => c === 'HIGH').length;
  const lowConfCount = allConf.filter((c) => c === 'LOW').length;
  const overallConfidence: FinalDomainConfidence = highConfCount >= 2 ? 'HIGH' : lowConfCount >= 3 ? 'LOW' : 'MEDIUM';

  // 5. Secondary strengths
  const secondaryStrengths: readonly WealthDimension[] = Object.freeze(
    WEALTH_DIMENSIONS.filter(
      (d) => isolatedDimensions[d].status === 'VERY_STRONG' || isolatedDimensions[d].status === 'STRONG'
    )
  );

  // 6. Build authoritative summary statement
  let summary = `Wealth domain synthesis evaluates to ${overallStatus} with ${overallConfidence} confidence and ${riskProfile} risk profile.`;
  if (isolatedDimensions.ACCUMULATION.status === 'STRONG' || isolatedDimensions.ACCUMULATION.status === 'VERY_STRONG') {
    summary += ` Core accumulation capability remains stable.`;
  }
  if (specStatus === 'CHALLENGED') {
    summary += ` Speculative activities carry structural friction and require risk mitigation.`;
  }

  return Object.freeze({
    reasoningVersion: 'CW-05' as const,
    domain: 'WEALTH' as const,
    status: overallStatus,
    finalStatus: overallStatus,
    promiseStatus: isolatedDimensions.ACCUMULATION.promiseStatus,
    activationStatus: isolatedDimensions.ACCUMULATION.activationStatus,
    timingStatus: isolatedDimensions.ACCUMULATION.timingStatus,
    divisionalStatus: d2Relationship,
    manifestationStatus: isolatedDimensions.ACCUMULATION.manifestationStatus,
    confidence: overallConfidence,
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
    riskProfile
  });
}
