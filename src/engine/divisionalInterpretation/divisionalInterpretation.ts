import {
  Planet,
  Sign,
  ChartType,
  Chart,
  DignityStatus
} from '../../types';
import { resolveHouseLords } from '../houseLordship/houseLordship';
import { House } from '../houseLordship/houseGroups';
import { calculateDignity } from '../planetaryDignity';
import { calculateSign, calculateWholeSignHouse } from '../chartMath';
import { SIGNS_ORDER, SIGNS_METADATA } from '../../data/astroData';

import {
  DivisionalInterpretationInput,
  DivisionalInterpretationReport,
  DivisionalChartInterpretation,
  DivisionalPlanetInterpretation,
  DivisionalHouseInterpretation,
  DivisionalDomainMetadata,
  D1DivisionalComparison,
  DivisionalInterpretationEvidence,
  D1PlanetAnchor,
  D9_DOMAIN_METADATA,
  D10_DOMAIN_METADATA
} from './divisionalInterpretationTypes';
import { InterpretationConfidence } from '../planetInterpretation/planetInterpretationTypes';

function validateChartAscendant(chart: Chart, label: string): void {
  const c = chart as any;
  if (
    typeof c.ascendantLongitude !== 'number' ||
    !Number.isFinite(c.ascendantLongitude) ||
    c.ascendantLongitude < 0 ||
    c.ascendantLongitude >= 360
  ) {
    throw new TypeError(`${label} has invalid ascendantLongitude.`);
  }
  if (!Object.values(Sign).includes(c.ascendantSign)) {
    throw new TypeError(`${label} has invalid ascendantSign.`);
  }
}

