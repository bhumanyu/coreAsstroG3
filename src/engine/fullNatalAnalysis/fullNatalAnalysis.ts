/** READ-ONLY FULL NATAL ANALYSIS REPORT LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import {
  FullNatalAnalysisInput,
  FullNatalAnalysisReport,
  BirthInformationSection,
  MethodologySection,
  ExecutiveSummarySection,
  AscendantSection,
  PlanetAnalysisSection,
  HouseAnalysisSection,
  FunctionalRolesSection,
  YogasSection,
  YogaReportItem,
  PlanetaryStrengthSection,
  D9Section,
  D10Section,
  VimshottariSection,
  CurrentDashaSection,
  CurrentTransitSection,
  LifeThemesSection,
  MajorLifePeriodsSection,
  MajorLifePeriod,
  OverallSynthesisSection,
  PlanetReportItem,
  HouseReportItem,
  FunctionalRoleReportItem,
  PlanetaryStrengthReportItem,
  AnalysisAvailability
} from './fullNatalAnalysisTypes';
import { METHODOLOGY, EXPECTED_PLANET_ORDER } from './fullNatalAnalysisMetadata';
import { Horoscope, LifeThemeReport, ChartSynthesisReport, LifeTheme, Planet } from '../../types';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const prop = (obj as any)[key];
    if (prop !== null && typeof prop === 'object' && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  }
  return obj;
}

export function validateInput(input: FullNatalAnalysisInput): void {
  if (input === null || input === undefined || typeof input !== 'object') {
    throw new TypeError('fullNatalAnalysis input must not be null or undefined.');
  }

  if (!input.horoscope) {
    throw new TypeError('fullNatalAnalysis input is missing required field: horoscope.');
  }

  if (!input.lifeThemes) {
    throw new TypeError('fullNatalAnalysis input is missing required field: lifeThemes.');
  }

  if (!input.chartSynthesis) {
    throw new TypeError('fullNatalAnalysis input is missing required field: chartSynthesis.');
  }
}

function buildBirthInformationSection(horoscope: Horoscope): BirthInformationSection {
  return {
    status: 'AVAILABLE',
    details: horoscope.birthDetails
  };
}

function buildMethodologySection(): MethodologySection {
  return {
    status: 'AVAILABLE',
    ...METHODOLOGY
  };
}

function buildExecutiveSummarySection(chartSynthesis: ChartSynthesisReport): ExecutiveSummarySection {
  const strongestThemes = chartSynthesis.strongestThemes.map((t) => t.theme);
  const challengedThemes = chartSynthesis.weakestThemes.map((t) => t.theme);
  const mixedThemes = chartSynthesis.mixedThemes.map((t) => t.theme);

  const headline = `Full Natal Analysis Executive Summary: ${strongestThemes.length} strongly supported theme(s), ${challengedThemes.length} challenged theme(s), overall confidence ${chartSynthesis.overallConfidence}.`;

  return {
    status: 'AVAILABLE',
    headline,
    overallConclusion: chartSynthesis.overallConclusion,
    overallConfidence: chartSynthesis.overallConfidence,
    strongestThemes,
    challengedThemes,
    mixedThemes,
    keyObservations: chartSynthesis.keyObservations
  };
}

function buildAscendantSection(horoscope: Horoscope): AscendantSection {
  const ascSign = horoscope.rasiChart?.ascendantSign;
  const ascLongitude = horoscope.rasiChart?.ascendantLongitude;

  if (!ascSign || ascLongitude === undefined) {
    return {
      status: 'UNAVAILABLE',
      sign: undefined,
      longitude: undefined,
      lord: undefined,
      occupants: [],
      receivedAspects: []
    };
  }

  const house1Analysis = horoscope.houseAnalysis?.houses?.[1];
  const lord = house1Analysis?.lord ?? horoscope.houseLordship?.houseLords?.[1];
  const lordFacts = lord ? horoscope.planetFacts?.[lord as Planet] : undefined;

  const isComplete = Boolean(lord && lordFacts);

  return {
    status: isComplete ? 'AVAILABLE' : 'PARTIAL',
    sign: ascSign,
    longitude: ascLongitude,
    lord,
    lordHouse: lordFacts?.house ?? lordFacts?.position?.house,
    lordSign: lordFacts?.sign ?? lordFacts?.position?.sign,
    occupants: house1Analysis?.occupants ?? [],
    receivedAspects: lord ? (horoscope.planetAnalysis?.planets?.[lord as Planet]?.receivedAspects ?? []) : []
  };
}

function buildPlanetAnalysisSection(horoscope: Horoscope): PlanetAnalysisSection {
  const items: PlanetReportItem[] = [];

  for (const planet of EXPECTED_PLANET_ORDER) {
    const pAnalysis = horoscope.planetAnalysis?.planets?.[planet];
    const pFacts = horoscope.planetFacts?.[planet];
    const fRoles = horoscope.functionalRoles?.planets?.[planet];

    if (pAnalysis && pFacts) {
      items.push({
        planet,
        sign: pFacts.sign ?? pFacts.position.sign,
        house: pFacts.house ?? pFacts.position.house,
        longitude: pFacts.position.eclipticLongitude ?? pFacts.position.longitude ?? 0,
        nakshatraResult: pFacts.nakshatraResult!,
        nakshatraMetadata: pFacts.nakshatraMetadata!,
        dignity: pFacts.dignity.status,
        state: pFacts.state,
        functionalRoles: fRoles?.roles ?? [],
        receivedAspects: pAnalysis.receivedAspects,
        castAspects: pAnalysis.castAspects,
        evidence: pAnalysis.evidence
      });
    }
  }

  const status: AnalysisAvailability =
    items.length === 0
      ? 'UNAVAILABLE'
      : items.length === EXPECTED_PLANET_ORDER.length
      ? 'AVAILABLE'
      : 'PARTIAL';

  return {
    status,
    planets: items
  };
}

function buildHouseAnalysisSection(horoscope: Horoscope): HouseAnalysisSection {
  const items: HouseReportItem[] = [];
  let allLordsPresent = true;

  for (let h = 1; h <= 12; h++) {
    const hAnalysis = horoscope.houseAnalysis?.houses?.[h];
    if (hAnalysis) {
      const lordFacts = horoscope.planetFacts?.[hAnalysis.lord as Planet];
      if (!lordFacts) {
        allLordsPresent = false;
      }
      items.push({
        house: h,
        sign: hAnalysis.sign,
        lord: hAnalysis.lord,
        lordHouse: lordFacts?.house ?? lordFacts?.position?.house,
        lordSign: lordFacts?.sign ?? lordFacts?.position?.sign,
        occupants: hAnalysis.occupants,
        receivedAspects: hAnalysis.receivedAspects,
        evidence: hAnalysis.evidence
      });
    } else {
      allLordsPresent = false;
    }
  }

  const status: AnalysisAvailability =
    items.length === 0
      ? 'UNAVAILABLE'
      : items.length === 12 && allLordsPresent
      ? 'AVAILABLE'
      : 'PARTIAL';

  return {
    status,
    houses: items
  };
}

function buildFunctionalRolesSection(horoscope: Horoscope): FunctionalRolesSection {
  const fRoles = horoscope.functionalRoles;
  if (!fRoles) {
    return {
      status: 'UNAVAILABLE',
      ascendantSign: undefined,
      badhakaHouse: undefined,
      badhakaLord: undefined,
      items: []
    };
  }

  const items: FunctionalRoleReportItem[] = [];

  for (const planet of EXPECTED_PLANET_ORDER) {
    const pRole = fRoles.planets?.[planet];
    if (pRole) {
      items.push({
        planet,
        ownedHouses: pRole.ownedHouses,
        roles: pRole.roles,
        functionalNature: pRole.functionalNature,
        isYogakaraka: pRole.isYogakaraka,
        evidence: pRole.evidence
      });
    }
  }

  const status: AnalysisAvailability =
    items.length === 0
      ? 'UNAVAILABLE'
      : items.length === EXPECTED_PLANET_ORDER.length
      ? 'AVAILABLE'
      : 'PARTIAL';

  return {
    status,
    ascendantSign: fRoles.ascendantSign,
    badhakaHouse: fRoles.badhakaHouse,
    badhakaLord: fRoles.badhakaLord,
    items
  };
}

function buildYogasSection(horoscope: Horoscope): YogasSection {
  const allYogas = horoscope.yogas?.yogas ?? [];

  const mapYogaItem = (y: typeof allYogas[number]): YogaReportItem => {
    const finalStatus = y.assessment?.finalStatus;
    const strengthVal = y.assessment?.strength ?? y.strength;
    return {
      type: y.type,
      category: y.category,
      finalStatus,
      strength: strengthVal !== undefined ? String(strengthVal) : undefined,
      planets: y.planets,
      houses: y.houses,
      supportingFactors: y.supportingFactors ?? y.assessment?.supportingFactors,
      weakeningFactors: y.weakeningFactors ?? y.assessment?.weakeningFactors,
      cancellationFactors: y.cancellationFactors ?? y.assessment?.cancellationFactors,
      evidence: y.evidence
    };
  };

  const items = allYogas.map(mapYogaItem);

  const detected = items.filter((y: YogaReportItem) => y.finalStatus !== 'CANCELLED' && y.finalStatus !== undefined);
  const strong = items.filter((y: YogaReportItem) => y.finalStatus === 'STRONG');
  const weakened = items.filter((y: YogaReportItem) => y.finalStatus === 'WEAKENED');
  const cancelled = items.filter((y: YogaReportItem) => y.finalStatus === 'CANCELLED');
  const neutral = items.filter((y: YogaReportItem) => y.finalStatus === 'PRESENT');

  return {
    status: horoscope.yogas ? 'AVAILABLE' : 'UNAVAILABLE',
    detected,
    strong,
    weakened,
    cancelled,
    neutral
  };
}

function buildPlanetaryStrengthSection(horoscope: Horoscope): PlanetaryStrengthSection {
  const pStrength = horoscope.planetaryStrength;
  if (!pStrength || !pStrength.planets) {
    return {
      status: 'UNAVAILABLE',
      planets: []
    };
  }

  let completeCount = 0;
  let totalCount = 0;

  const items: PlanetaryStrengthReportItem[] = [];

  for (const planet of EXPECTED_PLANET_ORDER) {
    const str = pStrength.planets[planet];
    if (str) {
      totalCount++;
      const status = str.shadbala?.status;
      if (status === 'COMPLETE') {
        completeCount++;
      }
      items.push({
        planet,
        components: str.components,
        calculatedTotal: str.calculatedTotal,
        shadbalaStatus: status,
        meetsMinimum: str.shadbala?.meetsMinimum
      });
    }
  }

  let status: AnalysisAvailability = 'UNAVAILABLE';
  if (totalCount > 0) {
    status = (totalCount === EXPECTED_PLANET_ORDER.length && completeCount === EXPECTED_PLANET_ORDER.length) ? 'AVAILABLE' : 'PARTIAL';
  }

  return {
    status,
    planets: items
  };
}

function buildD9Section(horoscope: Horoscope): D9Section {
  const d9 = horoscope.divisionalInterpretation?.d9;
  if (!d9 || !d9.ascendant) {
    return { status: 'UNAVAILABLE' };
  }

  const upstreamStatus = (d9 as any).status ?? (d9 as any).completeness;
  let status: AnalysisAvailability = 'AVAILABLE';
  if (upstreamStatus === 'AVAILABLE' || upstreamStatus === 'PARTIAL' || upstreamStatus === 'UNAVAILABLE') {
    status = upstreamStatus;
  } else {
    const hasHouseLords = d9.houseLords && Object.keys(d9.houseLords).length > 0;
    const hasEvidence = d9.evidence && d9.evidence.length > 0;
    status = (hasHouseLords && hasEvidence) ? 'AVAILABLE' : 'PARTIAL';
  }

  return {
    status,
    details: {
      varga: 'D9',
      ascendantSign: d9.ascendant.sign,
      houseLords: d9.houseLords,
      domainMetadata: d9.domainMetadata,
      evidence: d9.evidence,
      confidence: d9.confidence
    }
  };
}

function buildD10Section(horoscope: Horoscope): D10Section {
  const d10 = horoscope.divisionalInterpretation?.d10;
  if (!d10 || !d10.ascendant) {
    return { status: 'UNAVAILABLE' };
  }

  const upstreamStatus = (d10 as any).status ?? (d10 as any).completeness;
  let status: AnalysisAvailability = 'AVAILABLE';
  if (upstreamStatus === 'AVAILABLE' || upstreamStatus === 'PARTIAL' || upstreamStatus === 'UNAVAILABLE') {
    status = upstreamStatus;
  } else {
    const hasHouseLords = d10.houseLords && Object.keys(d10.houseLords).length > 0;
    const hasEvidence = d10.evidence && d10.evidence.length > 0;
    status = (hasHouseLords && hasEvidence) ? 'AVAILABLE' : 'PARTIAL';
  }

  return {
    status,
    details: {
      varga: 'D10',
      ascendantSign: d10.ascendant.sign,
      houseLords: d10.houseLords,
      domainMetadata: d10.domainMetadata,
      evidence: d10.evidence,
      confidence: d10.confidence
    }
  };
}

function buildVimshottariSection(horoscope: Horoscope): VimshottariSection {
  const dasha = horoscope.dashaInterpretation;
  if (!dasha || !dasha.mahadashas) {
    return {
      status: 'UNAVAILABLE'
    };
  }

  return {
    status: 'AVAILABLE',
    birthAnchor: dasha.birthAnchor,
    confidence: dasha.confidence,
    mahadashas: dasha.mahadashas
  };
}

function buildCurrentDashaSection(horoscope: Horoscope): CurrentDashaSection {
  const current = horoscope.dashaInterpretation?.current;
  return {
    status: current ? 'AVAILABLE' : 'UNAVAILABLE',
    current
  };
}

function buildCurrentTransitSection(): CurrentTransitSection {
  return {
    status: 'UNAVAILABLE',
    reason: 'Transit analysis is not included in static natal horoscope calculations.'
  };
}

function buildLifeThemesSection(
  _lifeThemes: LifeThemeReport,
  chartSynthesis: ChartSynthesisReport,
  horoscope?: Horoscope
): LifeThemesSection {
  const themeCount = chartSynthesis?.themes?.length ?? 0;
  const status: AnalysisAvailability =
    themeCount === 0
      ? 'UNAVAILABLE'
      : themeCount === Object.values(LifeTheme).length
      ? 'AVAILABLE'
      : 'PARTIAL';

  return {
    status,
    themes: chartSynthesis?.themes ?? [],
    synthesis: chartSynthesis?.keyObservations ?? [],
    career: horoscope?.themeInterpretationV2?.career,
    wealth: horoscope?.themeInterpretationV2?.wealth
  };
}

function buildMajorLifePeriodsSection(
  horoscope: Horoscope,
  _lifeThemes: LifeThemeReport
): MajorLifePeriodsSection {
  const mahadashas = horoscope.dashaInterpretation?.mahadashas ?? [];
  const periods: MajorLifePeriod[] = mahadashas.map((m: any) => {
    const focusHouses = m.natal?.ownedHouses ? [...m.natal.ownedHouses] : [];
    if (m.natal?.house && !focusHouses.includes(m.natal.house)) {
      focusHouses.push(m.natal.house);
    }
    focusHouses.sort((a, b) => a - b);

    return {
      planet: m.planet,
      start: m.start,
      end: m.end,
      primaryFocusHouses: focusHouses,
      keyThemes: [],
      confidence: m.confidence
    };
  });

  const status: AnalysisAvailability = mahadashas.length === 0 ? 'UNAVAILABLE' : 'AVAILABLE';

  return {
    status,
    periods
  };
}

function buildOverallSynthesisSection(chartSynthesis: ChartSynthesisReport): OverallSynthesisSection {
  return {
    status: 'AVAILABLE',
    overallConclusion: chartSynthesis.overallConclusion,
    overallConfidence: chartSynthesis.overallConfidence,
    strongestThemes: chartSynthesis.strongestThemes.map((t) => t.theme),
    challengedThemes: chartSynthesis.weakestThemes.map((t) => t.theme),
    mixedThemes: chartSynthesis.mixedThemes.map((t) => t.theme),
    repeatedSupportThemes: chartSynthesis.repeatedSupportThemes.map((t) => t.theme),
    timingDependentThemes: chartSynthesis.timingDependentThemes.map((t) => t.theme),
    keyObservations: chartSynthesis.keyObservations
  };
}

export function buildFullNatalAnalysis(input: FullNatalAnalysisInput): FullNatalAnalysisReport {
  validateInput(input);

  const report: FullNatalAnalysisReport = {
    version: 'P-21-v1',
    birthInformation: buildBirthInformationSection(input.horoscope),
    methodology: buildMethodologySection(),
    executiveSummary: buildExecutiveSummarySection(input.chartSynthesis),
    ascendant: buildAscendantSection(input.horoscope),
    planets: buildPlanetAnalysisSection(input.horoscope),
    houses: buildHouseAnalysisSection(input.horoscope),
    functionalRoles: buildFunctionalRolesSection(input.horoscope),
    yogas: buildYogasSection(input.horoscope),
    planetaryStrength: buildPlanetaryStrengthSection(input.horoscope),
    d9: buildD9Section(input.horoscope),
    d10: buildD10Section(input.horoscope),
    vimshottari: buildVimshottariSection(input.horoscope),
    currentDasha: buildCurrentDashaSection(input.horoscope),
    currentTransit: buildCurrentTransitSection(),
    lifeThemes: buildLifeThemesSection(input.lifeThemes, input.chartSynthesis, input.horoscope),
    majorLifePeriods: buildMajorLifePeriodsSection(input.horoscope, input.lifeThemes),
    overallSynthesis: buildOverallSynthesisSection(input.chartSynthesis)
  };

  return deepFreeze(report);
}
