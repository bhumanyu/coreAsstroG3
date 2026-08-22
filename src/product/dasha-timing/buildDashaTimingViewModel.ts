import type { Horoscope } from '../../types';
import type { DomainInterpretation } from '../../domain/interpretation';
import {
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming
} from '../../domain/interpretation/domainTimingAdapter';
import { mapActiveDasha } from '../life-analysis/dasha/activeDashaMapper';
import type {
  DashaTimingViewModel,
  DashaTimingStatus,
  DashaTimelinePeriodProduct,
  DashaBirthAnchorProduct,
  DashaCurrentPeriodProduct,
  DashaCurrentPeriodsProduct,
  DashaTimingEvidenceProduct,
  CareerTimingProduct,
  WealthTimingProduct
} from './dashaTimingTypes';

/**
 * Options for building the Dasha & Timing product view model.
 */
export interface BuildDashaTimingViewModelOptions {
  readonly asOf?: string;
}

/**
 * Builds a dedicated, pure product-layer DashaTimingViewModel from upstream
 * deterministic horoscope and domain timing outputs.
 *
 * Invariants:
 * - Deterministic: Never computes or recalculates Vimshottari or Active Dasha.
 * - Reuses D03 Active Dasha Mapper (mapActiveDasha) and D05 Domain Timing Adapters.
 * - Does not call `new Date()` for period selection; `asOf` is propagated from upstream.
 * - Free of internal engine or raw ASTRO data types.
 */
