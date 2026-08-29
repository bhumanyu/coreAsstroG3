import type {
  FinalDomainConfidence,
  FinalDomainStatus,
  SynthesisAxisStatus
} from './careerWealthFinalSynthesisTypes';

export type ConfidenceEvidenceQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export type ConfidenceContradictionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type FinalDomainStatusForConfidence = FinalDomainStatus;

export interface FinalConfidenceInput {
  /**
   * Foundational natal promise.
   *
   * This controls the ceiling of the ASTROLOGICAL PROMISE,
   * not confidence itself.
   */
  readonly natalPromise:
    | 'VERY_STRONG'
    | 'STRONG'
    | 'MODERATE'
    | 'MIXED'
    | 'WEAK'
    | 'VERY_WEAK'
    | 'UNDETERMINED';

  /**
   * Number of explicitly supplied natal evidence IDs.
   *
   * This is used for evidence coverage, NOT as a proxy
   * for astrological strength.
   */
  readonly natalEvidenceCount: number;

  /**
   * Dasha activation status and confidence.
   */
  readonly activationStatus: SynthesisAxisStatus;
  readonly activationConfidence?: FinalDomainConfidence;

  /**
   * CW-05C consistency diagnostics.
   */
  readonly dashaEffectConsistent?: boolean;
  readonly dashaHierarchyRolesConsistent?: boolean;

  /**
   * Timing axis.
   */
  readonly timingStatus: SynthesisAxisStatus;

  /**
   * Existing CareerTimingSynthesis confidence is numeric [0,1].
   */
  readonly timingConfidence?: number;

  /**
   * Divisional relationship.
   */
  readonly divisionalStatus:
    | 'CONFIRMS'
    | 'PARTIALLY_CONFIRMS'
    | 'MODIFIES'
    | 'CONFLICTS'
    | 'UNAVAILABLE';

  /**
   * Manifestation-level confidence values.
   */
  readonly manifestationConfidences: readonly FinalDomainConfidence[];

  /**
   * Manifestation directional statuses.
   */
  readonly manifestationStatuses: readonly FinalDomainStatus[];

  /**
   * Number of independently represented evidence sources.
   *
   * Expected sources:
   * NATAL
   * DASHA
   * TIMING
   * D10
   * MANIFESTATION
   */
  readonly evidenceSourceCount: number;
}

export interface FinalConfidenceBreakdown {
  readonly final: FinalDomainConfidence;

  readonly natalEvidenceQuality: ConfidenceEvidenceQuality;
  readonly activationQuality: ConfidenceEvidenceQuality;
  readonly timingQuality: ConfidenceEvidenceQuality;
  readonly divisionalQuality: ConfidenceEvidenceQuality;
  readonly manifestationQuality: ConfidenceEvidenceQuality;

  readonly evidenceCoverage: 'HIGH' | 'MEDIUM' | 'LOW';

  readonly contradictionLevel: ConfidenceContradictionLevel;

  readonly dashaConsistency: 'CONSISTENT' | 'INCONSISTENT' | 'UNAVAILABLE';

  /**
   * True when the confidence was capped by a
   * structural inconsistency.
   */
  readonly consistencyCapApplied: boolean;

