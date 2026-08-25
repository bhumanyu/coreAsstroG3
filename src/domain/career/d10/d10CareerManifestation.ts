import type { Horoscope } from '../../../types';
import { Planet } from '../../../types';
import type { CareerManifestationMode } from '../careerTypes';
import type { D10ManifestationFactor } from './d10CareerManifestationTypes';
import { D10_MANIFESTATION_MODE_RULES } from './d10CareerManifestationRules';

export function getD10ManifestationFactors(
  mode: CareerManifestationMode,
  horoscope: Horoscope
): readonly D10ManifestationFactor[] {
  const d10 = horoscope.divisionalInterpretation?.d10;
  if (!d10 || !d10.planets) {
    return Object.freeze([]);
  }

  const ruleConfig = D10_MANIFESTATION_MODE_RULES[mode];
  if (!ruleConfig) {
    return Object.freeze([]);
  }

  const factors: D10ManifestationFactor[] = [];
  const d1Comparisons = horoscope.divisionalInterpretation?.d1Comparisons;

  // 1. Evaluate D10 10th House and 10th Lord condition for leadership/authority/management
  const d10TenthHouse = d10.houses?.find((h: { house: number }) => h.house === 10);
  const d10TenthLord = d10TenthHouse?.lord ?? d10.houseLords?.[10];

  if (d10TenthLord && (mode === 'LEADERSHIP' || mode === 'AUTHORITY' || mode === 'MANAGEMENT')) {
    const lordInfo = d10.planets[d10TenthLord];
    if (lordInfo) {
      if (lordInfo.dignity === 'EXALTED' || lordInfo.dignity === 'OWN_SIGN') {
        factors.push({
          id: `D10_${mode}_10L_STRONG`,
          mode,
          direction: 'SUPPORT',
          weight: 1.5,
          planet: d10TenthLord,
          house: lordInfo.house,
          statement: `D10 10th lord (${d10TenthLord}) is dignified (${lordInfo.dignity}) in D10, supporting ${mode.toLowerCase().replace(/_/g, ' ')}.`,
          evidenceIds: [`D10_10L_${d10TenthLord}_DIGNITY`]
        });
      } else if (lordInfo.dignity === 'DEBILITATED') {
        factors.push({
          id: `D10_${mode}_10L_DEBILITATED`,
          mode,
          direction: 'CHALLENGE',
          weight: 1.0,
          planet: d10TenthLord,
          house: lordInfo.house,
          statement: `D10 10th lord (${d10TenthLord}) is debilitated in D10, challenging ${mode.toLowerCase().replace(/_/g, ' ')}.`,
          evidenceIds: [`D10_10L_${d10TenthLord}_DEBILITATED`]
        });
      }
    }
  }

  // 2. Evaluate Primary Significator Planets in D10 for this Mode
  for (const planet of ruleConfig.primaryPlanets) {
    const planetInfo = d10.planets[planet];
    if (!planetInfo) continue;

    const isVargottama = d1Comparisons?.[planet]?.isD10Vargottama ?? false;
    const isExaltedOrOwn = planetInfo.dignity === 'EXALTED' || planetInfo.dignity === 'OWN_SIGN';
    const isDebilitated = planetInfo.dignity === 'DEBILITATED';
    const house = planetInfo.house;

    const isSupportingHouse = ruleConfig.supportingHouses.includes(house);
    const isChallengingHouse = ruleConfig.challengingHouses.includes(house);

    if (isExaltedOrOwn || (isSupportingHouse && !isDebilitated)) {
      const weight = isExaltedOrOwn && isSupportingHouse ? 1.5 : 1.0;
      factors.push({
        id: `D10_${mode}_${planet}_SUPPORT`,
        mode,
        direction: 'SUPPORT',
        weight: isVargottama ? weight + 0.5 : weight,
        planet,
        house,
        statement: `D10 ${planet} in house ${house}${planetInfo.dignity ? ` (${planetInfo.dignity})` : ''}${isVargottama ? ' [D10 Vargottama]' : ''} supports ${mode.toLowerCase().replace(/_/g, ' ')}.`,
        evidenceIds: [`D10_${planet}_PLACEMENT`]
      });
    } else if (isDebilitated || isChallengingHouse) {
      factors.push({
        id: `D10_${mode}_${planet}_CHALLENGE`,
        mode,
        direction: 'CHALLENGE',
        weight: 1.0,
        planet,
        house,
        statement: `D10 ${planet} in house ${house}${planetInfo.dignity ? ` (${planetInfo.dignity})` : ''} restricts ${mode.toLowerCase().replace(/_/g, ' ')}.`,
        evidenceIds: [`D10_${planet}_CHALLENGE`]
      });
    }
  }

  return Object.freeze(factors);
}

export function getAllD10ManifestationFactors(
  horoscope: Horoscope
): readonly D10ManifestationFactor[] {
  const modes: readonly CareerManifestationMode[] = [
    'LEADERSHIP',
    'MANAGEMENT',
    'TECHNICAL_SPECIALIZATION',
    'SERVICE_EMPLOYMENT',
    'AUTHORITY',
    'INDEPENDENT_WORK',
    'BUSINESS_ENTREPRENEURSHIP'
  ];

  const allFactors: D10ManifestationFactor[] = [];
  for (const mode of modes) {
    const factors = getD10ManifestationFactors(mode, horoscope);
    allFactors.push(...factors);
  }

  return Object.freeze(allFactors);
}
