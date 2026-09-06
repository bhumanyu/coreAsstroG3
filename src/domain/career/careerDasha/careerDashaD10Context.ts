import { Planet } from '../../../types';
import type { CareerDashaD10PlanetContext } from './careerDashaPlanetaryTypes';
import { normalizeDignity } from './careerDashaPlanetaryRules';

export interface CareerDashaD10HoroscopeSource {
  readonly divisionalInterpretation?: {
    readonly d10?: {
      readonly planets?: Partial<Record<Planet, {
        readonly house?: number;
        readonly sign?: unknown;
        readonly dignity?: string;
      }>>;
      readonly houses?: readonly {
        readonly house?: number;
        readonly lord?: Planet;
      }[];
      readonly houseLords?: Partial<Record<number, Planet>>;
    };
    readonly d1Comparisons?: Partial<Record<Planet, {
      readonly isD10Vargottama?: boolean;
    }>>;
  };
}

export function buildCareerDashaD10PlanetContext(
  horoscope: CareerDashaD10HoroscopeSource | null | undefined,
  planet: Planet
): CareerDashaD10PlanetContext {
  const d10 = horoscope?.divisionalInterpretation?.d10;

  if (!d10?.planets?.[planet]) {
    return Object.freeze({
      planet,
      available: false,
      relationship: 'UNAVAILABLE'
    });
  }

  const d10Planet = d10.planets[planet];

  const d10TenthHouse = Array.isArray(d10.houses)
    ? d10.houses.find((h) => h.house === 10)
    : undefined;

  const d10TenthLord = d10TenthHouse?.lord ?? d10.houseLords?.[10];
  const isD10TenthLord = d10TenthLord === planet;
  const isD10TenthHouse = d10Planet?.house === 10;

  const d1Comparison = horoscope?.divisionalInterpretation?.d1Comparisons?.[planet];
  const isVargottama = d1Comparison?.isD10Vargottama === true;

  let relationship: CareerDashaD10PlanetContext['relationship'] = 'MODIFIES';

  if (isD10TenthLord || isD10TenthHouse || isVargottama) {
    relationship = 'CONFIRMS';
  }

  const normalizedDignity = normalizeDignity(d10Planet?.dignity);

  if (normalizedDignity === 'DEBILITATED') {
    relationship = relationship === 'CONFIRMS' ? 'PARTIALLY_CONFIRMS' : 'CONFLICTS';
  }

  return Object.freeze({
    planet,
    available: true,
    house: d10Planet?.house,
    sign: d10Planet?.sign ? String(d10Planet.sign) : undefined,
    dignity: d10Planet?.dignity ? String(d10Planet.dignity) : undefined,
    isVargottama,
    isD10TenthLord,
    isD10TenthHouse,
    relationship
  });
}
