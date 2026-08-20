import type {
  DomainEvidence,
  DomainStrength,
  EvidenceSource,
  VargaRelationship,
  NatalPromise,
  DashaActivation,
  TransitTrigger,
  VargaConfirmation,
  DomainConflict,
  DomainManifestation,
  TimingActivationEffect,
  TransitTriggerEffect,
  ManifestationMode
} from '../interpretation';
import type { CareerTimingActivation, CareerConclusionData } from './careerTypes';

export function resolveCareerConclusionStrength(
  natalStrength: DomainStrength,
  d10Relationship: VargaRelationship,
  conflicts: readonly DomainConflict[]
): DomainStrength {
  // If D10 conflicts, apply systematic divisional downgrade
  if (d10Relationship === 'CONFLICTS') {
    if (natalStrength === 'VERY_STRONG') {
      return 'STRONG';
    }
    if (natalStrength === 'STRONG') {
      return 'MODERATE';
    }
    if (natalStrength === 'MODERATE') {
      return 'MIXED';
    }
  }

  // Hierarchy rule: If only transit conflict exists and natal promise is strong, do NOT collapse to generic MIXED
  const hasOnlyTransitConflict =
    conflicts.length > 0 &&
    conflicts.every((c) => c.tier === 'PRIMARY_VS_TRANSIT' || c.tier === 'PRIMARY_VS_TIMING');
  if (hasOnlyTransitConflict && (natalStrength === 'STRONG' || natalStrength === 'VERY_STRONG')) {
    return natalStrength;
  }

  return natalStrength;
}

export function calculateDomainStrength(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[]
): DomainStrength {
  if (supporting.length === 0 && challenging.length === 0) {
    return 'UNDETERMINED';
  }

  const hasStrongSupport = supporting.some(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );
  const hasStrongChallenge = challenging.some(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );

  if (supporting.length > 0 && challenging.length > 0) {
    if (hasStrongSupport && !hasStrongChallenge && supporting.length >= 3) {
      return 'STRONG';
    }
    return 'MIXED';
  }

  if (supporting.length > 0 && challenging.length === 0) {
    if (hasStrongSupport && supporting.length >= 2) {
      return 'VERY_STRONG';
    }
    return 'STRONG';
  }

  if (challenging.length > 0 && supporting.length === 0) {
    if (hasStrongChallenge) {
      return 'VERY_WEAK';
    }
    return 'WEAK';
  }

  return 'MODERATE';
}

export function calculateVargaStrength(
  evidence: readonly DomainEvidence[],
  varga: EvidenceSource
): DomainStrength {
  const vargaEvidence = evidence.filter((e) => e.source === varga);
  const supporting = vargaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = vargaEvidence.filter((e) => e.polarity === 'CHALLENGING');

  return calculateDomainStrength(supporting, challenging);
}

export function buildCareerNatalStatement(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[],
  legacySummary?: string
): string {
  const natalSupporting = supporting.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challenging.filter((e) => e.phase === 'NATAL_PROMISE');

  if (natalSupporting.length > 0 && natalChallenging.length === 0) {
    return `Natal career promise is strongly indicated with ${natalSupporting.length} supporting structural factors.`;
  }
  if (natalSupporting.length > 0 && natalChallenging.length > 0) {
    return `Natal career promise presents mixed structural indications with ${natalSupporting.length} supporting and ${natalChallenging.length} challenging factors.`;
  }
  if (natalChallenging.length > 0) {
    return `Natal career promise faces structural challenges.`;
  }
  return legacySummary || 'Natal career promise evaluation is complete.';
}

export function buildCareerDashaStatement(
  dashaEvidence: readonly DomainEvidence[],
  effect?: TimingActivationEffect
): string {
  if (dashaEvidence.length === 0 || effect === 'INSUFFICIENT_DATA' || effect === 'DOES_NOT_ACTIVATE') {
    return 'Current Dasha period provides no active support for natal career promise.';
  }
  if (effect === 'UNKNOWN') {
    return 'Dasha activation could not be established from linked natal career evidence.';
  }
  if (effect === 'CHALLENGES') {
    return 'Current Dasha period indicates challenging timing for career initiatives.';
  }
  if (effect === 'PARTIALLY_ACTIVATES') {
    return 'Current Dasha period provides mixed support for career initiatives alongside adjustments.';
  }
  if (effect === 'ACTIVATES') {
    return 'Current Dasha period actively supports natal career promise and professional growth.';
  }
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return 'Current Dasha period actively supports career manifestations.';
  }
  return 'Current Dasha period indicates mixed or challenging timing for career initiatives.';
}

