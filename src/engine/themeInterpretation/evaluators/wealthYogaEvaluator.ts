import type { ThemeInterpretationContext } from '../themeInterpretationContext';
import type { ThemeEvidenceEffect, ThemeEvidenceStrength, ThemeEvidenceFactor } from '../themeInterpretationTypes';
import { Planet } from '../../../types';
import { getHouseLord } from '../themeInterpretationUtils';
import type { YogaEvaluationFacts } from './yogaEvaluator';

export function evaluateWealthYogas(
  context: ThemeInterpretationContext
): readonly YogaEvaluationFacts[] {
  const results: YogaEvaluationFacts[] = [];

  if (!context.yogas?.yogas || context.yogas.yogas.length === 0) {
    return Object.freeze([]);
  }

  const wealthCategories = new Set([
    'DHANA',
    'LAKSHMI',
    'PROSPERITY',
    'CHANDRA_MANGALA',
    'VASUMATHI',
    'AMLA'
  ]);
  const coreWealthHouses = new Set([2, 11]);
  // 5H/9H provide supporting context only and do not by themselves auto-qualify an arbitrary yoga as wealth confirmation
  const wealthHouses = new Set([2, 11, 9, 5]);

  const l2 = getHouseLord(context, 2);
  const l11 = getHouseLord(context, 11);
  const wealthLords = new Set([l2, l11].filter((p): p is Planet => p !== undefined));

  for (const yoga of context.yogas.yogas) {
    const catStr = String(yoga.category || '').toUpperCase().trim();
    const typeStr = String(yoga.type || '').toUpperCase().trim();
    const nameStr = String(yoga.name || '').toUpperCase().trim();

    const isDirectWealthCategory =
      wealthCategories.has(catStr) ||
      catStr.includes('DHANA') ||
      catStr.includes('LAKSHMI') ||
      catStr.includes('PROSPERITY') ||
      catStr.includes('CHANDRA_MANGALA') ||
      catStr.includes('VASUMATHI') ||
      catStr.includes('AMLA') ||
      typeStr.includes('DHANA') ||
      typeStr.includes('LAKSHMI') ||
      typeStr.includes('PROSPERITY') ||
      typeStr.includes('CHANDRA_MANGALA') ||
      typeStr.includes('VASUMATHI') ||
      typeStr.includes('AMLA') ||
      nameStr.includes('DHANA') ||
      nameStr.includes('LAKSHMI') ||
      nameStr.includes('PROSPERITY') ||
      nameStr.includes('CHANDRA_MANGALA') ||
      nameStr.includes('VASUMATHI') ||
      nameStr.includes('AMLA');

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

    const touchesCoreWealthHouse = yogaHouses.some((h) => coreWealthHouses.has(h));

    const yogaPlanets = yoga.planets || [];
    const touchesWealthLord = yogaPlanets.some((p) => wealthLords.has(p));

    // 5H and 9H involvement alone does not qualify a Yoga as wealth confirmation
    const isWealthRelevant = isDirectWealthCategory || touchesCoreWealthHouse || touchesWealthLord;

    if (!isWealthRelevant) continue;

    const finalStatus = yoga.assessment?.finalStatus || yoga.finalStatus || 'PRESENT';

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
        value: yoga.category || 'Wealth',
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
        category: yoga.category || 'Wealth',
        finalStatus: finalStatus as 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED',
        strength,
        effect,
        statement: `${yoga.type} (${yoga.category || 'Yoga'}) is evaluated as ${finalStatus}, providing confirmatory ${effect.toLowerCase()} for wealth and financial prosperity.`,
        factors: Object.freeze(factors),
        planets: Object.freeze(yoga.planets ? [...yoga.planets] : [])
      })
    );
  }

  return Object.freeze(results);
}
