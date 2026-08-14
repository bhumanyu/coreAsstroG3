import { WealthRule } from '../../wealthThemeInterpretationTypes';
import { wealthHouseRules } from './wealthHouseRules';
import { wealthLordRules } from './wealthLordRules';
import { wealthPlanetRules } from './wealthPlanetRules';
import { wealthAspectRules } from './wealthAspectRules';
import { wealthYogaRules } from './wealthYogaRules';
import { wealthDashaRules } from './wealthDashaRules';

// Note: D2 confirmation rules are not registered in v1 (D2 confirmation is UNAVAILABLE)
export const WEALTH_RULES: readonly WealthRule[] = Object.freeze([
  ...wealthHouseRules,
  ...wealthLordRules,
  ...wealthPlanetRules,
  ...wealthAspectRules,
  ...wealthYogaRules,
  ...wealthDashaRules
]);
