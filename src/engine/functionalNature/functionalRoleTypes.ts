export enum FunctionalRole {
  LAGNA_LORD = 'LAGNA_LORD',
  KENDRA_LORD = 'KENDRA_LORD',
  TRIKONA_LORD = 'TRIKONA_LORD',
  DUSTHANA_LORD = 'DUSTHANA_LORD',
  MARAKA_LORD = 'MARAKA_LORD',
  BADHAKA_LORD = 'BADHAKA_LORD',
  YOGAKARAKA = 'YOGAKARAKA',
  SECOND_LORD = 'SECOND_LORD',
  THIRD_LORD = 'THIRD_LORD',
  ELEVENTH_LORD = 'ELEVENTH_LORD'
}

export const FUNCTIONAL_ROLE_ORDER: readonly FunctionalRole[] = Object.freeze([
  FunctionalRole.LAGNA_LORD,
  FunctionalRole.KENDRA_LORD,
  FunctionalRole.TRIKONA_LORD,
  FunctionalRole.DUSTHANA_LORD,
  FunctionalRole.MARAKA_LORD,
  FunctionalRole.BADHAKA_LORD,
  FunctionalRole.YOGAKARAKA,
  FunctionalRole.SECOND_LORD,
  FunctionalRole.THIRD_LORD,
  FunctionalRole.ELEVENTH_LORD
]);
