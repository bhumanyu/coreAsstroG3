import { DignityStatus } from '../../../types';
import { ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface DignityEvaluationResult {
  readonly dignity?: DignityStatus | string;
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly statement: string;
}

export function evaluateDignity(dignity?: DignityStatus | string): DignityEvaluationResult {
  if (!dignity) {
    return {
      dignity: undefined,
      effect: 'NEUTRAL',
      strength: 'WEAK',
      statement: 'Dignity is undetermined or neutral.'
    };
  }

  const dStr = String(dignity).toUpperCase();

  switch (dStr) {
    case DignityStatus.EXALTED:
      return {
        dignity,
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Exalted dignity provides peak structural strength and highest expression.'
      };
    case DignityStatus.MOOLATRIKONA:
      return {
        dignity,
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Moolatrikona dignity provides strong foundational power and purpose.'
      };
    case DignityStatus.OWN_SIGN:
      return {
        dignity,
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Own sign placement grants autonomy, stability, and natural strength.'
      };
    case DignityStatus.GREAT_FRIEND_SIGN:
      return {
        dignity,
        effect: 'SUPPORT',
        strength: 'MODERATE',
        statement: 'Great friend sign dignity provides favorable working conditions and support.'
      };
    case DignityStatus.FRIEND_SIGN:
      return {
        dignity,
        effect: 'SUPPORT',
        strength: 'MODERATE',
        statement: 'Friend sign dignity provides positive alignment and operational ease.'
      };
    case DignityStatus.NEUTRAL_SIGN:
    case DignityStatus.NEUTRAL:
      return {
        dignity,
        effect: 'NEUTRAL',
        strength: 'WEAK',
        statement: 'Neutral dignity indicates standard functioning without major boost or impediment.'
      };
    case DignityStatus.ENEMY_SIGN:
      return {
        dignity,
        effect: 'CHALLENGE',
        strength: 'MODERATE',
        statement: 'Enemy sign dignity introduces friction, resistance, or extra effort.'
      };
    case DignityStatus.GREAT_ENEMY_SIGN:
      return {
        dignity,
        effect: 'CHALLENGE',
        strength: 'MODERATE',
        statement: 'Great enemy sign dignity creates notable struggle or uncomfortable conditions.'
      };
    case DignityStatus.DEBILITATED:
      return {
        dignity,
        effect: 'CHALLENGE',
        strength: 'STRONG',
        statement: 'Debilitated dignity indicates vulnerability, needing supportive aspects or cancelations.'
      };
    default:
      return {
        dignity,
        effect: 'NEUTRAL',
        strength: 'WEAK',
        statement: `Dignity evaluated as ${dStr}.`
      };
  }
}