export function analyzeDivisionalInterpretation(
  input: DivisionalInterpretationInput
): DivisionalInterpretationReport {
  if (!input) {
    throw new TypeError('Divisional interpretation input must not be null or undefined.');
  }

  const requiredProps: Array<keyof DivisionalInterpretationInput> = [
    'd1Chart',
    'd9Chart',
    'd10Chart',
    'planetFacts',
    'planetInterpretation',
    'functionalRoles'
  ];

  for (const prop of requiredProps) {
    if (!input[prop]) {
      throw new TypeError(`Divisional interpretation input is missing required property: ${prop}.`);
    }
  }

  if ((input.d1Chart as any).type !== ChartType.RASI && (input.d1Chart as any).chartType !== ChartType.RASI) {
    throw new TypeError('Invalid d1Chart chartType. Expected RASI.');
  }
  if ((input.d9Chart as any).type !== ChartType.NAVAMSA && (input.d9Chart as any).chartType !== ChartType.NAVAMSA) {
    throw new TypeError('Invalid d9Chart chartType. Expected NAVAMSA.');
  }
  if ((input.d10Chart as any).type !== ChartType.DASAMSA && (input.d10Chart as any).chartType !== ChartType.DASAMSA) {
    throw new TypeError('Invalid d10Chart chartType. Expected DASAMSA.');
  }

  validateChartAscendant(input.d1Chart, 'd1Chart');
  validateChartAscendant(input.d9Chart, 'd9Chart');
  validateChartAscendant(input.d10Chart, 'd10Chart');

  const allPlanets = Object.values(Planet);

  // Validate planet positions
  for (const p of allPlanets) {
    if (!input.planetFacts[p]) {
      throw new TypeError(`planetFacts is missing required planet: ${p}.`);
    }

    if (!input.d9Chart.positions || !input.d9Chart.positions[p]) {
      throw new TypeError(`d9Chart is missing required planet: ${p}.`);
    }
    const d9Lon = input.d9Chart.positions[p].eclipticLongitude;
    if (typeof d9Lon !== 'number' || !Number.isFinite(d9Lon) || d9Lon < 0 || d9Lon >= 360) {
      throw new TypeError(`d9Chart has invalid eclipticLongitude for ${p}.`);
    }

    if (!input.d10Chart.positions || !input.d10Chart.positions[p]) {
      throw new TypeError(`d10Chart is missing required planet: ${p}.`);
    }
    const d10Lon = input.d10Chart.positions[p].eclipticLongitude;
    if (typeof d10Lon !== 'number' || !Number.isFinite(d10Lon) || d10Lon < 0 || d10Lon >= 360) {
      throw new TypeError(`d10Chart has invalid eclipticLongitude for ${p}.`);
    }
  }

  const d9Interpretation = analyzeVarga(input.d9Chart, 'D9', input);
  const d10Interpretation = analyzeVarga(input.d10Chart, 'D10', input);

  // Build D1 Comparisons
  const comparisonsMap: Record<string, D1DivisionalComparison> = {};
  for (const p of allPlanets) {
    const d1Fact = input.planetFacts[p];
    const d1Sign = d1Fact?.sign ?? d1Fact?.position?.sign;
    const d1House = d1Fact?.house ?? d1Fact?.position?.house;
    const d9Planet = d9Interpretation.planets[p];
    const d10Planet = d10Interpretation.planets[p];

    const isD9Vargottama = d1Sign === d9Planet.sign;
    const isD10Vargottama = d1Sign === d10Planet.sign;
    const compEvidence: DivisionalInterpretationEvidence[] = [];

    if (isD9Vargottama) {
      compEvidence.push(
        Object.freeze({
          ruleId: 'D9_VARGOTTAMA_001',
          type: 'D1_COMPARISON',
          varga: 'D9',
          planet: p,
          statement: `${p} is Vargottama (same sign ${d1Sign} in D1 and D9).`,
          effect: 'NEUTRAL',
          source: 'DIVISIONAL_COMPARISON'
        })
      );
    }

    const d1d9Stmt =
      d1Sign === d9Planet.sign
        ? `D1 ${p} and D9 ${p} are both in ${d1Sign}.`
        : `D1 ${p} in ${d1Sign} (House ${d1House}) and D9 ${p} in ${d9Planet.sign} (House ${d9Planet.house}).`;

    compEvidence.push(
      Object.freeze({
        ruleId: 'D1_D9_COMPARISON_001',
        type: 'D1_COMPARISON',
        varga: 'D9',
        planet: p,
        statement: d1d9Stmt,
        effect: 'NEUTRAL',
        source: 'DIVISIONAL_COMPARISON'
      })
    );

    const d1d10Stmt =
      d1Sign === d10Planet.sign
        ? `D1 ${p} and D10 ${p} are both in ${d1Sign}.`
        : `D1 ${p} in ${d1Sign} (House ${d1House}) and D10 ${p} in ${d10Planet.sign} (House ${d10Planet.house}).`;

    compEvidence.push(
      Object.freeze({
        ruleId: 'D1_D10_COMPARISON_001',
        type: 'D1_COMPARISON',
        varga: 'D10',
        planet: p,
        statement: d1d10Stmt,
        effect: 'NEUTRAL',
        source: 'DIVISIONAL_COMPARISON'
      })
    );

    comparisonsMap[p] = Object.freeze({
      planet: p,
      d1: Object.freeze({ sign: d1Sign, house: d1House }),
      d9: Object.freeze({ sign: d9Planet.sign, house: d9Planet.house }),
      d10: Object.freeze({ sign: d10Planet.sign, house: d10Planet.house }),
      isD9Vargottama,
      isD10Vargottama,
      evidence: Object.freeze(compEvidence)
    });
  }

  let overallConfidence: InterpretationConfidence = 'HIGH';
  if (d9Interpretation.confidence === 'MEDIUM' || d10Interpretation.confidence === 'MEDIUM') {
    overallConfidence = 'MEDIUM';
  }
  if (d9Interpretation.confidence === 'LOW' || d10Interpretation.confidence === 'LOW') {
    overallConfidence = 'LOW';
  }

  return Object.freeze({
    d9: d9Interpretation,
    d10: d10Interpretation,
    d1Comparisons: Object.freeze(comparisonsMap) as Readonly<Record<Planet, D1DivisionalComparison>>,
    confidence: overallConfidence
  });
}

