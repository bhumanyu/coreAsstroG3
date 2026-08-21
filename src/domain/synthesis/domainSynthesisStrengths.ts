import type {
  DomainInterpretation
} from '../interpretation';
import type {
  DomainSummary,
  LifeAnalysisStatus,
  SynthesisDomainStrength
} from './domainSynthesisTypes';

export const STRENGTH_RANK: Readonly<Record<SynthesisDomainStrength, number>> = Object.freeze({
  VERY_STRONG: 4,
  STRONG: 3,
  MODERATE: 2,
  WEAK: 1,
  INSUFFICIENT_DATA: 0
});

export const STRENGTH_ORDER: readonly SynthesisDomainStrength[] = Object.freeze([
  'VERY_STRONG',
  'STRONG',
  'MODERATE',
  'WEAK',
  'INSUFFICIENT_DATA'
]);

export function compareDomainStrength(
  a: SynthesisDomainStrength,
  b: SynthesisDomainStrength
): number {
  return (STRENGTH_RANK[b] ?? 0) - (STRENGTH_RANK[a] ?? 0);
}

export function normalizeSynthesisStrength(
  raw: string | undefined
): SynthesisDomainStrength {
  if (!raw) {
    return 'INSUFFICIENT_DATA';
  }
  const upper = raw.trim().toUpperCase();

  switch (upper) {
    case 'STRONGLY_SUPPORTED':
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'SUPPORTED':
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
    case 'MIXED':
    case 'NEUTRAL':
      return 'MODERATE';
    case 'CHALLENGED':
    case 'LIMITED':
    case 'WEAK':
    case 'VERY_WEAK':
    case 'LIMITED_EVIDENCE':
    case 'ADVERSE':
      return 'WEAK';
    case 'INSUFFICIENT_DATA':
    case 'UNDETERMINED':
    case 'UNAVAILABLE':
    default:
      return 'INSUFFICIENT_DATA';
  }
}

export function normalizeLifeAnalysisStatus(
  raw: string | undefined
): LifeAnalysisStatus {
  if (!raw) {
    return 'INSUFFICIENT_DATA';
  }
  const upper = raw.trim().toUpperCase();

  switch (upper) {
    case 'STRONGLY_SUPPORTED':
    case 'VERY_STRONG':
      return 'STRONGLY_SUPPORTED';
    case 'SUPPORTED':
    case 'STRONG':
      return 'SUPPORTED';
    case 'MODERATE':
    case 'MIXED':
    case 'NEUTRAL':
      return 'MIXED';
    case 'CHALLENGED':
      return 'CHALLENGED';
    case 'LIMITED':
    case 'WEAK':
    case 'VERY_WEAK':
    case 'LIMITED_EVIDENCE':
    case 'ADVERSE':
      return 'LIMITED';
    case 'INSUFFICIENT_DATA':
    case 'UNDETERMINED':
    case 'UNAVAILABLE':
    default:
      return 'INSUFFICIENT_DATA';
  }
}

export function extractRawDomainStrength(domain: DomainInterpretation): string {
  return domain.natalPromise?.strength ?? 'INSUFFICIENT_DATA';
}

export function buildDomainSummary(
  domain: DomainInterpretation
): DomainSummary {
  const raw = extractRawDomainStrength(domain);
  const strength = normalizeSynthesisStrength(raw);
  const status = normalizeLifeAnalysisStatus(raw);
  const confidence = domain.conclusion?.confidence ?? 'VERY_LOW';
  const supportingEvidenceIds = Object.freeze([
    ...(domain.natalPromise?.supportingEvidenceIds ?? [])
  ]);
  const challengingEvidenceIds = Object.freeze([
    ...(domain.natalPromise?.challengingEvidenceIds ?? [])
  ]);
  const primaryConclusion = domain.conclusion?.statement ?? '';

  return Object.freeze({
    domain: domain.domain,
    status,
    strength,
    confidence,
    supportingEvidenceIds,
    challengingEvidenceIds,
    primaryConclusion
  });
}

export function buildDomainSummaries(
  domains: readonly DomainInterpretation[]
): readonly DomainSummary[] {
  return Object.freeze(domains.map(buildDomainSummary));
}
