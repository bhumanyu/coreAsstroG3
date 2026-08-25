import { Planet } from '../../../types';
import type { CareerManifestationMode } from '../careerTypes';

export interface D10ModeRuleConfig {
  readonly mode: CareerManifestationMode;
  readonly primaryPlanets: readonly Planet[];
  readonly supportingHouses: readonly number[];
  readonly challengingHouses: readonly number[];
}

export const D10_MANIFESTATION_MODE_RULES: Readonly<Record<CareerManifestationMode, D10ModeRuleConfig>> = Object.freeze({
  LEADERSHIP: Object.freeze({
    mode: 'LEADERSHIP',
    primaryPlanets: Object.freeze([Planet.SUN, Planet.JUPITER, Planet.MARS]),
    supportingHouses: Object.freeze([10, 1, 9, 5]),
    challengingHouses: Object.freeze([6, 8, 12])
  }),
  AUTHORITY: Object.freeze({
    mode: 'AUTHORITY',
    primaryPlanets: Object.freeze([Planet.SUN, Planet.MARS, Planet.JUPITER]),
    supportingHouses: Object.freeze([10, 1, 9]),
    challengingHouses: Object.freeze([8, 12, 6])
  }),
  MANAGEMENT: Object.freeze({
    mode: 'MANAGEMENT',
    primaryPlanets: Object.freeze([Planet.SATURN, Planet.JUPITER, Planet.MERCURY]),
    supportingHouses: Object.freeze([10, 11, 6, 4]),
    challengingHouses: Object.freeze([8, 12])
  }),
  TECHNICAL_SPECIALIZATION: Object.freeze({
    mode: 'TECHNICAL_SPECIALIZATION',
    primaryPlanets: Object.freeze([Planet.MERCURY, Planet.MARS, Planet.RAHU, Planet.KETU]),
    supportingHouses: Object.freeze([3, 5, 10, 8]),
    challengingHouses: Object.freeze([12])
  }),
  SERVICE_EMPLOYMENT: Object.freeze({
    mode: 'SERVICE_EMPLOYMENT',
    primaryPlanets: Object.freeze([Planet.SATURN, Planet.MERCURY]),
    supportingHouses: Object.freeze([6, 10, 2]),
    challengingHouses: Object.freeze([8, 12])
  }),
  INDEPENDENT_WORK: Object.freeze({
    mode: 'INDEPENDENT_WORK',
    primaryPlanets: Object.freeze([Planet.SUN, Planet.MARS, Planet.MERCURY]),
    supportingHouses: Object.freeze([1, 3, 10, 11]),
    challengingHouses: Object.freeze([6, 12])
  }),
  BUSINESS_ENTREPRENEURSHIP: Object.freeze({
    mode: 'BUSINESS_ENTREPRENEURSHIP',
    primaryPlanets: Object.freeze([Planet.MERCURY, Planet.VENUS, Planet.JUPITER]),
    supportingHouses: Object.freeze([7, 10, 11, 2]),
    challengingHouses: Object.freeze([6, 8, 12])
  }),
  EMPLOYMENT: Object.freeze({
    mode: 'EMPLOYMENT',
    primaryPlanets: Object.freeze([Planet.SATURN, Planet.MERCURY]),
    supportingHouses: Object.freeze([6, 10, 2]),
    challengingHouses: Object.freeze([8, 12])
  }),
  ENTREPRENEURSHIP: Object.freeze({
    mode: 'ENTREPRENEURSHIP',
    primaryPlanets: Object.freeze([Planet.MERCURY, Planet.VENUS, Planet.JUPITER]),
    supportingHouses: Object.freeze([7, 10, 11, 2]),
    challengingHouses: Object.freeze([6, 8, 12])
  }),
  PUBLIC_INSTITUTIONAL: Object.freeze({
    mode: 'PUBLIC_INSTITUTIONAL',
    primaryPlanets: Object.freeze([Planet.SUN, Planet.JUPITER, Planet.SATURN]),
    supportingHouses: Object.freeze([10, 9, 1, 11]),
    challengingHouses: Object.freeze([8, 12, 6])
  }),
  SPECIALIZATION: Object.freeze({
    mode: 'SPECIALIZATION',
    primaryPlanets: Object.freeze([Planet.MERCURY, Planet.MARS, Planet.RAHU, Planet.KETU]),
    supportingHouses: Object.freeze([3, 5, 10, 8]),
    challengingHouses: Object.freeze([12])
  })
});