export function buildDashaTimingViewModel(
  horoscope: Horoscope,
  careerTiming?: CareerTimingProduct | DomainInterpretation,
  wealthTiming?: WealthTimingProduct | DomainInterpretation,
  options?: BuildDashaTimingViewModelOptions
): DashaTimingViewModel {
  const asOf = options?.asOf ?? horoscope.dashaInterpretation?.current?.at;

  // 1. Resolve Timeline from deterministic horoscope
  const rawMahadashas =
    horoscope.dashaInterpretation?.mahadashas ??
    horoscope.vimshottari?.mahadashas ??
    horoscope.fullNatalAnalysis?.vimshottari?.mahadashas;

  const rawAnchor =
    horoscope.dashaInterpretation?.birthAnchor ??
    horoscope.vimshottari?.birthAnchor ??
    horoscope.fullNatalAnalysis?.vimshottari?.birthAnchor;

  let birthAnchor: DashaBirthAnchorProduct | undefined;
  if (rawAnchor && rawAnchor.nakshatra && rawAnchor.nakshatraLord) {
    birthAnchor = {
      nakshatra: String(rawAnchor.nakshatra),
      nakshatraLord: rawAnchor.nakshatraLord,
      nakshatraProgress: rawAnchor.nakshatraProgress,
      remainingFraction: rawAnchor.remainingFraction,
      balanceYears: rawAnchor.balanceYears,
      balanceMonths: rawAnchor.balanceMonths,
      balanceDays: rawAnchor.balanceDays
    };
  }

  const hasTimeline = Array.isArray(rawMahadashas) && rawMahadashas.length > 0;
  const periods: readonly DashaTimelinePeriodProduct[] = hasTimeline
    ? rawMahadashas.map((m: any, idx: number) => ({
        planet: m.planet,
        start: m.start,
        end: m.end,
        durationYears: m.durationYears,
        index: idx + 1,
        antardashas: Array.isArray(m.antardashas)
          ? m.antardashas.map((a: any) => ({
              planet: a.planet,
              start: a.start,
              end: a.end,
              durationYears: a.durationYears
            }))
          : undefined
      }))
    : [];

  const timelineAvailability = hasTimeline ? 'AVAILABLE' : 'UNAVAILABLE';

  // 2. Resolve Active Dasha Interpretation via D03 mapActiveDasha
  const rawCurrent = horoscope.dashaInterpretation?.current;
  const interpretation = mapActiveDasha(rawCurrent);

  let current: DashaCurrentPeriodsProduct | undefined;

  if (interpretation && interpretation.status === 'AVAILABLE') {
    const mapCurrentPeriod = (
      period?: (typeof interpretation)['mahadasha'],
      level?: 'MD' | 'AD' | 'PD'
    ): DashaCurrentPeriodProduct | undefined => {
      if (!period || !level) return undefined;
      return {
        level,
        planet: period.planet,
        start: period.start,
        end: period.end,
        placement: period.placement,
        ownedHouses: period.ownedHouses,
        functionalRoles: period.functionalRoles,
        functionalNature: period.functionalNature,
        dignity: period.dignity,
        state: period.state,
        confidence: period.confidence
      };
    };

    const mahadasha = mapCurrentPeriod(interpretation.mahadasha, 'MD');
    const antardasha = mapCurrentPeriod(interpretation.antardasha, 'AD');
    const pratyantardasha = mapCurrentPeriod(interpretation.pratyantardasha, 'PD');

    if (mahadasha || antardasha || pratyantardasha) {
      current = {
        mahadasha,
        antardasha,
        pratyantardasha,
        pair: interpretation.pair
      };
    }
  }

  // 3. Resolve Career & Wealth Timing (Reuse pre-computed or adapt DomainInterpretation)
  let resolvedCareerTiming: CareerTimingProduct | undefined;
  if (careerTiming) {
    if ('status' in careerTiming) {
      resolvedCareerTiming = careerTiming as CareerTimingProduct;
    } else {
      resolvedCareerTiming = buildNormalizedCareerTiming(
        careerTiming as DomainInterpretation,
        asOf
      );
    }
  }

  let resolvedWealthTiming: WealthTimingProduct | undefined;
  if (wealthTiming) {
    if ('status' in wealthTiming) {
      resolvedWealthTiming = wealthTiming as WealthTimingProduct;
    } else {
      resolvedWealthTiming = buildNormalizedWealthTiming(
        wealthTiming as DomainInterpretation,
        asOf
      );
    }
  }

  // 4. Determine overall aggregation availability status
  let availability: DashaTimingStatus = 'UNAVAILABLE';
  if (timelineAvailability === 'AVAILABLE' && current) {
    availability = 'AVAILABLE';
  } else if (timelineAvailability === 'AVAILABLE') {
    availability = 'PARTIAL';
  }

  // 5. Assemble canonical evidence collection
  const evidenceMap = new Map<string, DashaTimingEvidenceProduct>();

  // (a) Dasha interpretation evidence (top-level, per-level, pair)
  if (interpretation) {
    const interpretationEvidenceList = [
      ...(interpretation.evidence ?? []),
      ...(interpretation.mahadasha?.evidence ?? []),
      ...(interpretation.antardasha?.evidence ?? []),
      ...(interpretation.pratyantardasha?.evidence ?? []),
      ...(interpretation.pair?.relationshipEvidence ?? [])
    ];

    for (const item of interpretationEvidenceList) {
      const id = item.ruleId;
      if (id && !evidenceMap.has(id)) {
        evidenceMap.set(id, {
          id,
          ruleId: item.ruleId,
          statement: item.statement,
          effect: item.effect,
          level: item.level,
          source: item.source
        });
      }
    }
  }

  // (b) Career and Wealth timing evidence from passed domain interpretations or horoscope
  if (careerTiming && typeof careerTiming === 'object' && 'evidence' in careerTiming && Array.isArray((careerTiming as DomainInterpretation).evidence)) {
    for (const item of (careerTiming as DomainInterpretation).evidence) {
      const id = item.id;
      if (id && !evidenceMap.has(id)) {
        const effect =
          item.polarity === 'SUPPORTING'
            ? 'SUPPORT'
            : item.polarity === 'CHALLENGING'
            ? 'CHALLENGE'
            : item.polarity === 'NEUTRAL'
            ? 'NEUTRAL'
            : String(item.polarity ?? 'NEUTRAL');

        evidenceMap.set(id, {
          id,
          ruleId: item.ruleId ?? item.id,
          statement: item.statement,
          effect,
          level: item.timing?.period ?? item.timing?.level,
          source: item.source ?? 'D1',
          strength: item.strength,
          domain: item.domain ?? 'CAREER'
        });
      }
    }
  }

  if (horoscope.themeInterpretationV2?.career?.evidence && Array.isArray(horoscope.themeInterpretationV2.career.evidence)) {
    for (const item of horoscope.themeInterpretationV2.career.evidence) {
      const id = item.id;
      if (id && !evidenceMap.has(id)) {
        evidenceMap.set(id, {
          id,
          ruleId: item.ruleId,
          statement: item.statement,
          effect: item.effect,
          level: item.timingEvidence?.dashaLevel,
          source: item.vargaEvidence ? 'VARGA' : (item.timingEvidence ? 'DASHA' : 'D1'),
          strength: item.strength,
          domain: 'CAREER'
        });
      }
    }
  }

  if (wealthTiming && typeof wealthTiming === 'object' && 'evidence' in wealthTiming && Array.isArray((wealthTiming as DomainInterpretation).evidence)) {
    for (const item of (wealthTiming as DomainInterpretation).evidence) {
      const id = item.id;
      if (id && !evidenceMap.has(id)) {
        const effect =
          item.polarity === 'SUPPORTING'
            ? 'SUPPORT'
            : item.polarity === 'CHALLENGING'
            ? 'CHALLENGE'
            : item.polarity === 'NEUTRAL'
            ? 'NEUTRAL'
            : String(item.polarity ?? 'NEUTRAL');

        evidenceMap.set(id, {
          id,
          ruleId: item.ruleId ?? item.id,
          statement: item.statement,
          effect,
          level: item.timing?.period ?? item.timing?.level,
          source: item.source ?? 'D1',
          strength: item.strength,
          domain: item.domain ?? 'WEALTH'
        });
      }
    }
  }

  if (horoscope.themeInterpretationV2?.wealth?.evidence && Array.isArray(horoscope.themeInterpretationV2.wealth.evidence)) {
    for (const item of horoscope.themeInterpretationV2.wealth.evidence) {
      const id = item.id;
      if (id && !evidenceMap.has(id)) {
        evidenceMap.set(id, {
          id,
          ruleId: item.ruleId,
          statement: item.statement,
          effect: item.effect,
          level: item.timingEvidence?.dashaLevel,
          source: item.vargaEvidence ? 'VARGA' : (item.timingEvidence ? 'DASHA' : 'D1'),
          strength: item.strength,
          domain: 'WEALTH'
        });
      }
    }
  }

  // Ensure every evidenceIds referenced on Career / Wealth timing activations exists in evidence collection
  const allReferencedEvidenceIds: string[] = [];
  if (resolvedCareerTiming?.mahadasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedCareerTiming.mahadasha.evidenceIds);
  }
  if (resolvedCareerTiming?.antardasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedCareerTiming.antardasha.evidenceIds);
  }
  if (resolvedCareerTiming?.pratyantardasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedCareerTiming.pratyantardasha.evidenceIds);
  }
  if (resolvedWealthTiming?.mahadasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedWealthTiming.mahadasha.evidenceIds);
  }
  if (resolvedWealthTiming?.antardasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedWealthTiming.antardasha.evidenceIds);
  }
  if (resolvedWealthTiming?.pratyantardasha?.evidenceIds) {
    allReferencedEvidenceIds.push(...resolvedWealthTiming.pratyantardasha.evidenceIds);
  }

  for (const id of allReferencedEvidenceIds) {
    if (id && !evidenceMap.has(id)) {
      evidenceMap.set(id, {
        id,
        ruleId: id,
        statement: `Astrological timing evidence for ${id}.`,
        effect: 'SUPPORT',
        source: 'TIMING'
      });
    }
  }

  const evidence: readonly DashaTimingEvidenceProduct[] = Object.freeze(
    Array.from(evidenceMap.values())
  );

  return {
    availability,
    asOf,
    timeline: {
      availability: timelineAvailability,
      birthAnchor,
      periods
    },
    ...(current ? { current } : {}),
    ...(interpretation ? { interpretation } : {}),
    ...(resolvedCareerTiming ? { career: resolvedCareerTiming } : {}),
    ...(resolvedWealthTiming ? { wealth: resolvedWealthTiming } : {}),
    evidence,
    generatedAt: new Date().toISOString()
  };
}
