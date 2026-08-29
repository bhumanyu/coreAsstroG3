import type {
  CareerFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  FinalDomainConfidence,
  FinalSynthesisActivationHierarchy,
  ManifestationSummary,
  SynthesisAxisStatus
} from './careerWealthFinalSynthesisTypes';
import { enforceCareerNatalCeiling } from './finalSynthesisGuardrails';
import { calculateFinalConfidence } from './finalSynthesisConfidence';
import { resolveDashaActivationGuardrail } from './dashaActivationGuardrails';

function mapStrengthToPromiseStatus(strength: string): FinalDomainStatus {
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

export function synthesizeCareerFinal(
  input: CareerFinalSynthesisInput
): CareerWealthFinalSynthesis {
  const {
    natalPromise,
    dashaSynthesis,
    timingSynthesis,
    manifestationSynthesis = [],
    d10Synthesis,
    d10Relationship = 'UNAVAILABLE',
    natalEvidenceIds = [],
    natalRuleIds = []
  } = input;

  // 1. Summarize manifestations
  const manifestationSummary: ManifestationSummary[] = manifestationSynthesis.map((m) => ({
    mode: m.mode,
    status: m.status,
    confidence: m.confidence
  }));

  const stronglySupportedCount = manifestationSynthesis.filter((m) => m.status === 'STRONGLY_SUPPORTED').length;
  const supportedCount = manifestationSynthesis.filter((m) => m.status === 'SUPPORTED').length;
  const mixedCount = manifestationSynthesis.filter((m) => m.status === 'MIXED').length;
  const challengedCount = manifestationSynthesis.filter((m) => m.status === 'CHALLENGED').length;
  const insufficientCount = manifestationSynthesis.filter((m) => m.status === 'INSUFFICIENT_DATA').length;

  const strongestAreas: string[] = manifestationSynthesis
    .filter((m) => m.status === 'STRONGLY_SUPPORTED' || m.status === 'SUPPORTED')
    .map((m) => m.mode);

  const challengedAreas: string[] = manifestationSynthesis
    .filter((m) => m.status === 'CHALLENGED')
    .map((m) => m.mode);

  // 2. Multi-axis derivation
  const promiseStatus = mapStrengthToPromiseStatus(natalPromise);

  const dashaActivation = resolveDashaActivationGuardrail(dashaSynthesis);
  const {
    status: activationStatus,
    confidence: activationConfidence,
    strength: activationStrength,
    summary: activationSummary,
    hierarchy: activationHierarchy
  } = dashaActivation;

  const rawTimingEffect = timingSynthesis?.overallEffect ?? timingSynthesis?.transitEffect ?? 'INSUFFICIENT_DATA';
  const timingStatus = deriveAxisStatus(rawTimingEffect);

  const divisionalStatus = d10Relationship;

  let manifestationStatus: FinalDomainStatus;
  if (manifestationSynthesis.length === 0) {
    manifestationStatus = promiseStatus;
  } else if (insufficientCount === manifestationSynthesis.length) {
    manifestationStatus = 'INSUFFICIENT_DATA';
  } else if (stronglySupportedCount >= 2 && challengedCount === 0) {
    manifestationStatus = 'VERY_STRONG';
  } else if (stronglySupportedCount >= 1 && challengedCount === 0) {
    manifestationStatus = 'STRONG';
  } else if (stronglySupportedCount + supportedCount >= 2 && challengedCount <= 1) {
    manifestationStatus = 'STRONG';
  } else if (challengedCount >= 2) {
    manifestationStatus = 'CHALLENGED';
  } else if (mixedCount > 0 || (supportedCount > 0 && challengedCount > 0)) {
    manifestationStatus = 'MIXED';
  } else if (supportedCount >= 1) {
    manifestationStatus = 'MODERATE';
  } else if (challengedCount === 1) {
    manifestationStatus = 'CHALLENGED';
  } else {
    manifestationStatus = 'INSUFFICIENT_DATA';
  }

  // 3. Derive base candidate status from Natal Promise + Manifestations
  let candidate: FinalDomainStatus;

  if (natalPromise === 'UNDETERMINED' || (insufficientCount === manifestationSynthesis.length && manifestationSynthesis.length > 0)) {
    candidate = 'INSUFFICIENT_DATA';
  } else if (natalPromise === 'WEAK' || natalPromise === 'VERY_WEAK') {
    candidate = 'CHALLENGED';
  } else if (natalPromise === 'VERY_STRONG') {
    if (challengedCount === 0 && (stronglySupportedCount >= 1 || supportedCount >= 1 || manifestationSynthesis.length === 0)) {
      candidate = 'VERY_STRONG';
    } else if (stronglySupportedCount + supportedCount >= 2 && challengedCount <= 1) {
      candidate = 'STRONG';
    } else if (challengedCount >= 2) {
      candidate = 'MODERATE';
    } else if (mixedCount > 0 || (supportedCount > 0 && challengedCount > 0)) {
      candidate = 'MIXED';
    } else {
      candidate = 'STRONG';
    }
  } else if (natalPromise === 'STRONG') {
    const dashaSupports = activationStatus === 'SUPPORT';
    const d10Supports = d10Relationship === 'CONFIRMS' || d10Relationship === 'PARTIALLY_CONFIRMS';

    if (stronglySupportedCount >= 3 && challengedCount === 0 && dashaSupports && d10Supports) {
      candidate = 'VERY_STRONG';
    } else if (stronglySupportedCount + supportedCount >= 2 && challengedCount === 0) {
      candidate = 'STRONG';
    } else if (stronglySupportedCount + supportedCount >= 2 && challengedCount <= 1) {
      candidate = 'STRONG';
    } else if (challengedCount >= 2) {
      candidate = 'MODERATE';
    } else if (mixedCount > 0 || (supportedCount > 0 && challengedCount > 0)) {
      candidate = 'MIXED';
    } else {
      candidate = 'STRONG';
    }
  } else if (natalPromise === 'MODERATE') {
    if (stronglySupportedCount + supportedCount >= 2 && challengedCount === 0) {
      candidate = 'MODERATE';
    } else if (challengedCount >= 2) {
      candidate = 'CHALLENGED';
    } else if (mixedCount > 0 || (supportedCount > 0 && challengedCount > 0)) {
      candidate = 'MIXED';
    } else {
      candidate = 'MODERATE';
    }
  } else if (natalPromise === 'MIXED') {
    candidate = 'MIXED';
  } else {
    candidate = 'INSUFFICIENT_DATA';
  }

  // 4. D10 structural adjustment (Divisional Layer: D10 conflict downgrades candidate by 1 notch)
  if (d10Relationship === 'CONFLICTS') {
    if (candidate === 'VERY_STRONG') {
      candidate = 'STRONG';
    } else if (candidate === 'STRONG') {
      candidate = 'MODERATE';
    } else if (candidate === 'MODERATE') {
      candidate = 'MIXED';
    }
  }

  // 5. Dasha timing impact (Activation Layer: genuine CHALLENGE downgrades candidate by 1 notch)
  if (activationStatus === 'CHALLENGE') {
    if (candidate === 'VERY_STRONG') {
      candidate = 'STRONG';
    } else if (candidate === 'STRONG') {
      candidate = mixedCount > 0 || challengedCount > 0 ? 'MIXED' : 'MODERATE';
    } else if (candidate === 'MODERATE') {
      candidate = 'MIXED';
    }
  }

  // ARCHITECTURAL CONTRACT:
  // Transit (timingStatus / timingEffect) is intentionally a timing modifier only.
  // It populates timingStatus and nudges confidence and summaries, but MUST NOT alter foundational
  // candidate status or fabricate promise where none exists.

  // 6. Enforce Natal Ceiling unconditionally
  const finalStatus = enforceCareerNatalCeiling(natalPromise, candidate);

  // 7. Calculate confidence
  const primaryEvidenceCount = (natalPromise !== 'UNDETERMINED' ? 1 : 0) + manifestationSynthesis.length;
  const isDivisionalConfirmed = d10Relationship === 'CONFIRMS' || d10Relationship === 'PARTIALLY_CONFIRMS';
  const confidence = calculateFinalConfidence(
    primaryEvidenceCount,
    stronglySupportedCount + supportedCount,
    challengedCount,
    isDivisionalConfirmed
  );

  // 8. Collect evidence IDs, rule IDs, key support and challenges
  const evidenceIdSet = new Set<string>();
  const ruleIdSet = new Set<string>(['CW-05-CAREER-SYNTHESIS']);
  const keySupport: string[] = [];
  const keyChallenges: string[] = [];

  natalEvidenceIds.forEach((id) => evidenceIdSet.add(id));
  natalRuleIds.forEach((id) => ruleIdSet.add(id));

  if (natalPromise === 'STRONG' || natalPromise === 'VERY_STRONG') {
    keySupport.push(`Strong natal career promise (${natalPromise})`);
  } else if (natalPromise === 'WEAK' || natalPromise === 'VERY_WEAK') {
    keyChallenges.push(`Challenged natal career foundation (${natalPromise})`);
  }

  for (const m of manifestationSynthesis) {
    if (m.status === 'STRONGLY_SUPPORTED' || m.status === 'SUPPORTED') {
      keySupport.push(`${m.mode}: ${m.status.toLowerCase().replace('_', ' ')}`);
    } else if (m.status === 'CHALLENGED') {
      keyChallenges.push(`${m.mode}: challenged`);
    }
    for (const factor of m.factors) {
      ruleIdSet.add(factor.id);
      if (factor.evidenceIds) factor.evidenceIds.forEach((id) => evidenceIdSet.add(id));
      if (factor.dashaEvidenceIds) factor.dashaEvidenceIds.forEach((id) => evidenceIdSet.add(id));
      if (factor.transitEvidenceIds) factor.transitEvidenceIds.forEach((id) => evidenceIdSet.add(id));
    }
  }

  if (dashaSynthesis) {
    for (const factor of dashaSynthesis.factors) {
      ruleIdSet.add(factor.id);
      if (factor.evidenceIds) factor.evidenceIds.forEach((id) => evidenceIdSet.add(id));
    }
  }

  if (timingSynthesis) {
    for (const factor of timingSynthesis.factors) {
      ruleIdSet.add(factor.id);
      if (factor.natalEvidenceIds) factor.natalEvidenceIds.forEach((id) => evidenceIdSet.add(id));
      if (factor.dashaEvidenceIds) factor.dashaEvidenceIds.forEach((id) => evidenceIdSet.add(id));
    }
  }

  if (d10Synthesis) {
    for (const item of d10Synthesis) {
      evidenceIdSet.add(item.id);
      if (item.ruleId) ruleIdSet.add(item.ruleId);
    }
  }

  // 9. Build authoritative summary statement
  let summary = `Career domain synthesis evaluates to ${finalStatus} with ${confidence} confidence.`;
  if (finalStatus === 'VERY_STRONG' || finalStatus === 'STRONG') {
    summary += ` Natal foundation is robust with strong alignment across ${strongestAreas.join(', ') || 'core manifestations'}.`;
  } else if (finalStatus === 'CHALLENGED') {
    summary += ` Natal indicators present structural challenges that constrain secondary timing activation.`;
  } else if (finalStatus === 'MIXED') {
    summary += ` Distinct manifestation paths exhibit diverging potentials across growth sectors.`;
  }

  if (dashaActivation.effect !== 'INSUFFICIENT_DATA') {
    summary += ` Operating dasha trend: ${dashaActivation.effect.toLowerCase()}.`;
  }
  if (rawTimingEffect !== 'INSUFFICIENT_DATA') {
    summary += ` Current timing trigger: ${rawTimingEffect.toLowerCase()}.`;
  }

  return Object.freeze({
    reasoningVersion: 'CW-05' as const,
    domain: 'CAREER' as const,
    status: finalStatus,
    finalStatus,
    promiseStatus,
    activationStatus,
    activationConfidence,
    activationStrength,
    activationSummary,
    activationHierarchy,
    timingStatus,
    divisionalStatus,
    manifestationStatus,
    confidence,
    primaryPromise: natalPromise,
    manifestationSummary: Object.freeze(manifestationSummary),
    strongestAreas: Object.freeze(strongestAreas),
    challengedAreas: Object.freeze(challengedAreas),
    dashaEffect: dashaActivation.effect,
    timingEffect: rawTimingEffect,
    divisionalEffect: d10Relationship,
    keySupport: Object.freeze(keySupport),
    keyChallenges: Object.freeze(keyChallenges),
    summary,
    ruleIds: Object.freeze([...ruleIdSet]),
    evidenceIds: Object.freeze([...evidenceIdSet]),
    natalEvidenceIds: Object.freeze([...new Set(natalEvidenceIds)]),
    natalRuleIds: Object.freeze([...new Set(natalRuleIds)]),
    d10Evidence: d10Synthesis ? Object.freeze([...d10Synthesis]) : undefined,
    dashaFactors: dashaSynthesis?.factors ?? (dashaSynthesis?.combined ? Object.freeze([dashaSynthesis.combined]) : undefined),
    timingFactors: timingSynthesis?.factors ? Object.freeze([...timingSynthesis.factors]) : undefined,
    manifestationFactors: manifestationSynthesis && manifestationSynthesis.length > 0
      ? Object.freeze(manifestationSynthesis.flatMap((m) => m.factors))
      : undefined
  });
}
