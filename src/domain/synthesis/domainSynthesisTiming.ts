import type {
  DomainInterpretation,
  DomainId
} from '../interpretation';
import type {
  SharedTimingActivation
} from './domainSynthesisTypes';

export type TimingSource = 'DASHA' | 'TRANSIT';
export type TimingLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';

export interface TimingIdentity {
  readonly source: TimingSource;
  readonly level?: TimingLevel | string;
  readonly periodKey?: string;
}

export interface DomainTimingRecord {
  readonly domain: DomainId;
  readonly identity: TimingIdentity;
  readonly identityKey: string;
  readonly effect: string;
  readonly active: boolean;
  readonly evidenceIds: readonly string[];
}

export const QUALIFYING_DASHA_EFFECTS: ReadonlySet<string> = new Set([
  'ACTIVATES',
  'PARTIALLY_ACTIVATES',
  'CHALLENGES',
  'CHALLENGE'
]);

export const QUALIFYING_TRANSIT_EFFECTS: ReadonlySet<string> = new Set([
  'TRIGGER',
  'MODIFIER',
  'CHALLENGE',
  'CHALLENGES'
]);

export function createTimingIdentityKey(identity: TimingIdentity): string {
  return `${identity.source}:${identity.level ?? '*'}:${identity.periodKey ?? '*'}`;
}

export function normalizeTimingLevel(val: any): TimingLevel | undefined {
  if (!val) return undefined;
  const str = String(val).toUpperCase();
  if (str === 'MD' || str === 'MAHADASHA') return 'MAHADASHA';
  if (str === 'AD' || str === 'ANTARDASHA') return 'ANTARDASHA';
  if (str === 'PD' || str === 'PRATYANTARDASHA') return 'PRATYANTARDASHA';
  return undefined;
}

export function extractDomainTimingRecords(
  domain: DomainInterpretation
): readonly DomainTimingRecord[] {
  const records: DomainTimingRecord[] = [];
  let hasDashaTimingActivation = false;
  let hasTransitTimingActivation = false;

  if (Array.isArray(domain.timingActivations) && domain.timingActivations.length > 0) {
    for (const t of domain.timingActivations) {
      if (!t) continue;
      const isTransit = t.source === 'TRANSIT' || Boolean(t.transit);
      const source: TimingSource = isTransit ? 'TRANSIT' : 'DASHA';
      const level = t.level ? normalizeTimingLevel(t.level) ?? t.level : normalizeTimingLevel(t.period);
      const periodKey = t.periodKey ? String(t.periodKey) : undefined;
      const effect = t.effect ?? (source === 'DASHA' ? domain.dashaActivation?.effect : domain.transitTrigger?.effect);
      const active = t.active ?? (source === 'DASHA' ? domain.dashaActivation?.active ?? true : domain.transitTrigger?.active ?? true);
      const evidenceIds = t.evidenceIds ?? (source === 'DASHA' ? domain.dashaActivation?.evidenceIds ?? [] : domain.transitTrigger?.evidenceIds ?? []);

      if (source === 'DASHA') {
        hasDashaTimingActivation = true;
      } else {
        hasTransitTimingActivation = true;
      }

      if (effect && effect !== 'UNKNOWN' && effect !== 'INSUFFICIENT_DATA' && effect !== 'DOES_NOT_ACTIVATE' && effect !== 'NO_MATERIAL_TRIGGER') {
        const identity: TimingIdentity = { source, level, periodKey };
        records.push({
          domain: domain.domain,
          identity,
          identityKey: createTimingIdentityKey(identity),
          effect: String(effect),
          active: Boolean(active),
          evidenceIds
        });
      }
    }
  }

  if (!hasDashaTimingActivation && domain.dashaActivation) {
    const da = domain.dashaActivation;
    const effect = da.effect;
    const active = da.active;
    const level = (da as any).level ? normalizeTimingLevel((da as any).level) ?? (da as any).level : normalizeTimingLevel((da as any).period);
    const periodKey = (da as any).periodKey ? String((da as any).periodKey) : undefined;
    const evidenceIds = da.evidenceIds ?? [];

    if (active && effect && effect !== 'UNKNOWN' && effect !== 'INSUFFICIENT_DATA' && effect !== 'DOES_NOT_ACTIVATE') {
      const identity: TimingIdentity = { source: 'DASHA', level, periodKey };
      records.push({
        domain: domain.domain,
        identity,
        identityKey: createTimingIdentityKey(identity),
        effect: String(effect),
        active: Boolean(active),
        evidenceIds
      });
    }
  }

  if (!hasTransitTimingActivation && domain.transitTrigger) {
    const tt = domain.transitTrigger;
    const effect = tt.effect;
    const active = tt.active;
    const level = (tt as any).level ? normalizeTimingLevel((tt as any).level) ?? (tt as any).level : undefined;
    const periodKey = (tt as any).periodKey ? String((tt as any).periodKey) : undefined;
    const evidenceIds = tt.evidenceIds ?? [];

    if (active && effect && effect !== 'UNKNOWN' && effect !== 'NO_MATERIAL_TRIGGER') {
      const identity: TimingIdentity = { source: 'TRANSIT', level, periodKey };
      records.push({
        domain: domain.domain,
        identity,
        identityKey: createTimingIdentityKey(identity),
        effect: String(effect),
        active: Boolean(active),
        evidenceIds
      });
    }
  }

  return records;
}

