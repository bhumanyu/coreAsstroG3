import { Planet } from '../../../types';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { getDignity } from '../themeInterpretationUtils';
import { evaluateFunctionalRoles } from './functionalRoleEvaluator';
import { evaluateDignity } from './dignityEvaluator';
import { evaluatePlanetaryStrength } from './strengthEvaluator';
import { ThemeEvidenceFactor, ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface AspectEvaluationResult {
  readonly aspectingPlanet: Planet;
  readonly targetHouse?: number;
  readonly targetPlanet?: Planet;
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly conditional: boolean;
  readonly factors: readonly ThemeEvidenceFactor[];
  readonly statement: string;
}

export function evaluateAspectOnHouse(
  context: ThemeInterpretationContext,
  targetHouse: number
): readonly AspectEvaluationResult[] {
  const results: AspectEvaluationResult[] = [];

  // Read aspects received by targetHouse from houseInterpretation or natalGrahaDrishti
  const hi = context.houseInterpretation?.houses?.[targetHouse];

  if (hi?.aspects?.received && hi.aspects.received.length > 0) {
    for (const rx of hi.aspects.received) {
      for (const p of rx.sourcePlanets) {
        const roles = evaluateFunctionalRoles(context, p);
        const dignity = evaluateDignity(getDignity(context, p));
        const strength = evaluatePlanetaryStrength(context, p);

        let effect: ThemeEvidenceEffect = 'NEUTRAL';
        let conditional = false;

        if (roles.isYogakaraka || roles.isTrikonaLord || roles.isLagnaLord || roles.isKendraLord) {
          effect = dignity.effect === 'CHALLENGE' ? 'NEUTRAL' : 'SUPPORT';
          conditional = dignity.effect === 'CHALLENGE';
        } else if (roles.isDusthanaLord || roles.isMarakaLord || roles.isBadhakaLord) {
          effect = dignity.effect === 'SUPPORT' ? 'NEUTRAL' : 'CHALLENGE';
          conditional = dignity.effect === 'SUPPORT';
        } else {
          effect = 'NEUTRAL';
          conditional = true;
        }

        const factors: ThemeEvidenceFactor[] = [
          {
            label: 'Aspecting Planet',
            value: `${p} casts ${rx.aspectType} aspect from house ${rx.sourceHouse}`,
            role: 'PRIMARY'
          },
          {
            label: 'Functional Role',
            value: roles.roles.join(', ') || 'Standard',
            role: 'MODIFIER'
          },
          {
            label: 'Dignity',
            value: dignity.dignity ? String(dignity.dignity) : 'Neutral',
            role: 'MODIFIER'
          }
        ];

        results.push(
          Object.freeze({
            aspectingPlanet: p,
            targetHouse,
            effect,
            strength: 'MODERATE',
            conditional,
            factors: Object.freeze(factors),
            statement: `${p} (${roles.roles.join(', ') || 'graha'}) casts ${rx.aspectType} aspect onto house ${targetHouse} from house ${rx.sourceHouse}.`
          })
        );
      }
    }
  }

  return Object.freeze(results);
}
