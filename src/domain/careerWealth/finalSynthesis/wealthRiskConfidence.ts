import type { WealthDimension } from '../../wealth/wealthTypes';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { FinalDomainConfidence } from './careerWealthFinalSynthesisTypes';
import { detectDomainConflicts } from '../../interpretation';

export type WealthRiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'INSUFFICIENT_DATA';
export type WealthEvidenceFamily =
  | 'SECOND_HOUSE' | 'SECOND_LORD'
  | 'ELEVENTH_HOUSE' | 'ELEVENTH_LORD'
  | 'NINTH_HOUSE' | 'NINTH_LORD'
  | 'FIFTH_HOUSE' | 'FIFTH_LORD';
export type WealthCoverageState = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
export type WealthProducerDiagnosticSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface WealthProducerDiagnostic {
  readonly code: string;
  readonly severity: WealthProducerDiagnosticSeverity;
  readonly message: string;
  readonly evidenceFamily?: string;
  readonly evidenceIds?: readonly string[];
}

export interface WealthRiskReason {
  readonly code: string;
  readonly message: string;
  readonly evidenceIds: readonly string[];
}

export interface WealthRiskAssessment {
  readonly dimension: WealthDimension;
  readonly classification: WealthRiskLevel;
  readonly evidenceIds: readonly string[];
  readonly reasons: readonly WealthRiskReason[];
  readonly evidenceCoverage: WealthCoverageState;
}

export interface WealthConfidenceAssessment {
  readonly level: FinalDomainConfidence;
  readonly evidenceCoverage: WealthCoverageState;
  readonly requiredFamilies: readonly WealthEvidenceFamily[];
  readonly presentFamilies: readonly WealthEvidenceFamily[];
  readonly missingFamilies: readonly WealthEvidenceFamily[];
  readonly d2Availability: 'UNAVAILABLE';
  readonly producerDiagnosticCount: number;
  readonly blockingDiagnosticCodes: readonly string[];
  readonly conflictEvidenceIds: readonly string[];
  readonly reasons: readonly string[];
}

export interface WealthRiskConfidenceAssessment {
  readonly dimensions: Readonly<Record<WealthDimension, WealthRiskAssessment>>;
  readonly confidence: WealthConfidenceAssessment;
}

const REQUIRED_FAMILIES: Readonly<Record<WealthDimension, readonly WealthEvidenceFamily[]>> = Object.freeze({
  ACCUMULATION: Object.freeze(['SECOND_HOUSE', 'SECOND_LORD'] as WealthEvidenceFamily[]),
  GAINS: Object.freeze(['ELEVENTH_HOUSE', 'ELEVENTH_LORD'] as WealthEvidenceFamily[]),
  FORTUNE: Object.freeze(['NINTH_HOUSE', 'NINTH_LORD'] as WealthEvidenceFamily[]),
  SPECULATION: Object.freeze(['FIFTH_HOUSE', 'FIFTH_LORD'] as WealthEvidenceFamily[])
});

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => typeof value === 'string' && value.trim()))].sort());
}

function coverageFor(present: readonly WealthEvidenceFamily[]): WealthCoverageState {
  if (present.length === 2) return 'AVAILABLE';
  return present.length === 1 ? 'PARTIAL' : 'UNAVAILABLE';
}

