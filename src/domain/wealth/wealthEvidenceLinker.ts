import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import type { DomainEvidence } from '../interpretation';

export function resolveRelatedWealthPromiseEvidenceIds(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>,
  allRawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly string[] {
  const structuralItems = allRawEvidence.filter(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD
  );

  if (structuralItems.length === 0) {
    return Object.freeze([]);
  }

  // D2 Hora confirmation links specifically to 2nd house / 2nd lord (accumulation structure)
  if (
    item.evidenceFamily === WealthEvidenceFamily.D2 ||
    item.vargaEvidence?.varga === 'D2'
  ) {
    const secondItems = structuralItems.filter(
      (e) =>
        e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
        e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD
    );
    return Object.freeze(secondItems.map((e) => e.id));
  }

  // Dasha timing
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    item.dimension === 'TIMING' ||
    Boolean(item.timingEvidence)
  ) {
    const timingHouses = item.timingEvidence?.houses ?? item.houses ?? [];
    if (timingHouses.length > 0) {
      const houseMatches = structuralItems.filter(
        (e) =>
          (timingHouses.includes(2) &&
            (e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD)) ||
          (timingHouses.includes(11) &&
            (e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD)) ||
          (timingHouses.includes(9) &&
            (e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD)) ||
          (timingHouses.includes(5) &&
            (e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD))
      );
      if (houseMatches.length > 0) {
        return Object.freeze(houseMatches.map((e) => e.id));
      }
    }

    // Link by planet if timing planet rules/occupies wealth factors
    if (item.timingEvidence?.planet || (item.planets && item.planets.length > 0)) {
      const planets = item.timingEvidence?.planet
        ? [item.timingEvidence.planet]
        : item.planets || [];
      const planetMatches = structuralItems.filter((e) =>
        e.planets?.some((p) => planets.includes(p))
      );
      if (planetMatches.length > 0) {
        return Object.freeze(planetMatches.map((e) => e.id));
      }
    }

    // Hard invariant: never fall back to all primary structural items
    return Object.freeze([]);
  }

  // Transit trigger
  if (
    item.evidenceFamily === WealthEvidenceFamily.TRANSIT ||
    Boolean(item.transitEvidence) ||
    item.ruleId?.includes('TRANSIT') ||
    item.id?.includes('TRANSIT')
  ) {
    if (item.transitEvidence?.house) {
      const targetHouse = item.transitEvidence.house;
      const houseMatches = structuralItems.filter(
        (e) =>
          (targetHouse === 2 &&
            (e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD)) ||
          (targetHouse === 11 &&
            (e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD)) ||
          (targetHouse === 9 &&
            (e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD)) ||
          (targetHouse === 5 &&
            (e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD))
      );
      if (houseMatches.length > 0) {
        return Object.freeze(houseMatches.map((e) => e.id));
      }
    }

    if (item.transitEvidence?.planet) {
      const planet = item.transitEvidence.planet;
      const planetMatches = structuralItems.filter((e) =>
        e.planets?.some((p) => p === planet)
      );
      if (planetMatches.length > 0) {
        return Object.freeze(planetMatches.map((e) => e.id));
      }
    }

    if (item.houses && item.houses.length > 0) {
      const houseMatches = structuralItems.filter(
        (e) =>
          (item.houses!.includes(2) &&
            (e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD)) ||
          (item.houses!.includes(11) &&
            (e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD)) ||
          (item.houses!.includes(9) &&
            (e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD)) ||
          (item.houses!.includes(5) &&
            (e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD))
      );
      if (houseMatches.length > 0) {
        return Object.freeze(houseMatches.map((e) => e.id));
      }
    }

    return Object.freeze([]);
  }

  return Object.freeze([]);
}

export function linkWealthEvidence(
  evidence: readonly DomainEvidence[]
): readonly DomainEvidence[] {
  return Object.freeze(
    evidence.map((item) => {
      if (item.relatedEvidenceIds.length > 0) {
        const validLinks = item.relatedEvidenceIds.filter((id) =>
          evidence.some((e) => e.id === id)
        );
        return Object.freeze({
          ...item,
          relatedEvidenceIds: Object.freeze(Array.from(new Set(validLinks)))
        });
      }

      return Object.freeze({
        ...item,
        relatedEvidenceIds: Object.freeze([])
      });
    })
  );
}
