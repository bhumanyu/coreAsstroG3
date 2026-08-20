import type {
  DomainInterpretation,
  DomainId
} from '../interpretation';
import type {
  DomainSummary,
  LifeAnalysis,
  LifeAnalysisAiProjection,
  LifeAnalysisConclusion,
  LifeAnalysisStatus,
  SynthesizeLifeAnalysisOptions
} from './domainSynthesisTypes';
import {
  buildDomainSummaries,
  compareDomainStrength
} from './domainSynthesisStrengths';
import { deriveSharedTiming } from './domainSynthesisTiming';
import { detectCrossDomainConflicts } from './domainSynthesisConflicts';
import {
  calculateDataCompleteness,
  calculateLifeAnalysisConfidence
} from './domainSynthesisConfidence';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

export function collectEvidenceIds(
  domains: readonly DomainInterpretation[],
  conflicts: readonly { evidenceIds: readonly string[] }[],
  sharedTiming: readonly { evidenceIds: readonly string[] }[]
): readonly string[] {
  const set = new Set<string>();

  for (const d of domains) {
    if (Array.isArray(d.evidence)) {
      for (const e of d.evidence) {
        if (e && typeof e.id === 'string') {
          set.add(e.id);
        }
      }
    }
    for (const eId of d.natalPromise?.supportingEvidenceIds ?? []) {
      set.add(eId);
    }
    for (const eId of d.natalPromise?.challengingEvidenceIds ?? []) {
      set.add(eId);
    }
    for (const eId of d.dashaActivation?.evidenceIds ?? []) {
      set.add(eId);
    }
    for (const eId of d.transitTrigger?.evidenceIds ?? []) {
      set.add(eId);
    }
  }

  for (const c of conflicts) {
    for (const eId of c.evidenceIds) {
      set.add(eId);
    }
  }

  for (const st of sharedTiming) {
    for (const eId of st.evidenceIds) {
      set.add(eId);
    }
  }

  return Object.freeze(Array.from(set).sort());
}

