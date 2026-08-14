import { Planet } from '../../../types';
import { ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface PlacementEvaluationResult {
  readonly lordPlanet: Planet;
  readonly lordOfHouse: number;
  readonly occupiedHouse: number;
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly conditional: boolean;
  readonly statement: string;
}

export function evaluateLordHousePlacement(
  lordPlanet: Planet,
  lordOfHouse: number,
  occupiedHouse: number
): PlacementEvaluationResult {
  switch (occupiedHouse) {
    case 1:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 1,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 1st house aligns career identity directly with self-expression and personal authority.`
      });
    case 2:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 2,
        effect: 'NEUTRAL',
        strength: 'MODERATE',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 2nd house connects professional status with family wealth, speech, and asset accumulation; career expression depends on wealth management.`
      });
    case 3:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 3,
        effect: 'NEUTRAL',
        strength: 'MODERATE',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 3rd house channels career drive into communication, self-effort, media, and technical skills.`
      });
    case 4:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 4,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 4th house grounds professional reputation in foundations, real estate, vehicles, or institutional bases.`
      });
    case 5:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 5,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 5th house links career destiny with intellect, creative counsel, speculation, and merit.`
      });
    case 6:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 6,
        effect: 'NEUTRAL',
        strength: 'MODERATE',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 6th house (an Upachaya house) focuses career efforts on service, problem-solving, health/law, and overcoming competition.`
      });
    case 7:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 7,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 7th house anchors public status in commercial partnerships, public relations, and client engagements.`
      });
    case 8:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 8,
        effect: 'NEUTRAL',
        strength: 'MODERATE',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 8th house indicates professional involvement in research, transformation, audit, hidden assets, or risk management.`
      });
    case 9:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 9,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 9th house forms a Dharma-Karma connection, elevating career through higher learning, ethics, advisory roles, or international scope.`
      });
    case 10:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 10,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in its own 10th house grants powerful, autonomous career foundation and natural leadership.`
      });
    case 11:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 11,
        effect: 'SUPPORT',
        strength: 'STRONG',
        conditional: false,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 11th house establishes direct financial gains, wide networks, and high achievement from career.`
      });
    case 12:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse: 12,
        effect: 'NEUTRAL',
        strength: 'MODERATE',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) placed in the 12th house connects career status with foreign assignments, institutional roles, research facilities, or behind-the-scenes work.`
      });
    default:
      return Object.freeze({
        lordPlanet,
        lordOfHouse,
        occupiedHouse,
        effect: 'NEUTRAL',
        strength: 'WEAK',
        conditional: true,
        statement: `The ${lordOfHouse}th lord (${lordPlanet}) is placed in house ${occupiedHouse}.`
      });
  }
}
