import type { DomainConflict } from './DomainConflict';
import type { DomainEvidence } from './DomainEvidence';
import type { ConflictTier } from './DomainInterpretationTypes';

export function sortDomainEvidence(
  evidence: readonly DomainEvidence[]
): readonly DomainEvidence[] {
  return Object.freeze([
    ...evidence
  ].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return strengthRank(right.strength) - strengthRank(left.strength);
  }));
}

export function detectDomainConflicts(
  domain: DomainEvidence['domain'],
  evidence: readonly DomainEvidence[]
): readonly DomainConflict[] {
  const domainEvidence = evidence.filter((item) => item.domain === domain);
  const supporting = domainEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const challenging = domainEvidence.filter((item) => item.polarity === 'CHALLENGING');

  if (supporting.length === 0 || challenging.length === 0) {
    return Object.freeze([]);
  }

  const conflicts: DomainConflict[] = [];
  let conflictIndex = 1;

  // 1. Primary vs Primary
  const primarySupporting = supporting.filter(
    (e) => e.role === 'PRIMARY' || (e.phase === 'NATAL_PROMISE' && e.priority >= 90)
  );
  const primaryChallenging = challenging.filter(
    (e) => e.role === 'PRIMARY' || (e.phase === 'NATAL_PROMISE' && e.priority >= 90)
  );

  if (primarySupporting.length > 0 && primaryChallenging.length > 0) {
    const strongestChallenging = [...primaryChallenging].sort(compareEvidence)[0];
    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'PRIMARY_VS_PRIMARY' as ConflictTier,
        description: 'Primary structural factors present contradictory indications.',
        positiveEvidenceIds: Object.freeze(primarySupporting.map((e) => e.id)),
        negativeEvidenceIds: Object.freeze(primaryChallenging.map((e) => e.id)),
        primaryPhase: 'NATAL_PROMISE',
        severity: strongestChallenging.strength,
        resolution:
          'Synthesize primary house and lordship strengths through functional roles and natural significations.'
      })
    );
  }

  // 2. Primary vs Varga Confirmation
  const vargaChallenging = challenging.filter(
    (e) => e.role === 'CONFIRMATION' || e.phase === 'VARGA_CONFIRMATION' || e.source === 'D10' || e.source === 'D2'
  );
  if (primarySupporting.length > 0 && vargaChallenging.length > 0) {
    const strongestChallenging = [...vargaChallenging].sort(compareEvidence)[0];
    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'PRIMARY_VS_VARGA' as ConflictTier,
        description: 'Divisional confirmation diverges from the natal promise indication.',
        positiveEvidenceIds: Object.freeze(primarySupporting.map((e) => e.id)),
        negativeEvidenceIds: Object.freeze(vargaChallenging.map((e) => e.id)),
        primaryPhase: 'VARGA_CONFIRMATION',
        severity: strongestChallenging.strength,
        resolution:
          'Divisional chart indicates challenges in concrete execution and tangible manifestation of the natal promise.'
      })
    );
  }

  // 3. Primary vs Modifier
  const modifierChallenging = challenging.filter(
    (e) => e.role === 'MODIFIER' || e.phase === 'MODIFIER'
  );
  if (primarySupporting.length > 0 && modifierChallenging.length > 0) {
    const strongestChallenging = [...modifierChallenging].sort(compareEvidence)[0];
    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'PRIMARY_VS_MODIFIER' as ConflictTier,
        description: 'Primary structural promise is qualified or modified by functional/aspectual factors.',
        positiveEvidenceIds: Object.freeze(primarySupporting.map((e) => e.id)),
        negativeEvidenceIds: Object.freeze(modifierChallenging.map((e) => e.id)),
        primaryPhase: 'MODIFIER',
        severity: strongestChallenging.strength,
        resolution:
          'Natal structural foundation provides the base capacity while planetary state and aspects modulate expression.'
      })
    );
  }

  // 4. Primary vs Timing / Transit
  const dashaChallenging = challenging.filter(
    (e) => (e.role === 'TIMING' || e.phase === 'DASHA_ACTIVATION') && e.source !== 'TRANSIT'
  );
  if (primarySupporting.length > 0 && dashaChallenging.length > 0) {
    const strongestChallenging = [...dashaChallenging].sort(compareEvidence)[0];
    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'PRIMARY_VS_TIMING' as ConflictTier,
        description: 'Natal promise is currently experiencing challenging Dasha timing activation.',
        positiveEvidenceIds: Object.freeze(primarySupporting.map((e) => e.id)),
        negativeEvidenceIds: Object.freeze(dashaChallenging.map((e) => e.id)),
        primaryPhase: 'DASHA_ACTIVATION',
        severity: strongestChallenging.strength,
        resolution:
          'Primary natal promise sets the foundational capacity; transient timing factors indicate timing delays rather than promise cancellation.'
      })
    );
  }

  const transitChallenging = challenging.filter(
    (e) => e.phase === 'TRANSIT_TRIGGER' || e.source === 'TRANSIT'
  );
  if (primarySupporting.length > 0 && transitChallenging.length > 0) {
    const strongestChallenging = [...transitChallenging].sort(compareEvidence)[0];
    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'PRIMARY_VS_TRANSIT' as ConflictTier,
        description: 'Natal promise is currently encountering adverse transit triggers.',
        positiveEvidenceIds: Object.freeze(primarySupporting.map((e) => e.id)),
        negativeEvidenceIds: Object.freeze(transitChallenging.map((e) => e.id)),
        primaryPhase: 'TRANSIT_TRIGGER',
        severity: strongestChallenging.strength,
        resolution:
          'Short-term planetary transits introduce temporary resistance without negating long-term structural promise.'
      })
    );
  }

  // If no tier-specific conflict was created, create a general secondary conflict
  if (conflicts.length === 0) {
    const strongestSupporting = [...supporting].sort(compareEvidence)[0];
    const strongestChallenging = [...challenging].sort(compareEvidence)[0];

    conflicts.push(
      Object.freeze({
        id: `${domain}-CONFLICT-${conflictIndex++}`,
        domain,
        tier: 'SECONDARY_CONFLICT' as ConflictTier,
        description: 'Supporting and challenging factors require synthesis.',
        positiveEvidenceIds: Object.freeze([strongestSupporting.id]),
        negativeEvidenceIds: Object.freeze([strongestChallenging.id]),
        primaryPhase: strongestChallenging.phase,
        severity: strongestChallenging.strength,
        resolution:
          'Resolve factors through evidence priority, activation state, and divisional confirmation.'
      })
    );
  }

  return Object.freeze(conflicts);
}

export function compareEvidence(
  left: DomainEvidence,
  right: DomainEvidence
): number {
  if (right.priority !== left.priority) {
    return right.priority - left.priority;
  }
  return strengthRank(right.strength) - strengthRank(left.strength);
}

export function strengthRank(
  strength: DomainEvidence['strength']
): number {
  switch (strength) {
    case 'VERY_STRONG':
      return 4;
    case 'STRONG':
      return 3;
    case 'MODERATE':
      return 2;
    case 'WEAK':
      return 1;
  }
}

