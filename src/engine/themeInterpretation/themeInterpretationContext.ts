import {
  Horoscope,
  PlanetAnalysisReport,
  HouseAnalysisReport,
  NatalGrahaDrishti,
  PlanetaryStrengthReport
} from '../../types';
import { PlanetInterpretationReport } from '../planetInterpretation/planetInterpretationTypes';
import { HouseInterpretationReport } from '../houseInterpretation/houseInterpretationTypes';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { YogaAnalysisReport } from '../yoga/yogaTypes';
import { DivisionalInterpretationReport } from '../divisionalInterpretation/divisionalInterpretationTypes';
import { DashaInterpretationReport } from '../dashaInterpretation/dashaInterpretationTypes';

export interface ThemeInterpretationContextInput {
  readonly horoscope?: Horoscope;
  readonly planetAnalysis?: PlanetAnalysisReport;
  readonly houseAnalysis?: HouseAnalysisReport;
  readonly planetInterpretation?: PlanetInterpretationReport;
  readonly houseInterpretation?: HouseInterpretationReport;
  readonly functionalRoles?: FunctionalRoleAnalysisReport;
  readonly yogas?: YogaAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
  readonly divisionalInterpretation?: DivisionalInterpretationReport;
  readonly dashaInterpretation?: DashaInterpretationReport;
  readonly natalGrahaDrishti?: NatalGrahaDrishti;
}

export interface ThemeInterpretationContext {
  readonly horoscope?: Horoscope;
  readonly planetAnalysis?: PlanetAnalysisReport;
  readonly houseAnalysis?: HouseAnalysisReport;
  readonly planetInterpretation?: PlanetInterpretationReport;
  readonly houseInterpretation?: HouseInterpretationReport;
  readonly functionalRoles?: FunctionalRoleAnalysisReport;
  readonly yogas?: YogaAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
  readonly divisionalInterpretation?: DivisionalInterpretationReport;
  readonly dashaInterpretation?: DashaInterpretationReport;
  readonly natalGrahaDrishti?: NatalGrahaDrishti;
}

export function buildThemeInterpretationContext(
  input: ThemeInterpretationContextInput | Horoscope
): ThemeInterpretationContext {
  if ('planetFacts' in input || 'fullNatalAnalysis' in input) {
    const h = input as Horoscope;
    return Object.freeze({
      horoscope: h,
      planetAnalysis: h.planetAnalysis,
      houseAnalysis: h.houseAnalysis,
      planetInterpretation: h.planetInterpretation,
      houseInterpretation: h.houseInterpretation,
      functionalRoles: h.functionalRoles,
      yogas: h.yogas,
      planetaryStrength: h.planetaryStrength,
      divisionalInterpretation: h.divisionalInterpretation,
      dashaInterpretation: h.dashaInterpretation,
      natalGrahaDrishti: h.natalGrahaDrishti
    });
  }

  const ci = input as ThemeInterpretationContextInput;
  if (ci.horoscope) {
    return Object.freeze({
      horoscope: ci.horoscope,
      planetAnalysis: ci.planetAnalysis ?? ci.horoscope.planetAnalysis,
      houseAnalysis: ci.houseAnalysis ?? ci.horoscope.houseAnalysis,
      planetInterpretation: ci.planetInterpretation ?? ci.horoscope.planetInterpretation,
      houseInterpretation: ci.houseInterpretation ?? ci.horoscope.houseInterpretation,
      functionalRoles: ci.functionalRoles ?? ci.horoscope.functionalRoles,
      yogas: ci.yogas ?? ci.horoscope.yogas,
      planetaryStrength: ci.planetaryStrength ?? ci.horoscope.planetaryStrength,
      divisionalInterpretation: ci.divisionalInterpretation ?? ci.horoscope.divisionalInterpretation,
      dashaInterpretation: ci.dashaInterpretation ?? ci.horoscope.dashaInterpretation,
      natalGrahaDrishti: ci.natalGrahaDrishti ?? ci.horoscope.natalGrahaDrishti
    });
  }

  return Object.freeze({
    planetAnalysis: ci.planetAnalysis,
    houseAnalysis: ci.houseAnalysis,
    planetInterpretation: ci.planetInterpretation,
    houseInterpretation: ci.houseInterpretation,
    functionalRoles: ci.functionalRoles,
    yogas: ci.yogas,
    planetaryStrength: ci.planetaryStrength,
    divisionalInterpretation: ci.divisionalInterpretation,
    dashaInterpretation: ci.dashaInterpretation,
    natalGrahaDrishti: ci.natalGrahaDrishti
  });
}
