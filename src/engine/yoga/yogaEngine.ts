import { Planet } from '../../types';
import {
  YogaAnalysisInput,
  YogaAnalysisReport,
  YogaResult,
  YogaRule,
  YogaAssessment
} from './yogaTypes';
import { evaluateYogaModifiers } from './yogaModifiers';
import { gajaKesariRule } from './gajaKesari';
import { ruchakaRule } from './ruchaka';
import { bhadraRule } from './bhadra';
import { hamsaRule } from './hamsa';
import { malavyaRule } from './malavya';
import { shashaRule } from './shasha';
import { rajaYogaRules } from './rajaYoga';
import { dhanaYogaRules } from './dhanaYoga';
import { lakshmiYogaRule } from './lakshmiYoga';
import { chandraMangalaRule } from './chandraMangala';
import { vasumatiYogaRule } from './vasumati';

export const YOGA_RULES: readonly YogaRule[] = Object.freeze([
  gajaKesariRule,
  ruchakaRule,
  bhadraRule,
  hamsaRule,
  malavyaRule,
  shashaRule,
  ...rajaYogaRules,
  ...dhanaYogaRules,
  lakshmiYogaRule,
  chandraMangalaRule,
  vasumatiYogaRule
]);

export function normalizeYogaResults(
  result: YogaResult | readonly YogaResult[] | null
): readonly YogaResult[] {
  if (!result) return Object.freeze([]);
  if (Array.isArray(result)) {
    return result as unknown as readonly YogaResult[];
  }
  const single = result as YogaResult;
  return Object.freeze([single]);
}

function attachAssessment(
  formation: YogaResult,
  assessment: YogaAssessment
): YogaResult {
  const modifiers = Object.freeze([
    ...assessment.supportingFactors,
    ...assessment.weakeningFactors,
    ...assessment.cancellationFactors
  ]);

  return Object.freeze({
    ...formation,
    assessment,
    modifiers,
    supportingFactors: assessment.supportingFactors,
    weakeningFactors: assessment.weakeningFactors,
    cancellationFactors: assessment.cancellationFactors
  });
}

export function analyzeYogas(input: YogaAnalysisInput): YogaAnalysisReport {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Invalid input to analyzeYogas: expected non-null object');
  }

  if (!input.planetFacts || typeof input.planetFacts !== 'object') {
    throw new TypeError('Invalid input to analyzeYogas: missing planetFacts');
  }

  const moonFact = input.planetFacts[Planet.MOON];
  if (!moonFact) {
    throw new TypeError('Invalid input to analyzeYogas: missing Moon facts in planetFacts');
  }
  if (moonFact.planet !== Planet.MOON) {
    throw new TypeError('Moon facts must identify Planet.MOON.');
  }

  const jupiterFact = input.planetFacts[Planet.JUPITER];
  if (!jupiterFact) {
    throw new TypeError('Invalid input to analyzeYogas: missing Jupiter facts in planetFacts');
  }
  if (jupiterFact.planet !== Planet.JUPITER) {
    throw new TypeError('Jupiter facts must identify Planet.JUPITER.');
  }

  const moonHouse = moonFact.house;
  if (typeof moonHouse !== 'number' || !Number.isInteger(moonHouse) || moonHouse < 1 || moonHouse > 12) {
    throw new TypeError(`Invalid input to analyzeYogas: Moon house must be an integer in 1..12, got ${moonHouse}`);
  }

  const jupiterHouse = jupiterFact.house;
  if (typeof jupiterHouse !== 'number' || !Number.isInteger(jupiterHouse) || jupiterHouse < 1 || jupiterHouse > 12) {
    throw new TypeError(`Invalid input to analyzeYogas: Jupiter house must be an integer in 1..12, got ${jupiterHouse}`);
  }

  const validatedPlanets = new Set<Planet>([Planet.MOON, Planet.JUPITER]);

  for (const rule of YOGA_RULES) {
    if (rule.requiresHouseLordship && !input.houseLordship) {
      continue;
    }
    for (const planet of rule.requiredPlanets) {
      if (validatedPlanets.has(planet)) {
        continue;
      }
      validatedPlanets.add(planet);

      const fact = input.planetFacts[planet];
      if (!fact) {
        throw new TypeError(`Invalid input to analyzeYogas: missing ${planet} facts in planetFacts`);
      }
      if (fact.planet !== planet) {
        throw new TypeError(`${planet} facts must identify Planet.${planet}.`);
      }

      const house = fact.house;
      if (typeof house !== 'number' || !Number.isInteger(house) || house < 1 || house > 12) {
        throw new TypeError(`Invalid input to analyzeYogas: ${planet} house must be an integer in 1..12, got ${house}`);
      }
    }
  }

  const detectedYogas: YogaResult[] = [];
  const seenKeys = new Set<string>();

  for (const rule of YOGA_RULES) {
    if (rule.requiresHouseLordship && !input.houseLordship) {
      continue;
    }
    const rawResult = rule.evaluate(input);
    const results = normalizeYogaResults(rawResult);
    for (const result of results) {
      const key = `${result.type}_${result.evidence[0]?.ruleId ?? ''}` +
                  `_${result.planets.join(',')}_${result.houses.join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const assessment = evaluateYogaModifiers(result, input);
        const assessedResult = attachAssessment(result, assessment);
        detectedYogas.push(assessedResult);
      }
    }
  }

  return Object.freeze({
    yogas: Object.freeze(detectedYogas)
  });
}
