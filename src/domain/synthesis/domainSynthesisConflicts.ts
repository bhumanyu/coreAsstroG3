import type {
  DomainInterpretation,
  DomainId
} from '../interpretation';
import type {
  CrossDomainConflict,
  CrossDomainConflictType,
  CrossDomainSeverity
} from './domainSynthesisTypes';

export function createConflictId(
  type: CrossDomainConflictType,
  domains: readonly DomainId[]
): string {
  const sorted = [...domains].sort();
  return `CONFLICT:${type}:${sorted.join(':')}`;
}

export function detectCrossDomainConflicts(
  domains: readonly DomainInterpretation[]
): readonly CrossDomainConflict[] {
  const conflicts: CrossDomainConflict[] = [];

  // Pairwise evaluation
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const d1 = domains[i];
      const d2 = domains[j];

      // 1. DOMAIN_VS_TIMING: Dasha conflict (one activates, one challenges)
      const d1DashaEffect = d1.dashaActivation?.effect as string | undefined;
      const d2DashaEffect = d2.dashaActivation?.effect as string | undefined;

      const d1DashaActivates =
        d1.dashaActivation?.active &&
        (d1DashaEffect === 'ACTIVATES' || d1DashaEffect === 'PARTIALLY_ACTIVATES');
      const d1DashaChallenges =
        d1.dashaActivation?.active &&
        (d1DashaEffect === 'CHALLENGES' || d1DashaEffect === 'CHALLENGE');

      const d2DashaActivates =
        d2.dashaActivation?.active &&
        (d2DashaEffect === 'ACTIVATES' || d2DashaEffect === 'PARTIALLY_ACTIVATES');
      const d2DashaChallenges =
        d2.dashaActivation?.active &&
        (d2DashaEffect === 'CHALLENGES' || d2DashaEffect === 'CHALLENGE');

      if (
        (d1DashaActivates && d2DashaChallenges) ||
        (d1DashaChallenges && d2DashaActivates)
      ) {
        const activatingDomain = d1DashaActivates ? d1.domain : d2.domain;
        const challengingDomain = d1DashaChallenges ? d1.domain : d2.domain;
        const participatingDomains: readonly DomainId[] = Object.freeze(
          [d1.domain, d2.domain].sort()
        );
        const evidenceIds = Object.freeze(
          Array.from(
            new Set([
              ...(d1.dashaActivation?.evidenceIds ?? []),
              ...(d2.dashaActivation?.evidenceIds ?? [])
            ])
          ).sort()
        );

        const id = createConflictId('DOMAIN_VS_TIMING', participatingDomains);
        const severity: CrossDomainSeverity = 'HIGH';
        const description = `Dasha timing activates ${activatingDomain} while challenging ${challengingDomain}.`;

        conflicts.push(
          Object.freeze({
            id,
            type: 'DOMAIN_VS_TIMING',
            severity,
            participatingDomains,
            description,
            evidenceIds
          })
        );
      }

      // 2. DOMAIN_VS_TRANSIT: Transit conflict (one triggers, one challenges)
      const d1TransitEffect = d1.transitTrigger?.effect as string | undefined;
      const d2TransitEffect = d2.transitTrigger?.effect as string | undefined;

      const d1TransitTriggers =
        d1.transitTrigger?.active && d1TransitEffect === 'TRIGGER';
      const d1TransitChallenges =
        d1.transitTrigger?.active &&
        (d1TransitEffect === 'CHALLENGE' || d1TransitEffect === 'CHALLENGES');

      const d2TransitTriggers =
        d2.transitTrigger?.active && d2TransitEffect === 'TRIGGER';
      const d2TransitChallenges =
        d2.transitTrigger?.active &&
        (d2TransitEffect === 'CHALLENGE' || d2TransitEffect === 'CHALLENGES');

      if (
        (d1TransitTriggers && d2TransitChallenges) ||
        (d1TransitChallenges && d2TransitTriggers)
      ) {
        const triggeringDomain = d1TransitTriggers ? d1.domain : d2.domain;
        const challengingDomain = d1TransitChallenges ? d1.domain : d2.domain;
        const participatingDomains: readonly DomainId[] = Object.freeze(
          [d1.domain, d2.domain].sort()
        );
        const evidenceIds = Object.freeze(
          Array.from(
            new Set([
              ...(d1.transitTrigger?.evidenceIds ?? []),
              ...(d2.transitTrigger?.evidenceIds ?? [])
            ])
          ).sort()
        );

        const id = createConflictId('DOMAIN_VS_TRANSIT', participatingDomains);
        const severity: CrossDomainSeverity = 'MODERATE';
        const description = `Transit movements trigger ${triggeringDomain} while challenging ${challengingDomain}.`;

        conflicts.push(
          Object.freeze({
            id,
            type: 'DOMAIN_VS_TRANSIT',
            severity,
            participatingDomains,
            description,
            evidenceIds
          })
        );
      }
    }
  }

  return Object.freeze(conflicts);
}
