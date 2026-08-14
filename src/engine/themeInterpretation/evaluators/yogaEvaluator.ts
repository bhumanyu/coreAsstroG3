import type { ThemeInterpretationContext } from '../themeInterpretationContext';
import type { ThemeEvidenceEffect, ThemeEvidenceStrength, ThemeEvidenceFactor } from '../themeInterpretationTypes';
import { Planet } from '../../../types';
import { getHouseLord } from '../themeInterpretationUtils';

export interface YogaEvaluationFacts {
  readonly yogaType: string;
  readonly category: string;
  readonly finalStatus: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  readonly strength: ThemeEvidenceStrength;
  readonly effect: ThemeEvidenceEffect;
  readonly statement: string;
  readonly factors: readonly ThemeEvidenceFactor[];
  readonly planets: readonly Planet[];
}

export function evaluateCareerYogas(
  context: ThemeInterpretationContext
): readonly YogaEvaluationFacts[] {
  const results: YogaEvaluationFacts[] = [];

  if (!context.yogas?.yogas || context.yogas.yogas.length === 0) {
    return Object.freeze([]);
  }

  const careerCategories = new Set(['RAJA', 'DHANA', 'MAHAPURUSHA', 'PROSPERITY', 'STATUS', 'KARMA']);
  const careerHouses = new Set([10, 6, 11, 2, 1]);
  const careerKarakas = new Set([Planet.SUN, Planet.SATURN, Planet.MERCURY, Planet.MARS, Planet.JUPITER]);

  const l10 = getHouseLord(context, 10);
  const l1 = getHouseLord(context, 1);

  for (const yoga of context.yogas.yogas) {
    const catStr = String(yoga.category || '').toUpperCase();
    const isCareerCategory = careerCategories.has(catStr);

    const yogaHouses: number[] = [];
    if (yoga.houses) {
      yoga.houses.forEach((h) => {
        if (typeof h === 'number') yogaHouses.push(h);
      });
    }
    if (yoga.evidence) {
      yoga.evidence.forEach((e) => {
        if (e.houses) {
          e.houses.forEach((h) => {
            if (typeof h === 'number') yogaHouses.push(h);
          });
        }
        if (typeof e.house === 'number') yogaHouses.push(e.house);
      });
    }

    const touchesCareerHouse = yogaHouses.some((h) => careerHouses.has(h));

    const yogaPlanets = yoga.planets || [];
    const touchesCareerPlanet = yogaPlanets.some(
      (p) => p === l10 || p === l1 || careerKarakas.has(p)
    );

    const isCareerRelevant = isCareerCategory || touchesCareerHouse || touchesCareerPlanet;

    if (!isCareerRelevant) continue;

    const finalStatus = yoga.assessment?.finalStatus || (yoga as any).finalStatus || 'PRESENT';

    if (finalStatus === 'CANCELLED') continue;

    let effect: ThemeEvidenceEffect = 'SUPPORT';
    let strength: ThemeEvidenceStrength = 'MODERATE';

    if (finalStatus === 'STRONG' || yoga.assessment?.strength === 'STRONG' || yoga.assessment?.strength === 'VERY_STRONG') {
      strength = 'STRONG';
      effect = 'SUPPORT';
    } else if (finalStatus === 'WEAKENED' || yoga.assessment?.strength === 'WEAK' || yoga.assessment?.strength === 'VERY_WEAK') {
      strength = 'WEAK';
      effect = 'SUPPORT';
    }

    const factors: ThemeEvidenceFactor[] = [
      {
        label: 'Yoga Type',
        value: yoga.type,
        role: 'PRIMARY'
      },
      {
        label: 'Category',
        value: yoga.category || 'General',
        role: 'PRIMARY'
      },
      {
        label: 'Final Status',
        value: finalStatus,
        role: 'CONFIRMATION'
      }
    ];

    results.push(
      Object.freeze({
        yogaType: yoga.type,
        category: yoga.category || 'Career',
        finalStatus: finalStatus as 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED',
        strength,
        effect,
        statement: `${yoga.type} (${yoga.category || 'Yoga'}) is evaluated as ${finalStatus}, providing confirmatory ${effect.toLowerCase()} for career and status.`,
        factors: Object.freeze(factors),
        planets: Object.freeze(yoga.planets ? [...yoga.planets] : [])
      })
    );
  }

  return Object.freeze(results);
}
