/**
 * P-19 Life Themes Engine
 * Architecture Guard:
 * READ-ONLY SYNTHESIS LAYER.
 * MUST NOT recalculate any astrology (no new Yoga/Drishti/D9/D10/Shadbala/functional-nature).
 * MUST NOT predict, score, rank, or time events.
 * MUST ONLY aggregate evidence already produced by upstream reports.
 */

import { Planet } from '../../types';
import { InterpretationConfidence } from '../planetInterpretation/planetInterpretationTypes';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { YogaStrengthLevel } from '../yoga/yogaTypes';
import { DashaInterpretationEvidence } from '../dashaInterpretation/dashaInterpretationTypes';
import {
  LifeTheme,
  LifeThemeAnalysis,
  LifeThemeEvidence,
  LifeThemeEvidenceEffect,
  LifeThemeEvidenceSource,
  LifeThemeInput,
  LifeThemeReport
} from './lifeThemeTypes';
import { LIFE_THEME_METADATA, getThemesForHouse } from './lifeThemeMetadata';

const SOURCE_ORDER: Record<LifeThemeEvidenceSource, number> = {
  DOMAIN_METADATA: 1,
  HOUSE_INTERPRETATION: 2,
  PLANET_INTERPRETATION: 3,
  FUNCTIONAL_ROLE: 4,
  NATAL_DRISHTI: 5,
  YOGA: 6,
  D9_INTERPRETATION: 7,
  D10_INTERPRETATION: 8,
  DASHA_INTERPRETATION: 9
};

function createThemeEvidence(params: {
  ruleId: string;
  source: LifeThemeEvidenceSource;
  theme: LifeTheme;
  statement: string;
  effect: LifeThemeEvidenceEffect;
  sourceReference?: string;
  planets?: readonly Planet[];
  houses?: readonly number[];
  varga?: 'D9' | 'D10';
  dashaLevel?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT';
  yogaStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  yogaStrength?: YogaStrengthLevel;
  functionalRole?: FunctionalRole;
}): LifeThemeEvidence {
  return Object.freeze({
    ruleId: params.ruleId,
    source: params.source,
    theme: params.theme,
    statement: params.statement,
    effect: params.effect,
    sourceReference: params.sourceReference,
    planets: params.planets ? Object.freeze([...params.planets]) : undefined,
    houses: params.houses ? Object.freeze([...params.houses]) : undefined,
    varga: params.varga,
    dashaLevel: params.dashaLevel,
    yogaStatus: params.yogaStatus,
    yogaStrength: params.yogaStrength,
    functionalRole: params.functionalRole
  });
}

function makeEvidenceKey(e: LifeThemeEvidence): string {
  const planetsKey = e.planets ? e.planets.join(',') : '';
  const housesKey = e.houses ? e.houses.join(',') : '';
  const vargaKey = e.varga ?? '';
  const srcRefKey = e.sourceReference ?? '';
  return `${e.theme}|${e.source}|${e.ruleId}|${planetsKey}|${housesKey}|${vargaKey}|${srcRefKey}`;
}

function sortEvidence(evidence: readonly LifeThemeEvidence[]): LifeThemeEvidence[] {
  return [...evidence].sort((a, b) => {
    const sourceDiff = SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source];
    if (sourceDiff !== 0) return sourceDiff;

    const houseA = a.houses && a.houses.length > 0 ? a.houses[0] : 0;
    const houseB = b.houses && b.houses.length > 0 ? b.houses[0] : 0;
    if (houseA !== houseB) return houseA - houseB;

    const planetA = a.planets && a.planets.length > 0 ? a.planets[0] : '';
    const planetB = b.planets && b.planets.length > 0 ? b.planets[0] : '';
    if (planetA !== planetB) return planetA.localeCompare(planetB);

    return a.ruleId.localeCompare(b.ruleId);
  });
}

function aggregateThemeEffect(evidence: readonly LifeThemeEvidence[]): LifeThemeEvidenceEffect {
  const nonNeutral = evidence.filter((e) => e.effect !== 'NEUTRAL');
  const hasSupport = nonNeutral.some((e) => e.effect === 'SUPPORT' || e.effect === 'MIXED');
  const hasChallenge = nonNeutral.some((e) => e.effect === 'CHALLENGE' || e.effect === 'MIXED');

  if (hasSupport && hasChallenge) return 'MIXED';
  if (hasSupport) return 'SUPPORT';
  if (hasChallenge) return 'CHALLENGE';
  return 'NEUTRAL';
}

function calculateThemeConfidence(evidence: readonly LifeThemeEvidence[]): InterpretationConfidence {
  const nonDomainSources = new Set(
    evidence.filter((e) => e.source !== 'DOMAIN_METADATA').map((e) => e.source)
  );
  if (nonDomainSources.size >= 2) return 'HIGH';
  if (nonDomainSources.size === 1) return 'MEDIUM';
  return 'LOW';
}

