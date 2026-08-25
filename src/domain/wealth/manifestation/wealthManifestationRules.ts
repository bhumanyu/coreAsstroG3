import { WEALTH_DIMENSION_RULES } from '../wealthReasoningRules';
import {
  WEALTH_DIMENSION_HOUSES,
  WEALTH_DIMENSION_KARAKAS,
  WEALTH_HOUSES,
  type WealthDimension
} from '../wealthTypes';
import type { WealthManifestationDimension } from './wealthManifestationTypes';

export {
  WEALTH_DIMENSION_RULES,
  WEALTH_DIMENSION_HOUSES,
  WEALTH_DIMENSION_KARAKAS,
  WEALTH_HOUSES
};

export function getWealthDimensionRuleSet(
  dimension: WealthManifestationDimension
): ReadonlySet<string> {
  const rules = WEALTH_DIMENSION_RULES[dimension];
  if (!rules) {
    return new Set<string>();
  }
  return new Set<string>(rules);
}
