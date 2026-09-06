import type {
  CareerDashaPlanetaryEffect,
  CareerDashaPlanetaryEvidence
} from './careerDashaPlanetaryTypes';

export function calculatePlanetaryScores(
  factors: readonly CareerDashaPlanetaryEvidence[]
): {
  support: number;
  challenge: number;
} {
  let support = 0;
  let challenge = 0;

  for (const factor of factors) {
    if (factor.direction === 'SUPPORT') {
      support += factor.weight;
    } else if (factor.direction === 'CHALLENGE') {
      challenge += factor.weight;
    }
  }

  return {
    support: Math.round(support * 100) / 100,
    challenge: Math.round(challenge * 100) / 100
  };
}

export function effectScore(
  effect: CareerDashaPlanetaryEffect
): number {
  switch (effect) {
    case 'STRONGLY_SUPPORTS':
      return 2;

    case 'SUPPORTS':
      return 1;

    case 'MIXED':
      return 0;

    case 'CHALLENGES':
      return -1;

    case 'STRONGLY_CHALLENGES':
      return -2;

    case 'DOES_NOT_ACTIVATE':
    case 'INSUFFICIENT_DATA':
    default:
      return 0;
  }
}