function calculateReportConfidence(themes: readonly LifeThemeAnalysis[]): InterpretationConfidence {
  if (themes.some((t) => t.confidence === 'HIGH')) return 'HIGH';
  if (themes.some((t) => t.confidence === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

function collectDashaEvidence(
  dashaReport: LifeThemeInput['dashaInterpretation'],
  rawEvidence: LifeThemeEvidence[]
): void {
  if (!dashaReport) return;

  const emitList = (
    evList: readonly DashaInterpretationEvidence[] | undefined,
    defaultLevel: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT',
    fallbackHouses?: readonly number[]
  ) => {
    if (!evList) return;
    for (const ev of evList) {
      if (!ev) continue;
      const houses =
        ev.houses && ev.houses.length > 0
          ? ev.houses
          : fallbackHouses && fallbackHouses.length > 0
          ? fallbackHouses
          : [];
      if (houses.length > 0) {
        const targetThemes = new Set<LifeTheme>();
        for (const h of houses) {
          getThemesForHouse(h).forEach((t) => targetThemes.add(t));
        }
        const level = ev.level ?? defaultLevel;
        for (const theme of targetThemes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'DASHA_INTERPRETATION',
              theme,
              statement: ev.statement,
              effect: ev.effect,
              sourceReference: ev.ruleId,
              planets: ev.planets,
              houses,
              dashaLevel: level
            })
          );
        }
      }
    }
  };

  if (dashaReport.mahadashas) {
    for (const md of dashaReport.mahadashas) {
      if (!md) continue;
      const mdFallbackHouses = md.natal?.house !== undefined ? [md.natal.house] : [];
      emitList(md.evidence, 'MAHADASHA', mdFallbackHouses);

      for (const ad of md.antardashas ?? []) {
        if (!ad) continue;
        const adFallbackHouses = ad.natal?.house !== undefined ? [ad.natal.house] : mdFallbackHouses;
        emitList(ad.evidence, 'ANTARDASHA', adFallbackHouses);

        if (ad.pairInterpretation?.relationshipEvidence) {
          emitList(
            ad.pairInterpretation.relationshipEvidence,
            'PAIR',
            ad.pairInterpretation.combinedHouseSet ?? adFallbackHouses
          );
        }

        for (const pd of ad.pratyantardashas ?? []) {
          if (!pd) continue;
          const pdFallbackHouses = pd.natal?.house !== undefined ? [pd.natal.house] : adFallbackHouses;
          emitList(pd.evidence, 'PRATYANTARDASHA', pdFallbackHouses);
        }
      }
    }
  }

  if (dashaReport.current) {
    const curr = dashaReport.current;
    emitList(curr.evidence, 'CURRENT');
    if (curr.mahadasha) {
      const mdFallback = curr.mahadasha.natal?.house !== undefined ? [curr.mahadasha.natal.house] : [];
      emitList(curr.mahadasha.evidence, 'MAHADASHA', mdFallback);
    }
    if (curr.antardasha) {
      const adFallback = curr.antardasha.natal?.house !== undefined ? [curr.antardasha.natal.house] : [];
      emitList(curr.antardasha.evidence, 'ANTARDASHA', adFallback);
      if (curr.antardasha.pairInterpretation?.relationshipEvidence) {
        emitList(
          curr.antardasha.pairInterpretation.relationshipEvidence,
          'PAIR',
          curr.antardasha.pairInterpretation.combinedHouseSet ?? adFallback
        );
      }
    }
    if (curr.pratyantardasha) {
      const pdFallback = curr.pratyantardasha.natal?.house !== undefined ? [curr.pratyantardasha.natal.house] : [];
      emitList(curr.pratyantardasha.evidence, 'PRATYANTARDASHA', pdFallback);
    }
  }
}

function validateInput(input: LifeThemeInput): void {
  if (!input || typeof input !== 'object') {
    throw new TypeError('lifeTheme input must not be null or undefined.');
  }

  const requiredFields: Array<keyof LifeThemeInput> = [
    'planetInterpretation',
    'houseInterpretation',
    'functionalRoles',
    'yogas',
    'natalGrahaDrishti',
    'dashaInterpretation',
    'divisionalInterpretation'
  ];

  for (const field of requiredFields) {
    if (!input[field]) {
      throw new TypeError(`lifeTheme input is missing required field: ${field}.`);
    }
  }
}

