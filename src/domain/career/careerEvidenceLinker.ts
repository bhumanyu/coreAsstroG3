import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import type { DomainEvidence } from '../interpretation';

export function resolveRelatedCareerPromiseEvidenceIds(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>,
  allRawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly string[] {
  const structuralItems = allRawEvidence.filter(
    (e) =>
      e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.SECOND_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.SECOND_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD ||
      (e.priority === 'PRIMARY' && e.dimension !== 'TIMING' && !e.vargaEvidence)
  );

  if (structuralItems.length === 0) {
    return Object.freeze([]);
  }

  // If item is D10 varga confirmation, link specifically to 10th house / 10th lord structural items
  if (
    item.evidenceFamily === CareerEvidenceFamily.D10 ||
    item.vargaEvidence?.varga === 'D10'
  ) {
    const tenthItems = structuralItems.filter(
      (e) =>
        e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
        e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD ||
        e.priority === 'PRIMARY'
    );
    // Hard P-027 invariant: Never slice arbitrary structural items if no match exists
    return Object.freeze(tenthItems.map((e) => e.id));
  }

  // If item is Dasha timing, link to participating houses/planets
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
    item.dimension === 'TIMING'
  ) {
    const timingHouses = item.timingEvidence?.houses ?? item.houses ?? [];
    if (timingHouses.length > 0) {
      const houseMatches = structuralItems.filter(
        (e) =>
          (timingHouses.includes(10) &&
            (e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD)) ||
          (timingHouses.includes(6) &&
            (e.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD)) ||
          (timingHouses.includes(2) &&
            (e.evidenceFamily === CareerEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.SECOND_LORD)) ||
          (timingHouses.includes(11) &&
            (e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD))
      );
      if (houseMatches.length > 0) {
        return Object.freeze(houseMatches.map((e) => e.id));
      }
    }

    // Link by planet if timing planet rules/occupies career factors
    if (item.timingEvidence?.planet || (item.planets && item.planets.length > 0)) {
      const planets = item.timingEvidence?.planet ? [item.timingEvidence.planet] : item.planets || [];
      const planetMatches = structuralItems.filter((e) =>
        e.planets?.some((p) => planets.includes(p))
      );
      if (planetMatches.length > 0) {
        return Object.freeze(planetMatches.map((e) => e.id));
      }
    }

    return Object.freeze([]);
  }

  return Object.freeze([]);
}

export function linkCareerEvidence(
  evidence: readonly DomainEvidence[]
): readonly DomainEvidence[] {
  const primaryPromiseIds = evidence
    .filter((e) => e.role === 'PRIMARY' && e.phase === 'NATAL_PROMISE')
    .map((e) => e.id);

  return Object.freeze(
    evidence.map((item) => {
      // If already linked, ensure unique and valid links
      if (item.relatedEvidenceIds.length > 0) {
        // Keep valid links that exist in evidence
        const validLinks = item.relatedEvidenceIds.filter((id) =>
          evidence.some((e) => e.id === id)
        );
        return Object.freeze({
          ...item,
          relatedEvidenceIds: Object.freeze(Array.from(new Set(validLinks)))
        });
      }

      // If D10 and no links yet, check if primary promise exists
      if (item.source === 'D10' || item.role === 'CONFIRMATION') {
        const related = primaryPromiseIds.length > 0 ? primaryPromiseIds : [];
        return Object.freeze({
          ...item,
          relatedEvidenceIds: Object.freeze(Array.from(new Set(related)))
        });
      }

      return Object.freeze({
        ...item,
        relatedEvidenceIds: Object.freeze([])
      });
    })
  );
}
