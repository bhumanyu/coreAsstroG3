import type {
  Horoscope,
  VimshottariMahadashaPeriod,
  VimshottariAntardashaPeriod
} from '../../types';
import type { DomainInterpretation } from '../../domain/interpretation';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';
import {
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming,
  getCareerTimingActivations,
  getWealthPeriodTimingActivations
} from '../../domain/interpretation/domainTimingAdapter';
import { mapActiveDasha } from '../life-analysis/dasha/activeDashaMapper';
import { synthesizeCareerDashaHierarchy } from '../life-analysis/dashaCareerHierarchy';
import { synthesizeWealthDashaHierarchy } from '../life-analysis/dashaWealthHierarchy';
import { indexDashaPeriodActivations } from '../life-analysis/dashaHierarchyUtils';
import type {
  DashaTimingViewModel,
  DashaTimingStatus,
  DashaTimelinePeriodProduct,
  DashaBirthAnchorProduct,
  DashaCurrentPeriodProduct,
  DashaCurrentPeriodsProduct,
  DashaTimingEvidenceProduct,
  CareerTimingProduct,
  WealthTimingProduct,
  DashaCareerHierarchySynthesis,
  DashaWealthHierarchySynthesis
} from './dashaTimingTypes';
import {
  encodeMahadashaId,
  encodeAntardashaId,
  encodePratyantardashaId
} from '../../core/analysis/selectedMdAdPeriod';

/**
 * Input structure for building the Dasha & Timing product view model.
 */
export interface BuildDashaTimingViewModelInput {
  readonly temporalState: AnalysisTemporalState;
  readonly horoscope?: Horoscope;
  readonly careerTiming?: CareerTimingProduct | DomainInterpretation;
  readonly wealthTiming?: WealthTimingProduct | DomainInterpretation;
  /** Optional exclusive horizon requested by the caller. */
  readonly requestedHorizon?: string;
}

function classifyProductTemporalRelation(
  start: string,
  end: string,
  asOf: string
): 'PAST' | 'CURRENT' | 'FUTURE' {
  const target = Date.parse(asOf);
  if (target < Date.parse(start)) return 'FUTURE';
  if (target >= Date.parse(end)) return 'PAST';
  return 'CURRENT';
}

/**
 * Builds a dedicated, pure product-layer DashaTimingViewModel from upstream
 * deterministic horoscope and domain timing outputs.
 *
 * Invariants:
 * - Deterministic: Never computes or recalculates Vimshottari or Active Dasha.
 * - Sourced strictly and exclusively from canonical temporalState.
 * - Reuses D03 Active Dasha Mapper (mapActiveDasha) and D05 Domain Timing Adapters.
 * - Does not call Date constructor anywhere; `asOf` is propagated from upstream.
 * - Free of internal engine or raw ASTRO data types.
 */
