import type {
  CareerFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  FinalDomainStatus,
  ManifestationSummary
} from './careerWealthFinalSynthesisTypes';
import { enforceCareerNatalCeiling } from './finalSynthesisGuardrails';
import { calculateFinalConfidence } from './finalSynthesisConfidence';

export function synthesizeCareerFinal(
  input: CareerFinalSynthesisInput
): CareerWealthFinalSynthesis {
  const {
    natalPromise,
    dashaSynthesis,
    timingSynthesis,
    manifestationSynthesis = [],
    d10Relationship = 'UNAVAILABLE'
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

  // 2. Derive base candidate status from Natal Promise + Manifestations
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
    const dashaSupports =
      dashaSynthesis?.dashaEffect === 'SUPPORTS' ||
      dashaSynthesis?.combined?.combinedEffect === 'SUPPORTS' ||
      dashaSynthesis?.combined?.combinedEffect === 'STRONGLY_SUPPORTS';
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

  // 3. Dasha modifier
  const dashaEffect = dashaSynthesis?.dashaEffect ?? dashaSynthesis?.combined?.combinedEffect ?? 'INSUFFICIENT_DATA';
  if (dashaEffect === 'CHALLENGES' || dashaEffect === 'STRONGLY_CHALLENGES') {
    if (candidate === 'VERY_STRONG') {
      candidate = mixedCount > 0 || challengedCount > 0 ? 'MIXED' : 'STRONG';
    } else if (candidate === 'STRONG' && (mixedCount > 0 || challengedCount > 0)) {
      candidate = 'MIXED';
    }
  }

  // 4. D10 structural adjustment
  const divisionalEffect = d10Relationship;
  if (d10Relationship === 'CONFLICTS') {
    if (candidate === 'VERY_STRONG') {
      candidate = 'STRONG';
    } else if (candidate === 'STRONG') {
      candidate = 'MODERATE';
    }
  }

  // 5. Enforce Natal Ceiling unconditionally
  const finalStatus = enforceCareerNatalCeiling(natalPromise, candidate);

  // 6. Timing effect
  const timingEffect = timingSynthesis?.timingEffect ?? timingSynthesis?.transitEffect ?? 'INSUFFICIENT_DATA';

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

  // 9. Build authoritative summary statement
  let summary = `Career domain synthesis evaluates to ${finalStatus} with ${confidence} confidence.`;
  if (finalStatus === 'VERY_STRONG' || finalStatus === 'STRONG') {
    summary += ` Natal foundation is robust with strong alignment across ${strongestAreas.join(', ') || 'core manifestations'}.`;
  } else if (finalStatus === 'CHALLENGED') {
    summary += ` Natal indicators present structural challenges that constrain secondary timing activation.`;
  } else if (finalStatus === 'MIXED') {
    summary += ` Distinct manifestation paths exhibit diverging potentials across growth sectors.`;
  }

  if (dashaEffect !== 'INSUFFICIENT_DATA') {
    summary += ` Operating dasha trend: ${dashaEffect.toLowerCase()}.`;
  }
  if (timingEffect !== 'INSUFFICIENT_DATA') {
    summary += ` Current timing trigger: ${timingEffect.toLowerCase()}.`;
  }

  return Object.freeze({
    reasoningVersion: 'CW-05' as const,
    domain: 'CAREER' as const,
    status: finalStatus,
    confidence,
    primaryPromise: natalPromise,
    manifestationSummary: Object.freeze(manifestationSummary),
    strongestAreas: Object.freeze(strongestAreas),
    challengedAreas: Object.freeze(challengedAreas),
    dashaEffect,
    timingEffect,
    divisionalEffect,
    keySupport: Object.freeze(keySupport),
    keyChallenges: Object.freeze(keyChallenges),
    summary,
    ruleIds: Object.freeze([...ruleIdSet]),
    evidenceIds: Object.freeze([...evidenceIdSet])
  });
}
