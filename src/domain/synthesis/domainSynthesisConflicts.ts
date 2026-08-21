import type {
  DomainInterpretation,
  DomainId
} from '../interpretation';
import type {
  CrossDomainConflict,
  CrossDomainConflictType,
  CrossDomainSeverity
} from './domainSynthesisTypes';
import {
  extractDomainTimingRecords,
  type TimingIdentity,
  type DomainTimingRecord
} from './domainSynthesisTiming';

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

  const allRecords = domains.flatMap(extractDomainTimingRecords);
  const groups = new Map<string, { identity: TimingIdentity; records: DomainTimingRecord[] }>();

  for (const rec of allRecords) {
    let g = groups.get(rec.identityKey);
    if (!g) {
      g = { identity: rec.identity, records: [] };
      groups.set(rec.identityKey, g);
    }
    g.records.push(rec);
  }

  for (const { identity, records } of groups.values()) {
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const r1 = records[i];
        const r2 = records[j];
        if (r1.domain === r2.domain) continue;

        const participatingDomains: readonly DomainId[] = Object.freeze(
          [r1.domain, r2.domain].sort()
        );

        if (identity.source === 'DASHA') {
          const r1Activates = r1.effect === 'ACTIVATES' || r1.effect === 'PARTIALLY_ACTIVATES';
          const r1Challenges = r1.effect === 'CHALLENGES' || r1.effect === 'CHALLENGE';
          const r2Activates = r2.effect === 'ACTIVATES' || r2.effect === 'PARTIALLY_ACTIVATES';
          const r2Challenges = r2.effect === 'CHALLENGES' || r2.effect === 'CHALLENGE';

          if ((r1Activates && r2Challenges) || (r1Challenges && r2Activates)) {
            const activatingDomain = r1Activates ? r1.domain : r2.domain;
            const challengingDomain = r1Challenges ? r1.domain : r2.domain;
            const evidenceIds = Object.freeze(
              Array.from(new Set([...r1.evidenceIds, ...r2.evidenceIds])).sort()
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
        } else if (identity.source === 'TRANSIT') {
          const r1Triggers = r1.effect === 'TRIGGER';
          const r1Challenges = r1.effect === 'CHALLENGE' || r1.effect === 'CHALLENGES';
          const r2Triggers = r2.effect === 'TRIGGER';
          const r2Challenges = r2.effect === 'CHALLENGE' || r2.effect === 'CHALLENGES';

          if ((r1Triggers && r2Challenges) || (r1Challenges && r2Triggers)) {
            const triggeringDomain = r1Triggers ? r1.domain : r2.domain;
            const challengingDomain = r1Challenges ? r1.domain : r2.domain;
            const evidenceIds = Object.freeze(
              Array.from(new Set([...r1.evidenceIds, ...r2.evidenceIds])).sort()
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
    }
  }

  return Object.freeze(conflicts);
}