function analyzeVarga(
  chart: Chart,
  varga: 'D9' | 'D10',
  input: DivisionalInterpretationInput
): DivisionalChartInterpretation {
  const allPlanets = Object.values(Planet);
  const c = chart as any;
  const ascSign = c.ascendantSign ?? c.ascendant?.sign;
  const ascLon = c.ascendantLongitude ?? c.ascendant?.longitude;

  const chartEvidence: DivisionalInterpretationEvidence[] = [];

  // Ascendant evidence
  const ascEvidence: DivisionalInterpretationEvidence = Object.freeze({
    ruleId: `${varga}_ASCENDANT_001`,
    type: 'ASCENDANT',
    varga,
    house: 1,
    statement: `${varga} Ascendant is in ${ascSign}.`,
    effect: 'NEUTRAL',
    source: 'DIVISIONAL_CHARTS'
  });
  chartEvidence.push(ascEvidence);

  const houseLords = resolveHouseLords(ascSign);

  // Compute Planet Interpretations
  const planetInterpretations: Record<string, DivisionalPlanetInterpretation> = {};
  const planetHouseMap: Record<Planet, number> = {} as Record<Planet, number>;

  let vargaConfidence: InterpretationConfidence = 'HIGH';

  for (const p of allPlanets) {
    const pos = c.positions?.[p] ?? c.planetFacts?.[p]?.position ?? {};
    const lon = pos.eclipticLongitude ?? pos.longitude ?? 0;
    const sign = calculateSign(lon);
    const house = calculateWholeSignHouse(ascSign, sign);
    planetHouseMap[p] = house;

    const degreeInSign = lon % 30;
    const dignityResult = calculateDignity(p, sign, degreeInSign);
    const dignity = dignityResult?.status ?? DignityStatus.NEUTRAL;

    const retrograde = pos.motion ? Boolean(pos.motion.retrograde) : false;

    // Build D1 Anchor
    // P-18 uses planetFacts as the canonical raw D1 positional anchor (sign/house/dignity) and planetInterpretation only for already-established D1 interpretation metadata (strength.availability).
    const d1Facts = input.planetFacts[p];
    const d1Roles = input.functionalRoles?.planets?.[p]?.roles ?? [];
    const d1StrengthAvail =
      input.planetInterpretation?.planets?.[p]?.strength?.availability ?? 'INCOMPLETE';

    if (d1StrengthAvail === 'INCOMPLETE') {
      vargaConfidence = 'MEDIUM';
    }

    const d1Anchor: D1PlanetAnchor = Object.freeze({
      sign: d1Facts?.sign ?? d1Facts?.position?.sign ?? Sign.ARIES,
      house: d1Facts?.house ?? d1Facts?.position?.house ?? 1,
      dignity: d1Facts?.dignity?.status ?? DignityStatus.NEUTRAL,
      functionalRoles: Object.freeze([...d1Roles]),
      strengthAvailability: d1StrengthAvail
    });

    const planetEvidenceList: DivisionalInterpretationEvidence[] = [];

    // 1. SIGN_PLACEMENT
    const signEvidence: DivisionalInterpretationEvidence = Object.freeze({
      ruleId: `${varga}_PLANET_PLACEMENT_001`,
      type: 'SIGN_PLACEMENT',
      varga,
      planet: p,
      statement: `${varga} ${p} is in ${sign}.`,
      effect: 'NEUTRAL',
      source: 'DIVISIONAL_CHARTS'
    });
    planetEvidenceList.push(signEvidence);

    // 2. HOUSE_PLACEMENT
    const houseEvidence: DivisionalInterpretationEvidence = Object.freeze({
      ruleId: `${varga}_HOUSE_PLACEMENT_001`,
      type: 'HOUSE_PLACEMENT',
      varga,
      planet: p,
      house,
      statement: `${varga} ${p} occupies ${varga} House ${house}.`,
      effect: 'NEUTRAL',
      source: 'DIVISIONAL_CHARTS'
    });
    planetEvidenceList.push(houseEvidence);

    // 3. DIGNITY
    let dignityEffect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
    if (
      dignity === DignityStatus.EXALTED ||
      dignity === DignityStatus.OWN_SIGN ||
      dignity === DignityStatus.MOOLATRIKONA
    ) {
      dignityEffect = 'SUPPORT';
    } else if (dignity === DignityStatus.DEBILITATED) {
      dignityEffect = 'CHALLENGE';
    }

    const dignityEvidence: DivisionalInterpretationEvidence = Object.freeze({
      ruleId: `${varga}_DIGNITY_001`,
      type: 'DIGNITY',
      varga,
      planet: p,
      statement: `${varga} ${p} is ${(dignity ?? DignityStatus.NEUTRAL).toLowerCase().replace('_', ' ')} in ${sign}.`,
      effect: dignityEffect,
      source: 'DIVISIONAL_CHARTS'
    });
    planetEvidenceList.push(dignityEvidence);

    chartEvidence.push(...planetEvidenceList);

    planetInterpretations[p] = Object.freeze({
      planet: p,
      sign,
      house,
      eclipticLongitude: pos.eclipticLongitude ?? pos.longitude ?? 0,
      dignity,
      retrograde,
      d1Anchor,
      evidence: Object.freeze(planetEvidenceList)
    });
  }

  // Compute House Interpretations
  const houseInterpretations: DivisionalHouseInterpretation[] = [];
  const ascSignIndex = (SIGNS_METADATA[ascSign as Sign]?.number ?? 1) - 1;

  for (let h = 1; h <= 12; h++) {
    const houseSign = SIGNS_ORDER[(ascSignIndex + h - 1) % 12];
    const houseNum = h as House;
    const lord = houseLords[houseNum];

    const occupants = allPlanets.filter((p) => planetHouseMap[p] === h);
    const houseEvidenceList: DivisionalInterpretationEvidence[] = [];

    // HOUSE_LORD
    const lordEvidence: DivisionalInterpretationEvidence = Object.freeze({
      ruleId: `${varga}_HOUSE_LORD_001`,
      type: 'HOUSE_LORD',
      varga,
      house: h,
      planet: lord,
      statement: `${varga} House ${h} is ruled by ${lord}.`,
      effect: 'NEUTRAL',
      source: 'DIVISIONAL_CHARTS'
    });
    houseEvidenceList.push(lordEvidence);

    // HOUSE_LORD_PLACEMENT
    if (lord) {
      const lordHouse = planetHouseMap[lord];
      const lordPlacementEvidence: DivisionalInterpretationEvidence = Object.freeze({
        ruleId: `${varga}_HOUSE_LORD_PLACEMENT_001`,
        type: 'HOUSE_LORD_PLACEMENT',
        varga,
        house: h,
        planet: lord,
        relatedHouses: Object.freeze([lordHouse]),
        statement: `${varga} House ${h} lord ${lord} occupies ${varga} House ${lordHouse}.`,
        effect: 'NEUTRAL',
        source: 'DIVISIONAL_CHARTS'
      });
      houseEvidenceList.push(lordPlacementEvidence);
    }

    // OCCUPANTS
    for (const occ of occupants) {
      const occEvidence: DivisionalInterpretationEvidence = Object.freeze({
        ruleId: `${varga}_OCCUPANT_001`,
        type: 'OCCUPANT',
        varga,
        house: h,
        planet: occ,
        statement: `${varga} House ${h} is occupied by ${occ}.`,
        effect: 'NEUTRAL',
        source: 'DIVISIONAL_CHARTS'
      });
      houseEvidenceList.push(occEvidence);
    }

    chartEvidence.push(...houseEvidenceList);

    houseInterpretations.push(
      Object.freeze({
        house: h,
        sign: houseSign,
        lord,
        occupants: Object.freeze([...occupants]),
        evidence: Object.freeze(houseEvidenceList)
      })
    );
  }

  // Domain Metadata
  const domainMetadataMap: Record<number, DivisionalDomainMetadata> = {};
  const domainSourceMap = varga === 'D9' ? D9_DOMAIN_METADATA : D10_DOMAIN_METADATA;

  for (let h = 1; h <= 12; h++) {
    const domains = domainSourceMap[h];
    const metaObj: DivisionalDomainMetadata = Object.freeze({
      varga,
      house: h,
      domains: Object.freeze([...domains]),
      source: 'DOMAIN_METADATA'
    });
    domainMetadataMap[h] = metaObj;

    const domainEvidence: DivisionalInterpretationEvidence = Object.freeze({
      ruleId: `${varga}_DOMAIN_METADATA_001`,
      type: 'DOMAIN_METADATA',
      varga,
      house: h,
      statement: `${varga} House ${h} represents ${domains.join(', ')}.`,
      effect: 'NEUTRAL',
      source: 'DOMAIN_METADATA'
    });
    chartEvidence.push(domainEvidence);
  }

  const chartType = varga === 'D9' ? ChartType.NAVAMSA : ChartType.DASAMSA;

  return Object.freeze({
    varga,
    chartType,
    ascendant: Object.freeze({ sign: ascSign, eclipticLongitude: ascLon }),
    houseLords: Object.freeze({ ...houseLords }),
    planets: Object.freeze(planetInterpretations) as Readonly<Record<Planet, DivisionalPlanetInterpretation>>,
    houses: Object.freeze([...houseInterpretations]),
    domainMetadata: Object.freeze(domainMetadataMap),
    yogasAvailability: 'NOT_CALCULATED',
    evidence: Object.freeze(chartEvidence),
    confidence: vargaConfidence
  });
}