function riskForEvidence(
  dimension: WealthDimension,
  evidence: readonly DomainEvidence[],
  missingFamilies: readonly WealthEvidenceFamily[]
): WealthRiskAssessment {
  const relevant = evidence.filter((item) =>
    item.domain === 'WEALTH' &&
    item.dimension === dimension &&
    item.phase === 'NATAL_PROMISE' &&
    REQUIRED_FAMILIES[dimension].includes(item.evidenceFamily as WealthEvidenceFamily)
  );
  const ids = sortedUnique(relevant.map((item) => item.id));
  const challenges = relevant.filter((item) => item.polarity === 'CHALLENGING');
  const supports = relevant.filter((item) => item.polarity === 'SUPPORTING');
  const reasons: WealthRiskReason[] = [];

  if (missingFamilies.length > 0) {
    reasons.push({
      code: 'REQUIRED_EVIDENCE_FAMILY_MISSING',
      message: `Required evidence families are missing: ${missingFamilies.join(', ')}. Missing evidence is not treated as adverse evidence.`,
      evidenceIds: Object.freeze([])
    });
  }

  if (supports.length > 0) {
    reasons.push({
      code: 'SUPPORTING_EVIDENCE_PRESENT',
      message: `${supports.length} supporting evidence occurrence(s) are available for ${dimension}.`,
      evidenceIds: sortedUnique(supports.map((item) => item.id))
    });
  }

  if (challenges.length > 0) {
    reasons.push({
      code: 'CHALLENGING_EVIDENCE_PRESENT',
      message: `${challenges.length} challenging evidence occurrence(s) are available for ${dimension}.`,
      evidenceIds: sortedUnique(challenges.map((item) => item.id))
    });
  }

  const conflictingIds: string[] = [];
  if (supports.length > 0 && challenges.length > 0) {
    reasons.push({
      code: 'CONFLICTING_EVIDENCE_PRESENT',
      message: 'Supporting and challenging evidence coexist and are retained as an explicit evidence conflict.',
      evidenceIds: sortedUnique([...supports.map((item) => item.id), ...challenges.map((item) => item.id)])
    });
  }

  const presentFamilies = REQUIRED_FAMILIES[dimension].filter((family) =>
    relevant.some((item) => item.evidenceFamily === family)
  );
  const evidenceCoverage = coverageFor(presentFamilies);

  let classification: WealthRiskLevel;
  if (evidenceCoverage !== 'AVAILABLE' || ids.length === 0) {
    classification = 'INSUFFICIENT_DATA';
  } else if (conflictingIds.length > 0) {
    classification = 'ELEVATED';
  } else if (supports.length > 0 && challenges.length > 0) {
    classification = 'ELEVATED';
  } else if (challenges.length >= 3) {
    classification = 'HIGH';
  } else if (challenges.length >= 2) {
    classification = 'ELEVATED';
  } else if (challenges.length === 1) {
    classification = 'MODERATE';
  } else {
    classification = 'LOW';
  }

  reasons.push({
    code: 'QUALITATIVE_RISK_POLICY',
    message: `Risk classified as ${classification} using available dimension-specific evidence only; this is a qualitative classification, not a probability.`,
    evidenceIds: ids
  });

  return Object.freeze({
    dimension,
    classification,
    evidenceIds: ids,
    reasons: Object.freeze(reasons),
    evidenceCoverage
  });
}