export function buildDashaTimingViewModel(
  input: BuildDashaTimingViewModelInput
): DashaTimingViewModel {
  const { temporalState, horoscope, careerTiming, wealthTiming, requestedHorizon } = input;
  if (!temporalState) {
    throw new Error('buildDashaTimingViewModel: canonical temporalState is required');
  }
  const asOf = temporalState.asOf;

  // 1. Resolve Timeline from deterministic temporalState
  const rawMahadashas: readonly VimshottariMahadashaPeriod[] | undefined =
    temporalState.dashaInterpretation?.mahadashas;

  const rawAnchor =
    temporalState.dashaInterpretation?.birthAnchor;

  let birthAnchor: DashaBirthAnchorProduct | undefined;
  if (rawAnchor && rawAnchor.nakshatra && rawAnchor.nakshatraLord) {
    const extendedAnchor = rawAnchor as Partial<{
      balanceYears: number;
      balanceMonths: number;
      balanceDays: number;
    }>;
    birthAnchor = {
      nakshatra: String(rawAnchor.nakshatra),
      nakshatraLord: rawAnchor.nakshatraLord,
      nakshatraProgress: rawAnchor.nakshatraProgress,
      remainingFraction: rawAnchor.remainingFraction,
      balanceYears: extendedAnchor.balanceYears,
      balanceMonths: extendedAnchor.balanceMonths,
      balanceDays: extendedAnchor.balanceDays
    };
  }

  const requestedTimelineValid = requestedHorizon === undefined || isCompleteDashaTimeline(rawMahadashas);
  const hasTimeline = Array.isArray(rawMahadashas) && rawMahadashas.length > 0 && requestedTimelineValid;
  const periods: readonly DashaTimelinePeriodProduct[] = hasTimeline && rawMahadashas && requestedTimelineValid
    ? rawMahadashas.map((m: VimshottariMahadashaPeriod, idx: number) => {
        const mdId = encodeMahadashaId(m.planet, m.start, m.end);
        return {
          id: mdId,
          planet: m.planet,
          start: m.start,
          end: m.end,
          durationYears: m.durationYears,
          index: idx + 1,
          antardashas: Array.isArray(m.antardashas)
            ? m.antardashas.map((a: VimshottariAntardashaPeriod) => {
                const adId = encodeAntardashaId(a.planet, a.start, a.end, mdId);
                const adTemporalRelation = classifyProductTemporalRelation(a.start, a.end, asOf);
                const pratyantardashas = Array.isArray((a as VimshottariAntardashaPeriod & {
                  pratyantardashas?: readonly { planet: typeof a.planet; start: string; end: string }[];
                }).pratyantardashas)
                  ? (a as VimshottariAntardashaPeriod & {
                      pratyantardashas: readonly { planet: typeof a.planet; start: string; end: string }[];
                    }).pratyantardashas.map((pd) => ({
                      id: encodePratyantardashaId(pd.planet, pd.start, pd.end, adId),
                      planet: pd.planet,
                      start: pd.start,
                      end: pd.end,
                      temporalRelation: classifyProductTemporalRelation(pd.start, pd.end, asOf)
                    }))
                  : undefined;
                return {
                  id: adId,
                  planet: a.planet,
                  start: a.start,
                  end: a.end,
                  durationYears: a.durationYears,
                  temporalRelation: adTemporalRelation,
                  pratyantardashas
                };
              })
            : undefined
        };
      })
    : [];

  const timelineCompleteness = requestedHorizon === undefined
    ? { status: 'UNREQUESTED' as const }
    : getTimelineCompleteness(rawMahadashas, asOf, requestedHorizon);

  const timelineAvailability = hasTimeline ? 'AVAILABLE' : 'UNAVAILABLE';

  // 2. Resolve Active Dasha Interpretation via D03 mapActiveDasha
  const rawCurrent = temporalState.dashaInterpretation?.current;
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

  if (horoscope && horoscope.themeInterpretationV2?.career?.evidence && Array.isArray(horoscope.themeInterpretationV2.career.evidence)) {
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

  if (horoscope && horoscope.themeInterpretationV2?.wealth?.evidence && Array.isArray(horoscope.themeInterpretationV2.wealth.evidence)) {
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

  const unresolvedEvidenceIds: string[] = [];
  for (const id of allReferencedEvidenceIds) {
    if (id && !evidenceMap.has(id)) {
      if (!unresolvedEvidenceIds.includes(id)) {
        unresolvedEvidenceIds.push(id);
      }
    }
  }

  if (unresolvedEvidenceIds.length > 0 && availability === 'AVAILABLE') {
    availability = 'PARTIAL';
  }

  const evidence: readonly DashaTimingEvidenceProduct[] = Object.freeze(
    Array.from(evidenceMap.values())
  );

  let careerHierarchy: DashaCareerHierarchySynthesis | undefined;
  if (
    careerTiming &&
    typeof careerTiming === 'object' &&
    'timingActivations' in (careerTiming as any)
  ) {
    const activations = getCareerTimingActivations(careerTiming as DomainInterpretation);
    const { md, ad, pd } = indexDashaPeriodActivations(activations);
    if (md && ad && pd) {
      careerHierarchy = synthesizeCareerDashaHierarchy(md, ad, pd);
    }
  }

  let wealthHierarchy: DashaWealthHierarchySynthesis | undefined;
  if (
    wealthTiming &&
    typeof wealthTiming === 'object' &&
    'periodTimingActivations' in (wealthTiming as any)
  ) {
    const activations = getWealthPeriodTimingActivations(wealthTiming as DomainInterpretation);
    const { md, ad, pd } = indexDashaPeriodActivations(activations);
    if (md && ad && pd) {
      wealthHierarchy = synthesizeWealthDashaHierarchy(md, ad, pd);
    }
  }

  return {
    availability,
    asOf,
    timeline: {
      availability: timelineAvailability,
      birthAnchor,
      periods,
      completeness: timelineCompleteness
    },
    ...(current ? { current } : {}),
    ...(interpretation ? { interpretation } : {}),
    ...(resolvedCareerTiming ? { career: resolvedCareerTiming } : {}),
    ...(resolvedWealthTiming ? { wealth: resolvedWealthTiming } : {}),
    ...(careerHierarchy ? { careerHierarchy } : {}),
    ...(wealthHierarchy ? { wealthHierarchy } : {}),
    evidence,
    ...(unresolvedEvidenceIds.length > 0
      ? { unresolvedEvidenceIds: Object.freeze(unresolvedEvidenceIds) }
      : {})
  };
}

function getTimelineCompleteness(
  periods: readonly VimshottariMahadashaPeriod[] | undefined,
  requestedStart: string,
  requestedHorizon: string
): NonNullable<DashaTimingViewModel['timeline']['completeness']> {
  const requestedEndMs = parseIsoInstant(requestedHorizon);
  const requestedStartMs = parseIsoInstant(requestedStart);
  if (requestedEndMs === undefined || requestedStartMs === undefined || requestedEndMs <= requestedStartMs) {
    return { status: 'INVALID_HORIZON', requestedHorizon };
  }
  if (!isCompleteDashaTimeline(periods)) {
    return { status: 'INVALID_TIMELINE', requestedHorizon };
  }
  const firstStart = parseIsoInstant(periods[0].start);
  const lastEnd = parseIsoInstant(periods[periods.length - 1].end);
  if (firstStart === undefined || lastEnd === undefined) {
    return { status: 'INVALID_TIMELINE', requestedHorizon };
  }
  return {
    status: firstStart <= requestedStartMs && requestedEndMs <= lastEnd ? 'COMPLETE' : 'TRUNCATED',
    requestedHorizon
  };
}

function isCompleteDashaTimeline(
  periods: readonly VimshottariMahadashaPeriod[] | undefined
): periods is readonly VimshottariMahadashaPeriod[] {
  if (!Array.isArray(periods) || periods.length === 0) return false;
  const validateSiblings = (
    siblings: readonly { readonly start: string; readonly end: string }[],
    parent?: { readonly start: number; readonly end: number }
  ): boolean => {
    if (!Array.isArray(siblings) || siblings.length === 0) return false;
    let previousEnd: number | undefined;
    for (const [index, period] of siblings.entries()) {
      if (!period || typeof period.start !== 'string' || typeof period.end !== 'string') return false;
      const start = parseIsoInstant(period.start);
      const end = parseIsoInstant(period.end);
      if (start === undefined || end === undefined || start >= end
        || (previousEnd !== undefined && start !== previousEnd)
        || (parent && (start < parent.start || end > parent.end))
        || (parent && index === 0 && start !== parent.start)
        || (parent && index === siblings.length - 1 && end !== parent.end)) {
        return false;
      }
      previousEnd = end;
    }
    return true;
  };

  if (!validateSiblings(periods)) return false;
  for (const md of periods) {
    const mdStart = parseIsoInstant(md.start);
    const mdEnd = parseIsoInstant(md.end);
    if (mdStart === undefined || mdEnd === undefined || !validateSiblings(md.antardashas, { start: mdStart, end: mdEnd })) {
      return false;
    }
    for (const ad of md.antardashas) {
      const adStart = parseIsoInstant(ad.start);
      const adEnd = parseIsoInstant(ad.end);
      if (adStart === undefined || adEnd === undefined
        || !validateSiblings(ad.pratyantardashas ?? [], { start: adStart, end: adEnd })) {
        return false;
      }
    }
  }
  return true;
}

function parseIsoInstant(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return undefined;
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue, , , offsetHourValue, offsetMinuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const offsetHour = offsetHourValue === undefined ? 0 : Number(offsetHourValue);
  const offsetMinute = offsetMinuteValue === undefined ? 0 : Number(offsetMinuteValue);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59
    || offsetHour > 23 || offsetMinute > 59) {
    return undefined;
  }
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(hour, minute, second, 0);
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day) {
    return undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}
