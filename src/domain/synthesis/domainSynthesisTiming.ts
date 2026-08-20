import type {
  DomainInterpretation,
  DomainId
} from '../interpretation';
import type {
  SharedTimingActivation
} from './domainSynthesisTypes';

const QUALIFYING_DASHA_EFFECTS = new Set([
  'ACTIVATES',
  'PARTIALLY_ACTIVATES',
  'CHALLENGES',
  'CHALLENGE'
]);

const QUALIFYING_TRANSIT_EFFECTS = new Set([
  'TRIGGER',
  'MODIFIER',
  'CHALLENGE',
  'CHALLENGES'
]);

function buildDashaStatement(
  effects: Record<string, string>,
  participatingDomains: readonly DomainId[]
): string {
  const domains = [...participatingDomains];
  const activating = domains.filter(
    (d) =>
      effects[d] === 'ACTIVATES' || effects[d] === 'PARTIALLY_ACTIVATES'
  );
  const challenging = domains.filter(
    (d) => effects[d] === 'CHALLENGES' || effects[d] === 'CHALLENGE'
  );

  if (activating.length === domains.length) {
    return `Active Dasha period simultaneously activates ${domains.join(' and ')}.`;
  }
  if (challenging.length === domains.length) {
    return `Active Dasha period concurrently challenges ${domains.join(' and ')}.`;
  }
  if (activating.length > 0 && challenging.length > 0) {
    return `Active Dasha period activates ${activating.join(' and ')} while challenging ${challenging.join(' and ')}.`;
  }
  return `Active Dasha timing operates across ${domains.join(' and ')}.`;
}

function buildTransitStatement(
  effects: Record<string, string>,
  participatingDomains: readonly DomainId[]
): string {
  const domains = [...participatingDomains];
  const triggering = domains.filter((d) => effects[d] === 'TRIGGER');
  const challenging = domains.filter(
    (d) => effects[d] === 'CHALLENGE' || effects[d] === 'CHALLENGES'
  );

  if (triggering.length === domains.length) {
    return `Transit planetary alignments provide synchronized triggers across ${domains.join(' and ')}.`;
  }
  if (challenging.length === domains.length) {
    return `Transit planetary movements create concurrent pressure on ${domains.join(' and ')}.`;
  }
  if (triggering.length > 0 && challenging.length > 0) {
    return `Transit movements trigger ${triggering.join(' and ')} while challenging ${challenging.join(' and ')}.`;
  }
  return `Transit triggers operate across ${domains.join(' and ')}.`;
}

export function deriveSharedTiming(
  domains: readonly DomainInterpretation[]
): readonly SharedTimingActivation[] {
  const sharedTimings: SharedTimingActivation[] = [];

  // 1. Shared Dasha Timing
  const qualifyingDashaDomains = domains.filter(
    (d) =>
      d.dashaActivation?.active &&
      d.dashaActivation.effect &&
      QUALIFYING_DASHA_EFFECTS.has(d.dashaActivation.effect)
  );

  if (qualifyingDashaDomains.length >= 2) {
    const participatingDomains: DomainId[] = qualifyingDashaDomains.map(
      (d) => d.domain
    );
    const effects: Record<string, string> = {};
    const evidenceIdSet = new Set<string>();

    for (const d of qualifyingDashaDomains) {
      if (d.dashaActivation.effect) {
        effects[d.domain] = d.dashaActivation.effect;
      }
      for (const eId of d.dashaActivation.evidenceIds ?? []) {
        evidenceIdSet.add(eId);
      }
    }

    const statement = buildDashaStatement(effects, participatingDomains);

    // Derivable level and periodKey
    let level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | undefined = undefined;
    let periodKey: string | undefined = undefined;

    for (const d of qualifyingDashaDomains) {
      if (d.timingActivations) {
        for (const t of d.timingActivations) {
          if (t.level && !level) {
            level = t.level;
          }
          if (t.periodKey && !periodKey) {
            periodKey = t.periodKey;
          }
        }
      }
    }

    sharedTimings.push(
      Object.freeze({
        source: 'DASHA',
        timingType: 'DASHA',
        active: true,
        participatingDomains: Object.freeze(participatingDomains),
        effects: Object.freeze(effects),
        statement,
        evidenceIds: Object.freeze(Array.from(evidenceIdSet).sort()),
        ...(level ? { level } : {}),
        ...(periodKey ? { periodKey } : {})
      })
    );
  }

  // 2. Shared Transit Timing
  const qualifyingTransitDomains = domains.filter(
    (d) =>
      d.transitTrigger?.active &&
      d.transitTrigger.effect &&
      QUALIFYING_TRANSIT_EFFECTS.has(d.transitTrigger.effect)
  );

  if (qualifyingTransitDomains.length >= 2) {
    const participatingDomains: DomainId[] = qualifyingTransitDomains.map(
      (d) => d.domain
    );
    const effects: Record<string, string> = {};
    const evidenceIdSet = new Set<string>();

    for (const d of qualifyingTransitDomains) {
      if (d.transitTrigger.effect) {
        effects[d.domain] = d.transitTrigger.effect;
      }
      for (const eId of d.transitTrigger.evidenceIds ?? []) {
        evidenceIdSet.add(eId);
      }
    }

    const statement = buildTransitStatement(effects, participatingDomains);

    sharedTimings.push(
      Object.freeze({
        source: 'TRANSIT',
        timingType: 'TRANSIT',
        active: true,
        participatingDomains: Object.freeze(participatingDomains),
        effects: Object.freeze(effects),
        statement,
        evidenceIds: Object.freeze(Array.from(evidenceIdSet).sort())
      })
    );
  }

  return Object.freeze(sharedTimings);
}