export function buildDashaStatement(
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

export function buildTransitStatement(
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

export function isTimingConflicted(
  source: TimingSource,
  effects: Record<string, string>
): boolean {
  const effectValues = Object.values(effects);
  if (source === 'DASHA') {
    const hasActivating = effectValues.some(
      (e) => e === 'ACTIVATES' || e === 'PARTIALLY_ACTIVATES'
    );
    const hasChallenging = effectValues.some(
      (e) => e === 'CHALLENGES' || e === 'CHALLENGE'
    );
    return hasActivating && hasChallenging;
  } else if (source === 'TRANSIT') {
    const hasTriggering = effectValues.some((e) => e === 'TRIGGER');
    const hasChallenging = effectValues.some(
      (e) => e === 'CHALLENGE' || e === 'CHALLENGES'
    );
    return hasTriggering && hasChallenging;
  }
  return false;
}

export function deriveSharedTiming(
  domains: readonly DomainInterpretation[]
): readonly SharedTimingActivation[] {
  const sharedTimings: SharedTimingActivation[] = [];

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
    const qualifyingSet = identity.source === 'DASHA' ? QUALIFYING_DASHA_EFFECTS : QUALIFYING_TRANSIT_EFFECTS;
    const domainMap = new Map<DomainId, DomainTimingRecord>();

    for (const rec of records) {
      if (rec.active && qualifyingSet.has(rec.effect)) {
        if (!domainMap.has(rec.domain)) {
          domainMap.set(rec.domain, rec);
        }
      }
    }

    if (domainMap.size >= 2) {
      const participatingDomains = Array.from(domainMap.keys());
      const effects: Record<string, string> = {};
      const evidenceIdSet = new Set<string>();

      for (const [dom, rec] of domainMap.entries()) {
        effects[dom] = rec.effect;
        for (const eId of rec.evidenceIds) {
          evidenceIdSet.add(eId);
        }
      }

      const statement = identity.source === 'DASHA'
        ? buildDashaStatement(effects, participatingDomains)
        : buildTransitStatement(effects, participatingDomains);

      const isConflict = isTimingConflicted(identity.source, effects);

      sharedTimings.push(
        Object.freeze({
          source: identity.source,
          timingType: identity.source,
          active: true,
          participatingDomains: Object.freeze([...participatingDomains]),
          effects: Object.freeze(effects),
          statement,
          evidenceIds: Object.freeze(Array.from(evidenceIdSet).sort()),
          isConflict,
          ...(identity.level ? { level: identity.level as any } : {}),
          ...(identity.periodKey ? { periodKey: identity.periodKey } : {})
        })
      );
    }
  }

  return Object.freeze(sharedTimings);
}