export function buildCareerTransitStatement(
  transitEvidence: readonly DomainEvidence[],
  effect?: TransitTriggerEffect
): string {
  if (transitEvidence.length === 0 || effect === 'NO_MATERIAL_TRIGGER') {
    return 'No material transit trigger identified for career timing.';
  }
  if (effect === 'UNKNOWN') {
    return 'Transit influence could not be confirmed against linked natal career factors.';
  }
  if (effect === 'CHALLENGE') {
    return 'Current transit pressure may increase professional demands or structural friction.';
  }
  if (effect === 'MODIFIER') {
    return 'Current transits provide a modifying influence with both opportunities and adjustments.';
  }
  if (effect === 'TRIGGER') {
    return 'Active transit triggers are currently stimulating career opportunities.';
  }
  const hasChallenge = transitEvidence.some((e) => e.polarity === 'CHALLENGING');
  if (hasChallenge) {
    return 'Current transit pressure may increase professional demands or restructuring.';
  }
  return 'Transit triggers are currently influencing career timing.';
}

export function buildD10Statement(
  d10Evidence: readonly DomainEvidence[],
  relationship: VargaRelationship
): string {
  if (relationship === 'UNAVAILABLE' || d10Evidence.length === 0) {
    return 'D10 divisional analysis unavailable or neutral.';
  }
  if (relationship === 'CONFIRMS') {
    return 'D10 Dasamsa confirms and elevates professional execution and status.';
  }
  if (relationship === 'CONFLICTS') {
    return 'D10 Dasamsa diverges from natal promise, indicating execution friction in career realization.';
  }
  if (relationship === 'MODIFIES') {
    return 'D10 Dasamsa modifies the career orientation toward specialized divisional roles.';
  }
  return 'D10 Dasamsa partially confirms career execution.';
}

export function resolveCurrentActivation(
  timingActivations?: readonly CareerTimingActivation[]
): 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'INACTIVE' | 'UNKNOWN' {
  if (!timingActivations || timingActivations.length === 0) {
    return 'UNKNOWN';
  }
  if (timingActivations.some((t) => t.effect === 'ACTIVATES')) {
    return 'ACTIVE';
  }
  if (timingActivations.some((t) => t.effect === 'PARTIALLY_ACTIVATES')) {
    return 'PARTIALLY_ACTIVE';
  }
  if (timingActivations.some((t) => t.effect === 'CHALLENGES' || t.effect === 'DOES_NOT_ACTIVATE')) {
    return 'INACTIVE';
  }
  return 'UNKNOWN';
}

export function resolveCurrentPressure(
  transitTrigger?: TransitTrigger,
  conflicts?: readonly DomainConflict[]
): 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN' {
  if (!transitTrigger || !transitTrigger.active) {
    const hasTimingConflict = conflicts?.some(
      (c) => c.tier === 'PRIMARY_VS_TIMING' || c.tier === 'TIMING_CONFLICT'
    );
    return hasTimingConflict ? 'MODERATE' : 'LOW';
  }

  if (transitTrigger.effect === 'UNKNOWN') {
    return 'UNKNOWN';
  }

  if (transitTrigger.effect === 'CHALLENGE') {
    const hasConflict = conflicts?.some(
      (c) => c.tier === 'PRIMARY_VS_TRANSIT' || c.tier === 'TIMING_CONFLICT'
    );
    return hasConflict ? 'HIGH' : 'MODERATE';
  }

  if (transitTrigger.effect === 'MODIFIER') {
    return 'MODERATE';
  }

  return 'LOW';
}

