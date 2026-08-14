import { Planet, DignityStatus, HouseAnalysis } from '../../types';
import { ThemeInterpretationContext } from './themeInterpretationContext';
import {
  ThemeInterpretationEvidence,
  CareerEvidenceFamily,
  ThemeRule,
  ThemeRuleResult,
  CareerTimingEvidence,
  ThemeEvidencePriority,
  ThemeEvidenceFactor,
  EvidenceFamilySummary,
  ThemeEvidenceEffect
} from './themeInterpretationTypes';

const PRIORITY_RANK: Record<ThemeEvidencePriority, number> = {
  PRIMARY: 0,
  SECONDARY: 1,
  CONFIRMATORY: 2,
  TIMING: 3
};

const FAMILY_RANK: Record<CareerEvidenceFamily, number> = {
  [CareerEvidenceFamily.TENTH_HOUSE]: 0,
  [CareerEvidenceFamily.TENTH_LORD]: 1,
  [CareerEvidenceFamily.SIXTH_HOUSE]: 2,
  [CareerEvidenceFamily.SIXTH_LORD]: 3,
  [CareerEvidenceFamily.SECOND_HOUSE]: 4,
  [CareerEvidenceFamily.SECOND_LORD]: 5,
  [CareerEvidenceFamily.ELEVENTH_HOUSE]: 6,
  [CareerEvidenceFamily.ELEVENTH_LORD]: 7,
  [CareerEvidenceFamily.SUN]: 8,
  [CareerEvidenceFamily.SATURN]: 9,
  [CareerEvidenceFamily.MERCURY]: 10,
  [CareerEvidenceFamily.MARS]: 11,
  [CareerEvidenceFamily.JUPITER]: 12,
  [CareerEvidenceFamily.FUNCTIONAL_ROLE]: 13,
  [CareerEvidenceFamily.PLANETARY_STRENGTH]: 14,
  [CareerEvidenceFamily.ASPECT]: 15,
  [CareerEvidenceFamily.YOGA]: 16,
  [CareerEvidenceFamily.D10]: 17,
  [CareerEvidenceFamily.DASHA]: 18
};

export function getHouseLord(context: ThemeInterpretationContext, houseNum: number): Planet | undefined {
  if (context.houseInterpretation?.houses?.[houseNum]?.placement?.signLord) {
    return context.houseInterpretation.houses[houseNum].placement.signLord;
  }
  if ((context.houseInterpretation?.houses?.[houseNum] as any)?.lord) {
    return (context.houseInterpretation!.houses[houseNum] as any).lord;
  }
  if (context.houseAnalysis?.houses) {
    const item = Array.isArray(context.houseAnalysis.houses)
      ? context.houseAnalysis.houses.find((h: HouseAnalysis) => h.house === houseNum)
      : (context.houseAnalysis.houses as Record<number, HouseAnalysis>)[houseNum];
    if (item?.lord) return item.lord;
  }
  return undefined;
}

export function getPlanetHouse(context: ThemeInterpretationContext, planet: Planet): number | undefined {
  if (context.planetInterpretation?.planets?.[planet]?.placement?.house !== undefined) {
    return context.planetInterpretation.planets[planet].placement.house;
  }
  if (context.planetInterpretation?.planets?.[planet]?.house !== undefined) {
    return context.planetInterpretation.planets[planet].house;
  }
  if (context.planetAnalysis?.planets?.[planet]?.house !== undefined) {
    return context.planetAnalysis.planets[planet].house;
  }
  if (context.horoscope?.planetFacts?.[planet]?.house !== undefined) {
    return context.horoscope.planetFacts[planet].house;
  }
  if (context.horoscope?.planetFacts?.[planet]?.position?.house !== undefined) {
    return context.horoscope.planetFacts[planet].position.house;
  }
  return undefined;
}

