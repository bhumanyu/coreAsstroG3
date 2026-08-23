import type {
  ManifestationMode
} from './DomainInterpretationTypes';
import type { DomainEvidence } from './DomainEvidence';
import type { Planet } from '../../types';

export type ManifestationStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'POSSIBLE'
  | 'CHALLENGED'
  | 'MIXED'
  | 'INSUFFICIENT_DATA';

export interface DomainManifestation {
  readonly mode: ManifestationMode;
  readonly confidence:
    | 'VERY_HIGH'
    | 'HIGH'
    | 'MODERATE'
    | 'LOW'
    | 'VERY_LOW';
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly status?: ManifestationStatus;
}

export function createDomainManifestation(
  manifestation: DomainManifestation
): DomainManifestation {
  return Object.freeze({
    ...manifestation,
    evidenceIds: Object.freeze([
      ...manifestation.evidenceIds
    ])
  });
}

/**
 * Computes a stable independence key for a DomainEvidence item.
 * Derived from sourceType, base ruleId (split on ':'), source, phase, planet, and house.
 * Two evidence items sharing the same independence key describe the same underlying factor.
 */
export function getEvidenceIndependenceKey(e: DomainEvidence): string {
  const sourceType = e.sourceType ?? '';
  const baseRuleId = e.ruleId ? e.ruleId.split(':')[0] : '';
  const source = e.source ?? '';
  const phase = e.phase ?? '';

  // Extract planet
  let planet: string = e.planet ?? e.timing?.planet ?? '';
  if (!planet && e.evidenceFamily) {
    const fam = String(e.evidenceFamily).toUpperCase();
    if (['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'].includes(fam)) {
      planet = fam;
    }
  }
  if (!planet) {
    const idAndRule = `${e.id} ${e.ruleId ?? ''}`.toUpperCase();
    const planetMatch = idAndRule.match(/\b(SUN|MOON|MARS|MERCURY|JUPITER|VENUS|SATURN|RAHU|KETU)\b/);
    if (planetMatch) {
      planet = planetMatch[1];
    }
  }

  // Extract house
  let house: string = e.house !== undefined ? String(e.house) : '';
  if (!house && e.evidenceFamily) {
    const fam = String(e.evidenceFamily).toUpperCase();
    const houseFamMatch = fam.match(/(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH)_HOUSE/);
    if (houseFamMatch) {
      const houseMap: Record<string, string> = {
        FIRST: '1', SECOND: '2', THIRD: '3', FOURTH: '4', FIFTH: '5', SIXTH: '6',
        SEVENTH: '7', EIGHTH: '8', NINTH: '9', TENTH: '10', ELEVENTH: '11', TWELFTH: '12'
      };
      house = houseMap[houseFamMatch[1]] ?? '';
    }
  }
  if (!house) {
    const idAndRule = `${e.id} ${e.ruleId ?? ''}`.toUpperCase();
    const houseMatch = idAndRule.match(/(?:HOUSE_?|H)(\d{1,2})\b/);
    if (houseMatch) {
      house = houseMatch[1];
    }
  }

  return `${sourceType}|${baseRuleId}|${source}|${phase}|${planet}|${house}`;
}

export function groupEvidenceByIndependence(
  evidence: readonly DomainEvidence[]
): ReadonlyMap<string, readonly DomainEvidence[]> {
  const groups = new Map<string, DomainEvidence[]>();
  for (const item of evidence) {
    const key = getEvidenceIndependenceKey(item);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

/**
 * Deterministically resolves the manifestation status based on independence-aware evidence quality.
 * Enforces Spec §12 (lines ~1013-1019):
 * SUPPORTED requires at least:
 *   1 primary/strong factor
 *   +
 *   1 independent supporting factor (>= 2 independent factor groups total)
 * Otherwise returns PARTIALLY_SUPPORTED if supporting evidence exists, or INSUFFICIENT_DATA if empty.
 */
export function resolveManifestationStatus(
  supporting: readonly DomainEvidence[],
  challenging?: readonly DomainEvidence[]
): 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_DATA' {
  const supportingItems = supporting.filter((e) => e.polarity === 'SUPPORTING');

  if (supportingItems.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const independentGroups = Array.from(
    groupEvidenceByIndependence(supportingItems).values()
  );

  const numIndependentFactors = independentGroups.length;

  const hasPrimaryOrStrong = independentGroups.some((group) =>
    group.some(
      (e) =>
        e.role === 'PRIMARY' ||
        e.strength === 'STRONG' ||
        e.strength === 'VERY_STRONG'
    )
  );

  if (hasPrimaryOrStrong && numIndependentFactors >= 2) {
    return 'SUPPORTED';
  }

  return 'PARTIALLY_SUPPORTED';
}
