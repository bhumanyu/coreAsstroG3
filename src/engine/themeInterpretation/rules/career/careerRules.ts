import { ThemeRule } from '../../themeInterpretationTypes';
import { careerHouseRules } from './careerHouseRules';
import { careerLordRules } from './careerLordRules';
import { careerPlanetRules } from './careerPlanetRules';
import { careerAspectRules } from './careerAspectRules';
import { careerYogaRules } from './careerYogaRules';
import { careerVargaRules } from './careerVargaRules';
import { careerDashaRules } from './careerDashaRules';

export const CAREER_RULES: readonly ThemeRule[] = Object.freeze([
  ...careerHouseRules,
  ...careerLordRules,
  ...careerPlanetRules,
  ...careerAspectRules,
  ...careerYogaRules,
  ...careerVargaRules,
  ...careerDashaRules
]);
