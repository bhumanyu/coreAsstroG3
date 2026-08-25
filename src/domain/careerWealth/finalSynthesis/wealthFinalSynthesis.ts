import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  FinalDomainConfidence,
  ManifestationSummary,
  WealthDimensionFinalSynthesis,
  WealthRiskProfile
} from './careerWealthFinalSynthesisTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import {
  enforceWealthNatalCeiling,
  enforceWealthDimensionIsolation
} from './finalSynthesisGuardrails';
import { calculateFinalConfidence } from './finalSynthesisConfidence';

const WEALTH_DIMENSIONS: readonly WealthDimension[] = [
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
];

export function synthesizeWealthFinal(
  input: WealthFinalSynthesisInput
): CareerWealthFinalSynthesis {
  const {
    natalPromise,
    timingSynthesis,
    manifestationSynthesis,
    d2Relationship = 'UNAVAILABLE'
  } = input;

  const isD2Confirmed = d2Relationship === 'CONFIRMS' || d2Relationship === 'PARTIALLY_CONFIRMS';
  const dimensionSyntheses: Record<WealthDimension, WealthDimensionFinalSynthesis> = {} as any;
  const manifestationSummaryList: ManifestationSummary[] = [];
  const strongestAreas: string[] = [];
  const challengedAreas: string[] = [];
  const evidenceIdSet = new Set<string>();
  const ruleIdSet = new Set<string>(['CW-05-WEALTH-SYNTHESIS']);
  const keySupport: string[] = [];
  const keyChallenges: string[] = [];

  // 1. Process each dimension in strict isolation
  for (const dim of WEALTH_DIMENSIONS) {
    const dimNatal = natalPromise[dim] ?? 'UNDETERMINED';
    const dimManifestation = manifestationSynthesis?.dimensions
      ? (manifestationSynthesis.dimensions as Record<WealthDimension, any>)[dim]
      : undefined;
    const dimTiming = timingSynthesis?.dimensions
      ? (timingSynthesis.dimensions as Record<WealthDimension, any>)[dim]
      : undefined;

    const dashaEffect = dimTiming?.dashaEffect ?? (dimManifestation?.dashaSupport === 'SUPPORT' ? 'SUPPORTS' : dimManifestation?.dashaSupport === 'CHALLENGE' ? 'CHALLENGES' : 'INSUFFICIENT_DATA');
    const timingEffect = dimTiming?.overallEffect ?? (dimManifestation?.transitSupport === 'SUPPORT' ? 'SUPPORTS' : dimManifestation?.transitSupport === 'CHALLENGE' ? 'CHALLENGES' : 'INSUFFICIENT_DATA');
    const divisionalEffect = d2Relationship !== 'UNAVAILABLE' ? d2Relationship : (dimManifestation?.d2Support === 'SUPPORT' ? 'CONFIRMS' : dimManifestation?.d2Support === 'CHALLENGE' ? 'CONFLICTS' : 'UNAVAILABLE');

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
    } else {
      candidate = 'INSUFFICIENT_DATA';
    }

    const dimFinalStatus = enforceWealthNatalCeiling(dimNatal, candidate);

    const dimSupportingCount = dimManifestation?.status === 'STRONGLY_SUPPORTED' || dimManifestation?.status === 'SUPPORTED' ? 1 : 0;
    const dimChallengingCount = dimManifestation?.status === 'CHALLENGED' ? 1 : 0;
    const dimPrimaryCount = (dimNatal !== 'UNDETERMINED' ? 1 : 0) + (dimManifestation ? 1 : 0);

    const dimConfidence: FinalDomainConfidence = calculateFinalConfidence(
      dimPrimaryCount,
      dimSupportingCount,
      dimChallengingCount,
      isD2Confirmed
    );

    const dimEvidenceIds: string[] = [];
    if (dimManifestation) {
      manifestationSummaryList.push({
        mode: dim,
        status: dimManifestation.status,
        confidence: dimManifestation.confidence
      });

      for (const f of dimManifestation.factors) {
        ruleIdSet.add(f.id);
        if (f.evidenceIds) f.evidenceIds.forEach((id: string) => { dimEvidenceIds.push(id); evidenceIdSet.add(id); });
        if (f.dashaEvidenceIds) f.dashaEvidenceIds.forEach((id: string) => { dimEvidenceIds.push(id); evidenceIdSet.add(id); });
        if (f.transitEvidenceIds) f.transitEvidenceIds.forEach((id: string) => { dimEvidenceIds.push(id); evidenceIdSet.add(id); });
      }
    }

    if (dimTiming) {
      for (const f of dimTiming.factors) {
        ruleIdSet.add(f.id);
        if (f.natalEvidenceIds) f.natalEvidenceIds.forEach((id: string) => { dimEvidenceIds.push(id); evidenceIdSet.add(id); });
        if (f.dashaEvidenceIds) f.dashaEvidenceIds.forEach((id: string) => { dimEvidenceIds.push(id); evidenceIdSet.add(id); });
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

    dimensionSyntheses[dim] = Object.freeze({
      status: dimFinalStatus,
      confidence: dimConfidence,
      primaryPromise: dimNatal,
      dashaEffect,
      timingEffect,
      divisionalEffect,
      summary: dimSummary,
      evidenceIds: Object.freeze([...new Set(dimEvidenceIds)])
    });
  }

  // Guarantee strict dimension isolation
  const isolatedDimensions = enforceWealthDimensionIsolation(dimensionSyntheses);

  // 2. Synthesize Overall Wealth Status (Domain-level, without averaging)
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
  let riskProfile: WealthRiskProfile;

  if (specStatus === 'INSUFFICIENT_DATA') {
    riskProfile = 'INSUFFICIENT_DATA';
  } else if (specStatus === 'CHALLENGED') {
    riskProfile = overallStatus === 'STRONG' || overallStatus === 'VERY_STRONG' ? 'ELEVATED' : 'HIGH';
  } else if (specStatus === 'MIXED') {
    riskProfile = 'MODERATE';
  } else if (specStatus === 'STRONG' || specStatus === 'VERY_STRONG' || specStatus === 'MODERATE') {
    riskProfile = 'LOW';
  } else {
    riskProfile = 'MODERATE';
  }

  // 4. Overall Confidence
  const allConf = Object.values(isolatedDimensions).map((d) => d.confidence);
  const highConfCount = allConf.filter((c) => c === 'HIGH').length;
  const lowConfCount = allConf.filter((c) => c === 'LOW').length;
  const overallConfidence: FinalDomainConfidence = highConfCount >= 2 ? 'HIGH' : lowConfCount >= 3 ? 'LOW' : 'MEDIUM';

  // 5. Build authoritative summary statement
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
    confidence: overallConfidence,
    primaryPromise: natalPromise.ACCUMULATION ?? 'UNDETERMINED',
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
    dimensions: isolatedDimensions,
    riskProfile
  });
}
