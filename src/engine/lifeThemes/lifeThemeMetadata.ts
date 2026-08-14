import { LifeTheme } from './lifeThemeTypes';

export interface LifeThemeDomainMetadata {
  readonly theme: LifeTheme;
  readonly houses: readonly number[];
  readonly d9Houses: readonly number[];
  readonly d10Houses: readonly number[];
  readonly label: string;
  readonly description: string;
}

export const LIFE_THEME_METADATA: readonly LifeThemeDomainMetadata[] = Object.freeze([
  Object.freeze({
    theme: LifeTheme.SELF_IDENTITY,
    houses: Object.freeze([1]),
    d9Houses: Object.freeze([1]),
    d10Houses: Object.freeze([1]),
    label: 'Self & Identity',
    description: 'Core identity, physical vitality, temperament, and personal orientation.'
  }),
  Object.freeze({
    theme: LifeTheme.FAMILY_HOME,
    houses: Object.freeze([2, 4]),
    d9Houses: Object.freeze([2, 4]),
    d10Houses: Object.freeze([]),
    label: 'Family & Home',
    description: 'Domestic environment, lineage, emotional foundations, and landed assets.'
  }),
  Object.freeze({
    theme: LifeTheme.WEALTH_FINANCE,
    houses: Object.freeze([2, 11]),
    d9Houses: Object.freeze([2]),
    d10Houses: Object.freeze([2, 11]),
    label: 'Wealth & Finance',
    description: 'Acquired assets, financial reserves, speech, and material resource accumulation.'
  }),
  Object.freeze({
    theme: LifeTheme.COMMUNICATION,
    houses: Object.freeze([3]),
    d9Houses: Object.freeze([3]),
    d10Houses: Object.freeze([3]),
    label: 'Communication & Initiative',
    description: 'Personal initiative, short travel, siblings, and communication skills.'
  }),
  Object.freeze({
    theme: LifeTheme.CHILDREN_CREATIVITY,
    houses: Object.freeze([5]),
    d9Houses: Object.freeze([5]),
    d10Houses: Object.freeze([5]),
    label: 'Children & Creativity',
    description: 'Creative expression, progeny, speculative intellect, and past karma.'
  }),
  Object.freeze({
    theme: LifeTheme.HEALTH_SERVICE,
    houses: Object.freeze([6]),
    d9Houses: Object.freeze([6]),
    d10Houses: Object.freeze([6]),
    label: 'Health & Service',
    description: 'Daily work routines, service, competitive dynamics, and physical wellness.'
  }),
  Object.freeze({
    theme: LifeTheme.PARTNERSHIP,
    houses: Object.freeze([7]),
    d9Houses: Object.freeze([7]),
    d10Houses: Object.freeze([]),
    label: 'Partnership & Marriage',
    description: 'Spouse, long-term partnerships, contractual alliances, and public interactions.'
  }),
  Object.freeze({
    theme: LifeTheme.TRANSFORMATION,
    houses: Object.freeze([8]),
    d9Houses: Object.freeze([8]),
    d10Houses: Object.freeze([8]),
    label: 'Transformation & Longevity',
    description: 'Unearned assets, psychological shifts, hidden dynamics, and major life changes.'
  }),
  Object.freeze({
    theme: LifeTheme.DHARMA_BELIEFS,
    houses: Object.freeze([9]),
    d9Houses: Object.freeze([9]),
    d10Houses: Object.freeze([9]),
    label: 'Dharma & Beliefs',
    description: 'Higher learning, philosophical orientation, father, and spiritual guidance.'
  }),
  Object.freeze({
    theme: LifeTheme.CAREER_STATUS,
    houses: Object.freeze([10]),
    d9Houses: Object.freeze([10]),
    d10Houses: Object.freeze([7, 10]),
    label: 'Career & Status',
    description: 'Public profession, authority roles, social standing, and active karma.'
  }),
  Object.freeze({
    theme: LifeTheme.NETWORKS_GAINS,
    houses: Object.freeze([11]),
    d9Houses: Object.freeze([11]),
    d10Houses: Object.freeze([11]),
    label: 'Networks & Gains',
    description: 'Social groups, community networks, long-term aspirations, and financial gains.'
  }),
  Object.freeze({
    theme: LifeTheme.SPIRITUALITY_RELEASE,
    houses: Object.freeze([12]),
    d9Houses: Object.freeze([12]),
    d10Houses: Object.freeze([12]),
    label: 'Spirituality & Release',
    description: 'Solitude, spiritual liberation, foreign connection, expenses, and rest.'
  })
]);

export function getThemesForHouse(house: number, varga?: 'D1' | 'D9' | 'D10'): LifeTheme[] {
  if (!Number.isInteger(house) || house < 1 || house > 12) {
    return [];
  }
  if (varga === 'D9') {
    return LIFE_THEME_METADATA.filter(meta => meta.d9Houses.includes(house)).map(meta => meta.theme);
  }
  if (varga === 'D10') {
    return LIFE_THEME_METADATA.filter(meta => meta.d10Houses.includes(house)).map(meta => meta.theme);
  }
  return LIFE_THEME_METADATA.filter(meta => meta.houses.includes(house)).map(meta => meta.theme);
}
