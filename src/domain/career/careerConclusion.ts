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
  DomainManifestation
} from '../interpretation';
import type { CareerTimingActivation } from './careerTypes';

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
  dashaEvidence: readonly DomainEvidence[]
): string {
  if (dashaEvidence.length === 0) {
    return 'No active career Dasha activation identified.';
  }
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return `Current Dasha period actively supports career manifestations.`;
  }
  return `Current Dasha period indicates mixed or challenging timing for career initiatives.`;
}

export function buildCareerTransitStatement(
  transitEvidence: readonly DomainEvidence[]
): string {
  if (transitEvidence.length === 0) {
    return 'No material transit trigger identified.';
  }
  const hasChallenge = transitEvidence.some((e) => e.polarity === 'CHALLENGING');
  if (hasChallenge) {
    return 'Current transit pressure may increase professional demands or restructuring.';
  }
  return `Transit triggers are currently influencing career timing.`;
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
  }
): string {
  const parts: string[] = [];

  if (legacySummary) {
    parts.push(legacySummary);
  } else {
    parts.push(natalPromise.statement);
  }

  if (dashaActivation.active) {
    parts.push(dashaActivation.statement);
  }

  const d10 = vargaConfirmations.find((v) => v.varga === 'D10');
  if (d10 && (d10.relationship === 'CONFIRMS' || d10.relationship === 'CONFLICTS' || d10.relationship === 'MODIFIES')) {
    parts.push(d10.statement);
  }

  if (transitTrigger.active && transitTrigger.effect === 'CHALLENGE') {
    parts.push(transitTrigger.statement);
  }

  return parts.join(' ');
}
