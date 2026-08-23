import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES
} from '../../domain/career/careerTypes';
import {
  WEALTH_ACCUMULATION_FAMILIES,
  WEALTH_GAINS_FAMILIES,
  WEALTH_FORTUNE_FAMILIES,
  WEALTH_SPECULATION_FAMILIES
} from '../../domain/wealth/wealthManifestations';
import { WealthDimension } from '../../domain/wealth/wealthTypes';
import {
  WEALTH_SUBTHEME_CONFIGS,
  WealthSubthemeConfig,
  WealthEvidenceFamily
} from '../themeInterpretation/wealthThemeInterpretationTypes';

export type DashaLifeDomain = 'CAREER' | 'WEALTH' | 'MARRIAGE';

export interface DomainActivationRuleProvider {
  getRelevantHouses(domain: DashaLifeDomain | string): readonly number[];
  getRelevantHousesByDimension(dimension: WealthDimension | string): readonly number[];
}

/**
 * Maps a set of WealthEvidenceFamilies to the canonical house numbers
 * defined in WEALTH_SUBTHEME_CONFIGS.
 */
function resolveHouseNumbersFromFamilies(
  families: ReadonlySet<WealthEvidenceFamily>,
  configs?: readonly WealthSubthemeConfig[]
): readonly number[] {
  const resolvedConfigs = configs ?? WEALTH_SUBTHEME_CONFIGS ?? [];
  const houses = new Set<number>();
  for (const config of resolvedConfigs) {
    if (families.has(config.primaryFamily) || families.has(config.lordFamily)) {
      houses.add(config.houseNumber);
    }
  }
  return Object.freeze(Array.from(houses).sort((a, b) => a - b));
}

export class CanonicalDomainActivationRuleProvider implements DomainActivationRuleProvider {
  constructor(
    private readonly careerPrimaryHouses: ReadonlySet<number> = CAREER_PRIMARY_HOUSES,
    private readonly careerSupportingHouses: ReadonlySet<number> = CAREER_SUPPORTING_HOUSES,
    private readonly wealthSubthemeConfigs?: readonly WealthSubthemeConfig[],
    private readonly wealthAccumulationFamilies: ReadonlySet<WealthEvidenceFamily> = WEALTH_ACCUMULATION_FAMILIES,
    private readonly wealthGainsFamilies: ReadonlySet<WealthEvidenceFamily> = WEALTH_GAINS_FAMILIES,
    private readonly wealthFortuneFamilies: ReadonlySet<WealthEvidenceFamily> = WEALTH_FORTUNE_FAMILIES,
    private readonly wealthSpeculationFamilies: ReadonlySet<WealthEvidenceFamily> = WEALTH_SPECULATION_FAMILIES
  ) {}

  private getEffectiveWealthSubthemeConfigs(): readonly WealthSubthemeConfig[] {
    return this.wealthSubthemeConfigs ?? WEALTH_SUBTHEME_CONFIGS ?? [];
  }

  getRelevantHousesByDimension(dimension: WealthDimension | string): readonly number[] {
    const dim = dimension.toUpperCase();
    const configs = this.getEffectiveWealthSubthemeConfigs();
    switch (dim) {
      case 'ACCUMULATION':
        return resolveHouseNumbersFromFamilies(
          this.wealthAccumulationFamilies,
          configs
        );
      case 'GAINS':
        return resolveHouseNumbersFromFamilies(
          this.wealthGainsFamilies,
          configs
        );
      case 'FORTUNE':
        return resolveHouseNumbersFromFamilies(
          this.wealthFortuneFamilies,
          configs
        );
      case 'SPECULATION':
        return resolveHouseNumbersFromFamilies(
          this.wealthSpeculationFamilies,
          configs
        );
      default: {
        const config = configs.find((c) => c.key === dim);
        return config ? Object.freeze([config.houseNumber]) : Object.freeze([]);
      }
    }
  }

  getRelevantHouses(domain: DashaLifeDomain | string): readonly number[] {
    switch (domain.toUpperCase()) {
      case 'CAREER': {
        const houses = Array.from(
          new Set([...this.careerPrimaryHouses, ...this.careerSupportingHouses])
        ).sort((a, b) => a - b);
        return Object.freeze(houses);
      }
      case 'WEALTH': {
        const dimensions: readonly WealthDimension[] = [
          'ACCUMULATION',
          'GAINS',
          'FORTUNE',
          'SPECULATION'
        ];
        const houses = Array.from(
          new Set(dimensions.flatMap((dim) => this.getRelevantHousesByDimension(dim)))
        ).sort((a, b) => a - b);
        return Object.freeze(houses);
      }
      case 'MARRIAGE': {
        return Object.freeze([7, 2, 11, 4, 8, 12]);
      }
      default:
        return Object.freeze([]);
    }
  }
}

export const defaultDomainActivationRuleProvider: DomainActivationRuleProvider =
  new CanonicalDomainActivationRuleProvider();