export function buildCareerHeadline(
  natalStatus: DomainStrength,
  currentActivation: 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'INACTIVE' | 'UNKNOWN',
  currentPressure: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN',
  d10Relationship: VargaRelationship
): string {
  const statusStr = natalStatus === 'VERY_STRONG'
    ? 'Exceptionally strong'
    : natalStatus === 'STRONG'
    ? 'Strong'
    : natalStatus === 'MODERATE'
    ? 'Moderate'
    : natalStatus === 'MIXED'
    ? 'Mixed'
    : natalStatus === 'WEAK' || natalStatus === 'VERY_WEAK'
    ? 'Challenged'
    : 'Developing';

  const activationStr = currentActivation === 'ACTIVE'
    ? 'active timing support'
    : currentActivation === 'PARTIALLY_ACTIVE'
    ? 'partial timing activation'
    : currentActivation === 'INACTIVE'
    ? 'inactive timing'
    : 'unconfirmed timing';

  const d10Str = d10Relationship === 'CONFIRMS'
    ? 'confirmed by D10 execution'
    : d10Relationship === 'PARTIALLY_CONFIRMS'
    ? 'partially confirmed by D10 execution'
    : d10Relationship === 'CONFLICTS'
    ? 'with D10 divisional friction'
    : d10Relationship === 'MODIFIES'
    ? 'with D10 role specialization'
    : 'with neutral divisional alignment';

  return `${statusStr} natal career promise with ${activationStr}, ${d10Str} and ${currentPressure.toLowerCase()} transit pressure.`;
}

export function buildCareerConclusionData(
  natalStrength: DomainStrength,
  d10Relationship: VargaRelationship,
  timingActivations: readonly CareerTimingActivation[],
  transitTrigger: TransitTrigger,
  conflicts: readonly DomainConflict[],
  manifestations: readonly DomainManifestation[],
  supportingEvidenceIds: readonly string[],
  challengingEvidenceIds: readonly string[]
): CareerConclusionData {
  const currentActivation = resolveCurrentActivation(timingActivations);
  const currentPressure = resolveCurrentPressure(transitTrigger, conflicts);

  const highManifestations = manifestations
    .filter((m) => m.confidence === 'VERY_HIGH' || m.confidence === 'HIGH')
    .map((m) => m.mode);

  const dominantManifestations = highManifestations.length > 0
    ? highManifestations
    : manifestations.length > 0
    ? [manifestations[0].mode]
    : [];

  const headline = buildCareerHeadline(
    natalStrength,
    currentActivation,
    currentPressure,
    d10Relationship
  );

  return Object.freeze({
    natalStatus: natalStrength,
    currentActivation,
    currentPressure,
    d10Relationship,
    dominantManifestations: Object.freeze(dominantManifestations),
    headline,
    supportingEvidenceIds: Object.freeze([...supportingEvidenceIds]),
    challengingEvidenceIds: Object.freeze([...challengingEvidenceIds])
  });
}

export function buildCareerConclusion(
  natalPromise: NatalPromise,
  dashaActivation: DashaActivation,
  transitTrigger: TransitTrigger,
  vargaConfirmations: readonly VargaConfirmation[],
  legacySummary?: string,
  d10Relationship?: VargaRelationship,
  extra?: {
    timingActivations?: readonly CareerTimingActivation[];
    conflicts?: readonly DomainConflict[];
    manifestations?: readonly DomainManifestation[];
    conclusionData?: CareerConclusionData;
  }
): string {
  const parts: string[] = [];

  // V2 synthesis is primary
  if (extra?.conclusionData?.headline) {
    parts.push(extra.conclusionData.headline);
  } else if (natalPromise.statement) {
    parts.push(natalPromise.statement);
  }

  if (dashaActivation.active && dashaActivation.statement) {
    parts.push(dashaActivation.statement);
  }

  const d10 = vargaConfirmations.find((v) => v.varga === 'D10');
  if (d10 && (d10.relationship === 'CONFIRMS' || d10.relationship === 'PARTIALLY_CONFIRMS' || d10.relationship === 'CONFLICTS' || d10.relationship === 'MODIFIES')) {
    parts.push(d10.statement);
  }

  if (transitTrigger.active && (transitTrigger.effect === 'CHALLENGE' || transitTrigger.effect === 'TRIGGER' || transitTrigger.effect === 'MODIFIER')) {
    parts.push(transitTrigger.statement);
  }

  if (parts.length === 0 && legacySummary) {
    return legacySummary;
  }

  return parts.join(' ') || legacySummary || 'Career domain interpretation complete.';
}