  /**
   * Human-readable deterministic explanation.
   */
  readonly reasons: readonly string[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function qualityFromCount(count: number): ConfidenceEvidenceQuality {
  if (count >= 2) {
    return 'HIGH';
  }

  if (count === 1) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function qualityFromConfidence(
  confidence?: FinalDomainConfidence
): ConfidenceEvidenceQuality {
  switch (confidence) {
    case 'HIGH':
      return 'HIGH';

    case 'MEDIUM':
      return 'MEDIUM';

    case 'LOW':
      return 'LOW';

    default:
      return 'LOW';
  }
}

function qualityFromTimingConfidence(
  confidence?: number
): ConfidenceEvidenceQuality {
  if (confidence === undefined) {
    return 'LOW';
  }

  const normalized = clamp01(confidence);

  if (normalized >= 0.75) {
    return 'HIGH';
  }

  if (normalized >= 0.45) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function qualityFromDivisionalStatus(
  status: FinalConfidenceInput['divisionalStatus']
): ConfidenceEvidenceQuality {
  switch (status) {
    case 'CONFIRMS':
      return 'HIGH';

    case 'PARTIALLY_CONFIRMS':
    case 'MODIFIES':
      return 'MEDIUM';

    case 'CONFLICTS':
      return 'LOW';

    case 'UNAVAILABLE':
    default:
      return 'LOW';
  }
}

function qualityFromManifestations(
  confidences: readonly FinalDomainConfidence[],
  statuses: readonly FinalDomainStatus[]
): ConfidenceEvidenceQuality {
  if (confidences.length === 0) {
    return 'LOW';
  }

  const highCount = confidences.filter(
    (confidence) => confidence === 'HIGH'
  ).length;

  const mediumOrHigherCount = confidences.filter(
    (confidence) => confidence === 'HIGH' || confidence === 'MEDIUM'
  ).length;

  const meaningfulStatuses = statuses.filter(
    (status) => status !== 'INSUFFICIENT_DATA'
  ).length;

  if (highCount >= 2 && meaningfulStatuses >= 2) {
    return 'HIGH';
  }

  if (highCount >= 1 || mediumOrHigherCount >= 1) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function calculateEvidenceCoverage(
  input: FinalConfidenceInput
): 'HIGH' | 'MEDIUM' | 'LOW' {
  const availableSources = Math.max(
    0,
    Math.min(5, input.evidenceSourceCount)
  );

  if (availableSources >= 4) {
    return 'HIGH';
  }

  if (availableSources >= 2) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function calculateContradictionLevel(
  input: FinalConfidenceInput
): ConfidenceContradictionLevel {
  let high = 0;
  let medium = 0;
  let low = 0;

  // (a) Divisional conflicts with natal
  if (input.divisionalStatus === 'CONFLICTS') {
    high += 1;
  }

  // (b) CW-05C Dasha structural inconsistency is a genuine contradiction
  if (
    input.dashaEffectConsistent === false ||
    input.dashaHierarchyRolesConsistent === false
  ) {
    high += 1;
  }

  // (c) Both supporting and challenged manifestations present (genuine mixed outcome)
  const challengedManifestations = input.manifestationStatuses.filter(
    (status) => status === 'CHALLENGED'
  ).length;

  const supportingManifestations = input.manifestationStatuses.filter(
    (status) => status === 'STRONG' || status === 'VERY_STRONG'
  ).length;

  if (supportingManifestations > 0 && challengedManifestations > 0) {
    low += 1;
  }

  if (high >= 2) {
    return 'HIGH';
  }

  if (high === 1 || medium >= 2) {
    return 'MEDIUM';
  }

  if (low > 0) {
    return 'LOW';
  }

  return 'NONE';
}

function determineBaseConfidence(
  input: FinalConfidenceInput,
  breakdown: {
    readonly natal: ConfidenceEvidenceQuality;
    readonly activation: ConfidenceEvidenceQuality;
    readonly timing: ConfidenceEvidenceQuality;
    readonly divisional: ConfidenceEvidenceQuality;
    readonly manifestation: ConfidenceEvidenceQuality;
    readonly coverage: 'HIGH' | 'MEDIUM' | 'LOW';
  }
): FinalDomainConfidence {
  if (input.natalPromise === 'UNDETERMINED') {
    return 'LOW';
  }

  const highQualityAxes = [
    breakdown.natal,
    breakdown.activation,
    breakdown.timing,
    breakdown.divisional,
    breakdown.manifestation
  ].filter((quality) => quality === 'HIGH').length;

  const mediumOrHigherAxes = [
    breakdown.natal,
    breakdown.activation,
    breakdown.timing,
    breakdown.divisional,
    breakdown.manifestation
  ].filter(
    (quality) => quality === 'HIGH' || quality === 'MEDIUM'
  ).length;

  /*
   * HIGH confidence requires:
   *
   * - at least two high-quality independent anchors
   * - reasonable evidence coverage
   * - known natal promise
   *
   * A positive or negative direction does not affect this.
   */
  if (
    highQualityAxes >= 2 &&
    (breakdown.coverage === 'HIGH' || breakdown.coverage === 'MEDIUM')
  ) {
    return 'HIGH';
  }

  if (mediumOrHigherAxes >= 2 && breakdown.coverage !== 'LOW') {
    return 'MEDIUM';
  }

  /*
   * One reliable axis can establish MEDIUM confidence
   * when the natal promise itself is known.
   */
  if (
    breakdown.natal === 'MEDIUM' ||
    breakdown.activation === 'HIGH' ||
    breakdown.divisional === 'HIGH'
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function applyConsistencyCap(
  confidence: FinalDomainConfidence,
  input: FinalConfidenceInput
): {
  readonly confidence: FinalDomainConfidence;
  readonly applied: boolean;
} {
  const hasInconsistency =
    input.dashaEffectConsistent === false ||
    input.dashaHierarchyRolesConsistent === false;

  if (!hasInconsistency) {
    return {
      confidence,
      applied: false
    };
  }

  /*
   * A Dasha inconsistency reduces confidence in the
   * synthesis, but MUST NOT change activationStatus
   * or natal promise.
   * applied is only true if the cap actually reduced confidence from HIGH to MEDIUM.
   */
  if (confidence === 'HIGH') {
    return {
      confidence: 'MEDIUM',
      applied: true
    };
  }

  return {
    confidence,
    applied: false
  };
}

export function calculateFinalConfidenceV2(
  input: FinalConfidenceInput
): FinalConfidenceBreakdown {
  const natalQuality = qualityFromCount(input.natalEvidenceCount);

  const activationQuality = qualityFromConfidence(input.activationConfidence);

  const timingQuality = qualityFromTimingConfidence(input.timingConfidence);

  const divisionalQuality = qualityFromDivisionalStatus(input.divisionalStatus);

  const manifestationQuality = qualityFromManifestations(
    input.manifestationConfidences,
    input.manifestationStatuses
  );

  const coverage = calculateEvidenceCoverage(input);

  const contradiction = calculateContradictionLevel(input);

  const dashaConsistency =
    input.dashaEffectConsistent === undefined &&
    input.dashaHierarchyRolesConsistent === undefined
      ? 'UNAVAILABLE'
      : input.dashaEffectConsistent === true &&
        input.dashaHierarchyRolesConsistent === true
      ? 'CONSISTENT'
      : input.dashaEffectConsistent === false ||
        input.dashaHierarchyRolesConsistent === false
      ? 'INCONSISTENT'
      : 'UNAVAILABLE';

  let confidence = determineBaseConfidence(input, {
    natal: natalQuality,
    activation: activationQuality,
    timing: timingQuality,
    divisional: divisionalQuality,
    manifestation: manifestationQuality,
    coverage
  });

  const consistency = applyConsistencyCap(confidence, input);

  confidence = consistency.confidence;

  /*
   * Contradiction reduces certainty only.
   * It does not rewrite the direction or promise.
   */
  if (
    (contradiction === 'HIGH' || contradiction === 'MEDIUM') &&
    confidence === 'HIGH'
  ) {
    confidence = 'MEDIUM';
  }

  const reasons: string[] = [];

  reasons.push(`Natal evidence quality: ${natalQuality}.`);
  reasons.push(`Dasha activation evidence quality: ${activationQuality}.`);
  reasons.push(`Timing evidence quality: ${timingQuality}.`);
  reasons.push(`Divisional evidence quality: ${divisionalQuality}.`);
  reasons.push(`Manifestation evidence quality: ${manifestationQuality}.`);
  reasons.push(`Evidence coverage: ${coverage}.`);
  reasons.push(`Contradiction level: ${contradiction}.`);

  if (dashaConsistency === 'INCONSISTENT') {
    reasons.push(
      'Dasha consistency diagnostics are inconsistent; final confidence is capped where necessary.'
    );
  }

  return Object.freeze({
    final: confidence,

    natalEvidenceQuality: natalQuality,
    activationQuality,
    timingQuality,
    divisionalQuality,
    manifestationQuality,

    evidenceCoverage: coverage,

    contradictionLevel: contradiction,

    dashaConsistency,

    consistencyCapApplied: consistency.applied,

    reasons: Object.freeze(reasons)
  });
}