export function assessWealthRiskAndConfidence(input: {
  readonly evidence: readonly DomainEvidence[];
  readonly producerDiagnostics?: readonly WealthProducerDiagnostic[];
  readonly d2Availability?: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
}): WealthRiskConfidenceAssessment {
  const diagnostics = input.producerDiagnostics ?? [];
  const evidence = input.evidence ?? [];
  const dimensions = {} as Record<WealthDimension, WealthRiskAssessment>;
  const allPresent = new Set<WealthEvidenceFamily>();
  const allRequired = new Set<WealthEvidenceFamily>();

  (Object.keys(REQUIRED_FAMILIES) as WealthDimension[]).forEach((dimension) => {
    const required = REQUIRED_FAMILIES[dimension];
    required.forEach((family) => allRequired.add(family));
    const present = required.filter((family) => evidence.some((item) =>
      item.domain === 'WEALTH' &&
      item.evidenceFamily === family &&
      item.phase === 'NATAL_PROMISE'
    ));
    present.forEach((family) => allPresent.add(family));
    const missingForDimension = required.filter((family) => !present.includes(family));
    const assessment = riskForEvidence(dimension, evidence, missingForDimension);
    const hasDimensionConflict = conflictsByDimension[dimension].size > 0;
    dimensions[dimension] = hasDimensionConflict
      ? Object.freeze({
          ...assessment,
          classification: assessment.classification === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'ELEVATED',
          reasons: Object.freeze([...assessment.reasons, Object.freeze({
            code: 'CANONICAL_EVIDENCE_CONFLICT',
            message: 'CW-05 detected a conflict between supporting and challenging evidence within this dimension.',
            evidenceIds: sortedUnique([...conflictsByDimension[dimension]])
          })])
        })
      : assessment;
  });

  const presentFamilies = [...allPresent].sort() as WealthEvidenceFamily[];
  const requiredFamilies = [...allRequired].sort() as WealthEvidenceFamily[];
  const missingFamilies = requiredFamilies.filter((family) => !allPresent.has(family));
  const coverage: WealthCoverageState = presentFamilies.length === requiredFamilies.length
    ? 'AVAILABLE'
    : presentFamilies.length > 0 ? 'PARTIAL' : 'UNAVAILABLE';

  const natalWealthEvidence = evidence.filter((item) => item.domain === 'WEALTH' && item.phase === 'NATAL_PROMISE');
  const conflicts = detectDomainConflicts('WEALTH', natalWealthEvidence);
  const conflictIds = sortedUnique(conflicts.flatMap((conflict) => [
    ...conflict.positiveEvidenceIds,
    ...conflict.negativeEvidenceIds
  ]));
  const conflictsByDimension = (Object.keys(REQUIRED_FAMILIES) as WealthDimension[]).reduce(
    (result, dimension) => {
      const evidenceIds = new Set(
        natalWealthEvidence
          .filter((item) => item.dimension === dimension)
          .map((item) => item.id)
      );
      const dimensionConflictIds = conflicts
        .filter((conflict) => conflict.positiveEvidenceIds.some((id) => evidenceIds.has(id)) &&
          conflict.negativeEvidenceIds.some((id) => evidenceIds.has(id)))
        .flatMap((conflict) => [...conflict.positiveEvidenceIds, ...conflict.negativeEvidenceIds]);
      result[dimension] = new Set(dimensionConflictIds);
      return result;
    },
    {} as Record<WealthDimension, Set<string>>
  );
  const blockingDiagnostics = diagnostics
    .filter((diagnostic) => diagnostic.severity === 'ERROR')
    .map((diagnostic) => diagnostic.code);
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'WARNING');

  const reasonList: string[] = [
    `Required Wealth evidence-family coverage is ${coverage} (${presentFamilies.length}/${requiredFamilies.length}).`,
    `Missing required families: ${missingFamilies.length ? missingFamilies.join(', ') : 'none'}.`,
    'D2 is UNAVAILABLE under the committed A08/C02B validation gate and is excluded from risk evidence and coverage.',
    'Risk classification is qualitative and is not a calibrated statistical probability.'
  ];
  if (conflictIds.length) reasonList.push(`Conflicting evidence occurrences: ${conflictIds.join(', ')}.`);
  if (blockingDiagnostics.length) reasonList.push(`Blocking producer diagnostics: ${sortedUnique(blockingDiagnostics).join(', ')}.`);
  if (warnings.length) reasonList.push(`${warnings.length} producer warning diagnostic(s) were reported.`);

  let level: FinalDomainConfidence;
  if (coverage === 'UNAVAILABLE' || blockingDiagnostics.length > 0) {
    level = 'LOW';
  } else if (coverage === 'PARTIAL' || conflictIds.length > 0 || warnings.length > 0) {
    level = 'LOW';
  } else {
    level = 'MEDIUM';
  }

  return Object.freeze({
    dimensions: Object.freeze(dimensions),
    confidence: Object.freeze({
      level,
      evidenceCoverage: coverage,
      requiredFamilies: Object.freeze(requiredFamilies),
      presentFamilies: Object.freeze(presentFamilies),
      missingFamilies: Object.freeze(missingFamilies),
      d2Availability: 'UNAVAILABLE',
      producerDiagnosticCount: diagnostics.length,
      blockingDiagnosticCodes: sortedUnique(blockingDiagnostics),
      conflictEvidenceIds: conflictIds,
      reasons: Object.freeze(reasonList)
    })
  });
}