export function determineOverallStatus(
  domainSummaries: readonly DomainSummary[],
  conflictCount: number
): LifeAnalysisStatus {
  if (domainSummaries.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const validSummaries = domainSummaries.filter(
    (d) => d.strength !== 'INSUFFICIENT_DATA'
  );
  if (validSummaries.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  if (conflictCount > 0) {
    return 'MIXED';
  }

  const statuses = validSummaries.map((s) => s.status);
  const strengths = validSummaries.map((s) => s.strength);

  const allStronglySupported = statuses.every(
    (st) => st === 'STRONGLY_SUPPORTED'
  );
  if (allStronglySupported) {
    return 'STRONGLY_SUPPORTED';
  }

  const allSupportedOrStrong = statuses.every(
    (st) => st === 'STRONGLY_SUPPORTED' || st === 'SUPPORTED'
  );
  if (allSupportedOrStrong) {
    return 'SUPPORTED';
  }

  const allChallenged = statuses.every((st) => st === 'CHALLENGED');
  if (allChallenged) {
    return 'CHALLENGED';
  }

  const allLimited = statuses.every((st) => st === 'LIMITED');
  if (allLimited) {
    return 'LIMITED';
  }

  const hasStrong = strengths.some(
    (s) => s === 'VERY_STRONG' || s === 'STRONG'
  );
  const hasWeakOrChallenged =
    strengths.some((s) => s === 'WEAK') ||
    statuses.some((st) => st === 'CHALLENGED' || st === 'LIMITED');

  if (hasStrong && hasWeakOrChallenged) {
    return 'MIXED';
  }

  return 'SUPPORTED';
}

export function buildLifeConclusion(
  domainSummaries: readonly DomainSummary[],
  strongestDomains: readonly DomainId[],
  challengedDomains: readonly DomainId[],
  conflicts: readonly { description: string }[],
  sharedTiming: readonly { statement: string }[]
): LifeAnalysisConclusion {
  const status = determineOverallStatus(domainSummaries, conflicts.length);

  let statement: string;
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      statement =
        'Overall life themes are strongly supported with prominent structural harmony across major domains.';
      break;
    case 'SUPPORTED':
      statement =
        'Overall life themes are favorably supported with dependable foundational promise.';
      break;
    case 'MIXED':
      statement =
        'Overall life themes show mixed indications with strong focal domains balanced by timing or structural considerations.';
      break;
    case 'CHALLENGED':
      statement =
        'Overall life themes encounter significant developmental challenges requiring strategic pacing.';
      break;
    case 'LIMITED':
      statement =
        'Overall life themes show limited support requiring conservative resource management.';
      break;
    case 'INSUFFICIENT_DATA':
    default:
      statement =
        'Insufficient astrological data available to synthesize life analysis.';
      break;
  }

  const summaryPoints: string[] = [];
  for (const s of domainSummaries) {
    if (s.primaryConclusion) {
      summaryPoints.push(`${s.domain}: ${s.primaryConclusion}`);
    }
  }
  for (const st of sharedTiming) {
    summaryPoints.push(st.statement);
  }
  for (const c of conflicts) {
    summaryPoints.push(c.description);
  }

  return Object.freeze({
    status,
    statement,
    summaryPoints: Object.freeze(summaryPoints),
    ...(strongestDomains.length > 0 ? { primaryDomain: strongestDomains[0] } : {}),
    ...(challengedDomains.length > 0
      ? { challengedDomain: challengedDomains[0] }
      : {})
  });
}

export function synthesizeLifeAnalysis(
  domains: readonly DomainInterpretation[],
  options?: SynthesizeLifeAnalysisOptions
): LifeAnalysis {
  let targetDomains = [...domains];
  if (!options?.includeUnavailableDomains) {
    targetDomains = targetDomains.filter(
      (d) =>
        (d.natalPromise?.strength as string) !== 'UNAVAILABLE' &&
        d.natalPromise?.strength !== 'UNDETERMINED'
    );
  }

  const domainSummaries = buildDomainSummaries(targetDomains);
  const conflicts = detectCrossDomainConflicts(targetDomains);
  const sharedTiming = deriveSharedTiming(targetDomains);
  const dataCompleteness = calculateDataCompleteness(targetDomains);
  const confidence = calculateLifeAnalysisConfidence(
    dataCompleteness,
    targetDomains,
    conflicts
  );

  const strongestDomains = Object.freeze(
    domainSummaries
      .filter((s) => s.strength === 'VERY_STRONG' || s.strength === 'STRONG')
      .sort((a, b) => compareDomainStrength(a.strength, b.strength))
      .map((s) => s.domain)
  );

  const challengedDomains = Object.freeze(
    domainSummaries
      .filter((s) => s.status === 'CHALLENGED')
      .map((s) => s.domain)
  );

  const conclusion = buildLifeConclusion(
    domainSummaries,
    strongestDomains,
    challengedDomains,
    conflicts,
    sharedTiming
  );

  const evidenceIds = collectEvidenceIds(
    targetDomains,
    conflicts,
    sharedTiming
  );

  const analysis: LifeAnalysis = {
    domains: domainSummaries,
    strongestDomains,
    challengedDomains,
    sharedTiming,
    conflicts,
    conclusion,
    dataCompleteness,
    confidence,
    evidenceIds
  };

  return deepFreeze(analysis);
}

export function projectLifeAnalysisForAi(
  analysis: LifeAnalysis
): LifeAnalysisAiProjection {
  return deepFreeze({
    status: analysis.conclusion.status,
    overallStatement: analysis.conclusion.statement,
    strongestDomains: [...analysis.strongestDomains],
    challengedDomains: [...analysis.challengedDomains],
    confidence: analysis.confidence,
    completeness: analysis.dataCompleteness.overall,
    sharedTimingCount: analysis.sharedTiming.length,
    conflictCount: analysis.conflicts.length,
    domainSummaries: analysis.domains.map((d) => ({
      domain: d.domain,
      strength: d.strength,
      status: d.status,
      confidence: d.confidence,
      primaryConclusion: d.primaryConclusion
    })),
    evidenceIds: [...analysis.evidenceIds]
  });
}