export function analyzeLifeThemes(input: LifeThemeInput): LifeThemeReport {
  validateInput(input);

  const rawEvidence: LifeThemeEvidence[] = [];

  // 1. Domain Metadata Evidence
  for (const meta of LIFE_THEME_METADATA) {
    rawEvidence.push(
      createThemeEvidence({
        ruleId: 'LIFE_THEME_DOMAIN_001',
        source: 'DOMAIN_METADATA',
        theme: meta.theme,
        statement: meta.description,
        effect: 'NEUTRAL',
        sourceReference: 'LIFE_THEME_DOMAIN_001',
        houses: meta.houses
      })
    );
  }

  // 2. House Interpretation Evidence
  if (input.houseInterpretation.houses) {
    for (const houseObj of Object.values(input.houseInterpretation.houses)) {
      if (!houseObj) continue;
      const houseNum = houseObj.house;
      const themes = getThemesForHouse(houseNum);
      for (const ev of houseObj.evidence ?? []) {
        for (const theme of themes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'HOUSE_INTERPRETATION',
              theme,
              statement: ev.statement,
              effect: ev.effect,
              sourceReference: ev.ruleId,
              planets: ev.planets,
              houses: ev.relatedHouses ? [houseNum, ...ev.relatedHouses] : [houseNum]
            })
          );
        }
      }
    }
  }

  // 3. Planet Interpretation Evidence
  if (input.planetInterpretation.planets) {
    for (const planetObj of Object.values(input.planetInterpretation.planets)) {
      if (!planetObj || !planetObj.placement) continue;
      const placementHouse = planetObj.placement.house;
      for (const ev of planetObj.evidence ?? []) {
        const targetHouses = ev.houses && ev.houses.length > 0 ? ev.houses : [placementHouse];
        const targetThemes = new Set<LifeTheme>();
        for (const h of targetHouses) {
          getThemesForHouse(h).forEach((t) => targetThemes.add(t));
        }
        for (const theme of targetThemes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'PLANET_INTERPRETATION',
              theme,
              statement: ev.statement,
              effect: ev.effect,
              sourceReference: ev.ruleId,
              planets: ev.relatedPlanets ? [planetObj.planet, ...ev.relatedPlanets] : [planetObj.planet],
              houses: targetHouses
            })
          );
        }
      }
    }
  }

  // 4. Functional Role Evidence
  if (input.functionalRoles.planets) {
    for (const roleObj of Object.values(input.functionalRoles.planets)) {
      if (!roleObj) continue;
      for (const ev of roleObj.evidence ?? []) {
        const targetHouses =
          ev.houses && ev.houses.length > 0 ? ev.houses : (roleObj.ownedHouses ?? []);
        const targetThemes = new Set<LifeTheme>();
        for (const h of targetHouses) {
          getThemesForHouse(h).forEach((t) => targetThemes.add(t));
        }
        for (const theme of targetThemes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'FUNCTIONAL_ROLE',
              theme,
              statement: ev.reason,
              effect: 'NEUTRAL',
              sourceReference: ev.ruleId,
              planets: [roleObj.planet],
              houses: targetHouses,
              functionalRole: ev.role ?? roleObj.roles?.[0]
            })
          );
        }
      }
    }
  }

  // 5. Yoga Evidence
  if (input.yogas.yogas) {
    for (const yoga of input.yogas.yogas) {
      if (!yoga) continue;
      const targetHouses = (yoga.houses ?? []).filter((h): h is number => typeof h === 'number');
      const targetThemes = new Set<LifeTheme>();
      for (const h of targetHouses) {
        getThemesForHouse(h).forEach((t) => targetThemes.add(t));
      }
      const statusStr = yoga.assessment?.finalStatus ?? yoga.strength;
      const upperStatus = String(statusStr ?? '').toUpperCase();
      let effect: LifeThemeEvidenceEffect = 'NEUTRAL';
      if (upperStatus === 'STRONG' || upperStatus === 'PRESENT' || upperStatus === 'ACTIVE') {
        effect = 'SUPPORT';
      } else if (upperStatus === 'WEAKENED') {
        effect = 'CHALLENGE';
      } else if (upperStatus === 'CANCELLED') {
        effect = 'NEUTRAL';
      } else {
        effect = 'SUPPORT';
      }

      const yogaStatus = yoga.assessment?.finalStatus ?? (
        upperStatus === 'STRONG' ? 'STRONG' :
        upperStatus === 'WEAKENED' ? 'WEAKENED' :
        upperStatus === 'CANCELLED' ? 'CANCELLED' :
        'PRESENT'
      );

      const yogaName = /yoga$/i.test(yoga.type.trim()) ? yoga.type.trim() : `${yoga.type} Yoga`;
      const statement = `${yogaName} (${statusStr}): participating planets ${yoga.planets.join(', ')} in houses ${targetHouses.join(', ')}.`;
      for (const theme of targetThemes) {
        rawEvidence.push(
          createThemeEvidence({
            ruleId: `YOGA_${yoga.type}`,
            source: 'YOGA',
            theme,
            statement,
            effect,
            sourceReference: `YOGA_${yoga.type}`,
            planets: yoga.planets,
            houses: targetHouses,
            yogaStatus,
            yogaStrength: yoga.assessment?.strength
          })
        );
      }
    }
  }

  // 6. Natal Graha Drishti Evidence
  if (input.natalGrahaDrishti.aspects) {
    for (const aspect of input.natalGrahaDrishti.aspects) {
      if (!aspect) continue;
      const targetHouse = aspect.targetHouse;
      const themes = getThemesForHouse(targetHouse);
      for (const theme of themes) {
        rawEvidence.push(
          createThemeEvidence({
            ruleId: `NATAL_DRISHTI_${aspect.sourcePlanet}_H${aspect.targetHouse}`,
            source: 'NATAL_DRISHTI',
            theme,
            statement: aspect.description ?? aspect.reason,
            effect: 'NEUTRAL',
            sourceReference: aspect.reason,
            planets: [aspect.sourcePlanet, aspect.targetPlanet],
            houses: [aspect.targetHouse]
          })
        );
      }
    }
  }

  // 7. Divisional Interpretation Evidence (D9 and D10)
  const d9Report = input.divisionalInterpretation?.d9;
  if (d9Report) {
    const d9Evidences = [
      ...(d9Report.evidence ?? []),
      ...Object.values(d9Report.houses ?? {}).flatMap((h) => h.evidence ?? []),
      ...Object.values(d9Report.planets ?? {}).flatMap((p) => p.evidence ?? [])
    ];
    for (const ev of d9Evidences) {
      const house =
        ev.house ??
        ev.relatedHouses?.[0] ??
        (ev.planet ? d9Report.planets[ev.planet]?.house : undefined);
      if (house !== undefined) {
        const themes = getThemesForHouse(house, 'D9');
        for (const theme of themes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'D9_INTERPRETATION',
              theme,
              statement: ev.statement,
              effect: ev.effect,
              sourceReference: ev.ruleId,
              planets: ev.planet ? [ev.planet] : ev.relatedPlanets,
              houses: [house],
              varga: 'D9'
            })
          );
        }
      }
    }
  }

  const d10Report = input.divisionalInterpretation?.d10;
  if (d10Report) {
    const d10Evidences = [
      ...(d10Report.evidence ?? []),
      ...Object.values(d10Report.houses ?? {}).flatMap((h) => h.evidence ?? []),
      ...Object.values(d10Report.planets ?? {}).flatMap((p) => p.evidence ?? [])
    ];
    for (const ev of d10Evidences) {
      const house =
        ev.house ??
        ev.relatedHouses?.[0] ??
        (ev.planet ? d10Report.planets[ev.planet]?.house : undefined);
      if (house !== undefined) {
        const themes = getThemesForHouse(house, 'D10');
        for (const theme of themes) {
          rawEvidence.push(
            createThemeEvidence({
              ruleId: ev.ruleId,
              source: 'D10_INTERPRETATION',
              theme,
              statement: ev.statement,
              effect: ev.effect,
              sourceReference: ev.ruleId,
              planets: ev.planet ? [ev.planet] : ev.relatedPlanets,
              houses: [house],
              varga: 'D10'
            })
          );
        }
      }
    }
  }

  // 8. Dasha Interpretation Evidence
  collectDashaEvidence(input.dashaInterpretation, rawEvidence);

  // Group evidence by theme and deduplicate
  const themeEvidenceMap = new Map<LifeTheme, LifeThemeEvidence[]>();
  for (const themeMeta of LIFE_THEME_METADATA) {
    themeEvidenceMap.set(themeMeta.theme, []);
  }

  const seenKeys = new Set<string>();
  for (const ev of rawEvidence) {
    const key = makeEvidenceKey(ev);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const list = themeEvidenceMap.get(ev.theme);
      if (list) {
        list.push(ev);
      }
    }
  }

  // Build Theme Analysis objects
  const themeAnalyses: LifeThemeAnalysis[] = [];
  for (const meta of LIFE_THEME_METADATA) {
    const rawList = themeEvidenceMap.get(meta.theme) ?? [];
    const sortedList = sortEvidence(rawList);
    const frozenEvidenceList = Object.freeze(sortedList);
    const effect = aggregateThemeEffect(sortedList);
    const confidence = calculateThemeConfidence(sortedList);

    const analysis: LifeThemeAnalysis = Object.freeze({
      theme: meta.theme,
      label: meta.label,
      description: meta.description,
      effect,
      confidence,
      evidenceCount: sortedList.length,
      evidence: frozenEvidenceList
    });

    themeAnalyses.push(analysis);
  }

  const frozenThemes = Object.freeze(themeAnalyses);
  const reportConfidence = calculateReportConfidence(themeAnalyses);

  return Object.freeze({
    themes: frozenThemes,
    confidence: reportConfidence
  });
}
