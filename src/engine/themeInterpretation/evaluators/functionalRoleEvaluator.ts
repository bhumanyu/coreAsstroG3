import { Planet } from '../../../types';
import { FunctionalRole } from '../../functionalNature/functionalRoleTypes';
import { ThemeInterpretationContext } from '../themeInterpretationContext';

export interface FunctionalRoleFacts {
  readonly planet: Planet;
  readonly roles: readonly FunctionalRole[];
  readonly isYogakaraka: boolean;
  readonly isLagnaLord: boolean;
  readonly isKendraLord: boolean;
  readonly isTrikonaLord: boolean;
  readonly isDusthanaLord: boolean;
  readonly isMarakaLord: boolean;
  readonly isBadhakaLord: boolean;
  readonly ownedHouses: readonly number[];
  readonly summaryStatement: string;
}

export function evaluateFunctionalRoles(
  context: ThemeInterpretationContext,
  planet: Planet
): FunctionalRoleFacts {
  const roles: FunctionalRole[] = [];
  let ownedHouses: number[] = [];

  const frReport = context.functionalRoles;
  const pRole = frReport?.planets?.[planet] || (frReport as any)?.roles?.[planet];
  if (pRole) {
    if (pRole.roles) {
      roles.push(...pRole.roles);
    }
    if (pRole.ownedHouses) {
      ownedHouses = [...pRole.ownedHouses];
    }
  } else if (context.planetInterpretation?.planets?.[planet]?.functionalRole) {
    const fr = context.planetInterpretation.planets[planet].functionalRole;
    roles.push(...fr.roles);
    ownedHouses = [...fr.ownedHouses];
  }

  const isYogakaraka = roles.includes(FunctionalRole.YOGAKARAKA);
  const isLagnaLord = roles.includes(FunctionalRole.LAGNA_LORD);
  const isKendraLord = roles.includes(FunctionalRole.KENDRA_LORD);
  const isTrikonaLord = roles.includes(FunctionalRole.TRIKONA_LORD);
  const isDusthanaLord = roles.includes(FunctionalRole.DUSTHANA_LORD);
  const isMarakaLord = roles.includes(FunctionalRole.MARAKA_LORD);
  const isBadhakaLord = roles.includes(FunctionalRole.BADHAKA_LORD);

  const parts: string[] = [];
  if (isYogakaraka) parts.push('Yogakaraka');
  if (isLagnaLord) parts.push('Lagna Lord');
  if (isTrikonaLord) parts.push('Trikona Lord');
  if (isKendraLord) parts.push('Kendra Lord');
  if (isDusthanaLord) parts.push('Dusthana Lord');
  if (isMarakaLord) parts.push('Maraka Lord');
  if (isBadhakaLord) parts.push('Badhaka Lord');

  const summaryStatement = parts.length > 0
    ? `${planet} functions as ${parts.join(', ')}.`
    : `${planet} has standard functional lordship.`;

  return Object.freeze({
    planet,
    roles: Object.freeze(roles),
    isYogakaraka,
    isLagnaLord,
    isKendraLord,
    isTrikonaLord,
    isDusthanaLord,
    isMarakaLord,
    isBadhakaLord,
    ownedHouses: Object.freeze(ownedHouses),
    summaryStatement
  });
}