export function getHouseAnalysis(context: ThemeInterpretationContext, houseNum: number): HouseAnalysis | undefined {
  if (context.houseAnalysis?.houses) {
    if (Array.isArray(context.houseAnalysis.houses)) {
      return context.houseAnalysis.houses.find((h: HouseAnalysis) => h.house === houseNum);
    }
    return (context.houseAnalysis.houses as Record<number, HouseAnalysis>)[houseNum];
  }
  return undefined;
}

export function getPlanetAnalysis(context: ThemeInterpretationContext, planet: Planet): any {
  if (context.planetAnalysis?.planets) {
    return context.planetAnalysis.planets[planet];
  }
  return undefined;
}

export function getDignity(context: ThemeInterpretationContext, planet: Planet): DignityStatus | undefined {
  const pa = getPlanetAnalysis(context, planet);
  if (pa?.dignity) {
    if (typeof pa.dignity === 'string') return pa.dignity as DignityStatus;
    if (pa.dignity.status) return pa.dignity.status as DignityStatus;
  }
  const pi = context.planetInterpretation?.planets?.[planet] as any;
  if (pi?.dignity) {
    if (typeof pi.dignity === 'string') return pi.dignity as DignityStatus;
    if (pi.dignity.status) return pi.dignity.status as DignityStatus;
  }
  const pf = context.horoscope?.planetFacts?.[planet];
  if (pf?.dignity) {
    if (typeof pf.dignity === 'string') return pf.dignity as DignityStatus;
    if (pf.dignity.status) return pf.dignity.status as DignityStatus;
  }
  return undefined;
}

export function buildEvidenceId(ruleId: string, contextKey: string): string {
  return `${ruleId}:${contextKey}`;
}

export function groupEvidenceByFamily<TFamily extends string = string>(
  evidence: readonly ThemeInterpretationEvidence<TFamily>[]
): Readonly<Partial<Record<TFamily, readonly ThemeInterpretationEvidence<TFamily>[]>>> {
  const grouped: Partial<Record<TFamily, ThemeInterpretationEvidence<TFamily>[]>> = {};

  for (const item of evidence) {
    if (!grouped[item.evidenceFamily]) {
      grouped[item.evidenceFamily] = [];
    }
    grouped[item.evidenceFamily]!.push(item);
  }

  const readonlyGrouped: Partial<Record<TFamily, readonly ThemeInterpretationEvidence<TFamily>[]>> = {};
  for (const key of Object.keys(grouped) as TFamily[]) {
    readonlyGrouped[key] = Object.freeze(grouped[key]!);
  }

  return Object.freeze(readonlyGrouped);
}

export function buildFamilySummaries<TFamily extends string = string>(
  evidence: readonly ThemeInterpretationEvidence<TFamily>[]
): Readonly<Partial<Record<TFamily, EvidenceFamilySummary<TFamily>>>> {
  const grouped = groupEvidenceByFamily(evidence);
  const result: Partial<Record<TFamily, EvidenceFamilySummary<TFamily>>> = {};

  for (const familyKey of Object.keys(grouped) as TFamily[]) {
    const items = grouped[familyKey] || [];
    const supportingEvidence = items.filter((e) => e.effect === 'SUPPORT');
    const challengingEvidence = items.filter((e) => e.effect === 'CHALLENGE');
    const neutralEvidence = items.filter((e) => e.effect === 'NEUTRAL');

    let status: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' = 'NEUTRAL';
    if (supportingEvidence.length > 0 && challengingEvidence.length > 0) {
      status = 'MIXED';
    } else if (supportingEvidence.length > 0) {
      status = 'SUPPORT';
    } else if (challengingEvidence.length > 0) {
      status = 'CHALLENGE';
    } else {
      status = 'NEUTRAL';
    }

    result[familyKey] = Object.freeze({
      family: familyKey,
      supportingEvidence: Object.freeze(supportingEvidence),
      challengingEvidence: Object.freeze(challengingEvidence),
      neutralEvidence: Object.freeze(neutralEvidence),
      status
    });
  }

  return Object.freeze(result);
}

