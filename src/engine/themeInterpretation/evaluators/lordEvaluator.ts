import { Planet } from '../../../types';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { getHouseLord, getDignity } from '../themeInterpretationUtils';
import { evaluateDignity } from './dignityEvaluator';
import { evaluateLordHousePlacement } from './placementEvaluator';
import { evaluateFunctionalRoles } from './functionalRoleEvaluator';
import { evaluatePlanetaryStrength } from './strengthEvaluator';
import { ThemeEvidenceFactor, ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface LordEvaluationFacts {
  readonly house: number;
  readonly lordPlanet?: Planet;
  readonly occupiedHouse?: number;
  readonly dignity?: string;
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly conditional: boolean;
  readonly factors: readonly ThemeEvidenceFactor[];
  readonly statement: string;
}

export function evaluateHouseLord(
  context: ThemeInterpretationContext,
  houseNum: number
): LordEvaluationFacts {
  const lordPlanet = getHouseLord(context, houseNum);

  if (!lordPlanet) {
    return Object.freeze({
      house: houseNum,
      effect: 'NEUTRAL',
      strength: 'WEAK',
      conditional: true,
      factors: [],
      statement: `Lord of house ${houseNum} could not be determined.`
    });
  }

  // Find occupied house
  let occupiedHouse = houseNum;
  if (context.planetInterpretation?.planets?.[lordPlanet]?.placement?.house) {
    occupiedHouse = context.planetInterpretation.planets[lordPlanet].placement.house;
  } else if ((context.planetAnalysis?.planets?.[lordPlanet] as any)?.house) {
    occupiedHouse = (context.planetAnalysis!.planets[lordPlanet] as any).house;
  } else if (context.horoscope?.planetFacts?.[lordPlanet]?.house) {
    occupiedHouse = context.horoscope.planetFacts[lordPlanet].house;
  } else if (context.horoscope?.planetFacts?.[lordPlanet]?.position?.house) {
    occupiedHouse = context.horoscope.planetFacts[lordPlanet].position.house;
  }

  const dignity = getDignity(context, lordPlanet);
  const dignityEval = evaluateDignity(dignity);
  const placementEval = evaluateLordHousePlacement(lordPlanet, houseNum, occupiedHouse);
  const roleFacts = evaluateFunctionalRoles(context, lordPlanet);
  const strengthFacts = evaluatePlanetaryStrength(context, lordPlanet);

  // Determine aggregate effect & strength for lord via second-order combination logic
  let effect: ThemeEvidenceEffect = placementEval.effect;
  let strength: ThemeEvidenceStrength = placementEval.strength;
  let conditional = placementEval.conditional;
  let summaryNote = placementEval.statement;

  if (placementEval.effect === 'SUPPORT') {
    if (dignityEval.effect === 'SUPPORT') {
      effect = 'SUPPORT';
      strength = 'STRONG';
      conditional = false;
      summaryNote += ` Reinforced by strong ${dignityEval.dignity || 'supportive'} dignity.`;
    } else if (dignityEval.effect === 'CHALLENGE') {
      effect = 'CHALLENGE';
      strength = 'STRONG';
      conditional = true;
      summaryNote += ` However, debilitated/afflicted dignity introduces structural challenge to this placement.`;
    }
  } else if (placementEval.effect === 'NEUTRAL') {
    if (dignityEval.effect === 'SUPPORT') {
      effect = 'NEUTRAL';
      strength = 'STRONG';
      conditional = true;
      summaryNote += ` Strong ${dignityEval.dignity} dignity mitigates the conditional placement, enabling constructive expression.`;
    } else if (dignityEval.effect === 'CHALLENGE') {
      effect = 'CHALLENGE';
      strength = 'STRONG';
      conditional = true;
      summaryNote += ` Debilitated dignity amplifies challenges associated with this placement.`;
    }
  } else if (placementEval.effect === 'CHALLENGE') {
    if (dignityEval.effect === 'SUPPORT') {
      effect = 'NEUTRAL';
      strength = 'MODERATE';
      conditional = true;
      summaryNote += ` Strong dignity mitigates house placement challenge, yielding a conditional net effect.`;
    } else if (dignityEval.effect === 'CHALLENGE') {
      effect = 'CHALLENGE';
      strength = 'STRONG';
      conditional = true;
    }
  }

  // Functional role modifications
  let functionalRoleFactorRole: 'CONFIRMATION' | 'CONFLICT' | 'MODIFIER' = 'MODIFIER';
  if (roleFacts.isYogakaraka) {
    const isAdverse =
      dignityEval.effect === 'CHALLENGE' || placementEval.effect === 'CHALLENGE';

    if (!isAdverse) {
      if (placementEval.effect === 'SUPPORT' || dignityEval.effect === 'SUPPORT') {
        effect = 'SUPPORT';
        strength = 'STRONG';
        conditional = false;
        functionalRoleFactorRole = 'CONFIRMATION';
        summaryNote += ` As a Yogakaraka with supportive placement/dignity, ${lordPlanet} provides exceptional functional strength for career elevation.`;
      } else {
        effect = 'NEUTRAL';
        strength = 'MODERATE';
        conditional = true;
        functionalRoleFactorRole = 'MODIFIER';
        summaryNote += ` As a Yogakaraka, ${lordPlanet} provides positive functional potential conditional on supporting indicators.`;
      }
    } else {
      effect = 'NEUTRAL';
      strength = 'MODERATE';
      conditional = true;
      functionalRoleFactorRole = 'MODIFIER';
      summaryNote += ` While ${lordPlanet} is a Yogakaraka, adverse dignity or placement yields a conditional net effect.`;
    }
  } else if (roleFacts.isLagnaLord) {
    functionalRoleFactorRole = 'CONFIRMATION';
    summaryNote += ` As Lagna Lord, ${lordPlanet} aligns personal capacity with professional destiny.`;
  } else if (roleFacts.isDusthanaLord || roleFacts.isMarakaLord || roleFacts.isBadhakaLord) {
    functionalRoleFactorRole = 'CONFLICT';
    if (effect === 'SUPPORT') {
      conditional = true;
    }
  }

  const factors: ThemeEvidenceFactor[] = [
    {
      label: 'Lord Identity',
      value: `${lordPlanet} is the lord of house ${houseNum}`,
      role: 'PRIMARY'
    },
    {
      label: 'House Placement',
      value: `Placed in house ${occupiedHouse}`,
      role: 'PRIMARY'
    },
    {
      label: 'Dignity',
      value: dignityEval.dignity ? String(dignityEval.dignity) : 'Neutral/Undetermined',
      role: dignityEval.effect === 'CHALLENGE' ? 'CONFLICT' : 'MODIFIER'
    },
    {
      label: 'Functional Roles',
      value: roleFacts.roles.join(', ') || 'Standard Lordship',
      role: functionalRoleFactorRole
    }
  ];

  if (strengthFacts.available) {
    factors.push({
      label: 'Shadbala Strength',
      value: strengthFacts.statement,
      role: 'CONFIRMATION'
    });
  }

  const statement = `House ${houseNum} lord (${lordPlanet}) is placed in house ${occupiedHouse} with ${dignityEval.dignity || 'standard'} dignity. ${summaryNote}`;

  return Object.freeze({
    house: houseNum,
    lordPlanet,
    occupiedHouse,
    dignity: dignityEval.dignity ? String(dignityEval.dignity) : undefined,
    effect,
    strength,
    conditional,
    factors: Object.freeze(factors),
    statement
  });
}