export function deduplicateEvidenceById<TFamily extends string = string>(
  evidence: readonly ThemeInterpretationEvidence<TFamily>[]
): readonly ThemeInterpretationEvidence<TFamily>[] {
  const seenIds = new Set<string>();
  const result: ThemeInterpretationEvidence<TFamily>[] = [];

  for (const item of evidence) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      result.push(item);
    }
  }

  return Object.freeze(result);
}

export const deduplicateCareerEvidence = deduplicateEvidenceById;

export function sortEvidenceDeterministically<TFamily extends string = string>(
  evidence: readonly ThemeInterpretationEvidence<TFamily>[],
  familyRank: Record<string, number> = FAMILY_RANK
): readonly ThemeInterpretationEvidence<TFamily>[] {
  return Object.freeze(
    [...evidence].sort((a, b) => {
      const pDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
      if (pDiff !== 0) return pDiff;

      const fDiff = (familyRank[a.evidenceFamily] ?? 99) - (familyRank[b.evidenceFamily] ?? 99);
      if (fDiff !== 0) return fDiff;

      return a.ruleId.localeCompare(b.ruleId);
    })
  );
}

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = (obj as any)[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });
  return obj;
}

export function evaluateRule<TFamily extends string = string, TContext = ThemeInterpretationContext, TOptions = unknown>(
  rule: ThemeRule<TFamily, TContext, TOptions>,
  context: TContext,
  options?: TOptions,
  errorCollector?: { ruleId: string; error: string }[]
): ThemeRuleResult<TFamily> {
  try {
    return rule.evaluate(context, options);
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    const env = typeof globalThis !== 'undefined' ? (globalThis as any).process?.env?.NODE_ENV : undefined;
    if (env === 'test' || env === 'development') {
      throw err;
    }
    console.error(`Rule ${rule.id} failed during evaluation:`, err);
    if (errorCollector) {
      errorCollector.push({ ruleId: rule.id, error: errorMessage });
    }
    return { triggered: false };
  }
}

export function isPresentEvidence<TFamily extends string = string>(result: ThemeRuleResult<TFamily>): boolean {
  if (!result.triggered || !result.evidence) return false;
  if (Array.isArray(result.evidence)) return result.evidence.length > 0;
  return true;
}

export function collectRelevantPlanets(
  evidence: readonly ThemeInterpretationEvidence[]
): readonly Planet[] {
  const set = new Set<Planet>();
  for (const e of evidence) {
    if (e.planets) {
      for (const p of e.planets) set.add(p);
    }
  }
  return Object.freeze(Array.from(set));
}

export function collectRelevantHouses(
  evidence: readonly ThemeInterpretationEvidence[]
): readonly number[] {
  const set = new Set<number>();
  for (const e of evidence) {
    if (e.houses) {
      for (const h of e.houses) set.add(h);
    }
  }
  return Object.freeze(Array.from(set).sort((a, b) => a - b));
}

export function collectRelevantYogas(
  evidence: readonly ThemeInterpretationEvidence[]
): readonly string[] {
  const result: string[] = [];
  for (const e of evidence) {
    if (e.evidenceFamily === CareerEvidenceFamily.YOGA) {
      result.push(e.statement);
    }
  }
  return Object.freeze(result);
}

export function collectRelevantVargas(
  evidence: readonly ThemeInterpretationEvidence[]
): readonly string[] {
  const result: string[] = [];
  for (const e of evidence) {
    if (e.vargaEvidence) {
      result.push(e.vargaEvidence.statement);
    }
  }
  return Object.freeze(result);
}

export function collectTimingEvidence(
  evidence: readonly ThemeInterpretationEvidence[]
): readonly CareerTimingEvidence[] {
  const result: CareerTimingEvidence[] = [];
  for (const e of evidence) {
    if (e.timingEvidence) {
      result.push(e.timingEvidence);
    }
  }
  return Object.freeze(result);
}
