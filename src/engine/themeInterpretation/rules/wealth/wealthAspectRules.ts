import {
  ThemeRuleResult,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateAspectOnHouse } from '../../evaluators/aspectEvaluator';

function createAspectRule(houseNum: number): WealthRule {
  const ruleId = `WEALTH_ASPECT_${houseNum}H_001`;

  return {
    id: ruleId,
    evidenceFamily: WealthEvidenceFamily.ASPECT,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const aspects = evaluateAspectOnHouse(context, houseNum);
      if (aspects.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = aspects.map((asp) => ({
        id: `${ruleId}:${asp.aspectingPlanet}`,
        ruleId,
        evidenceFamily: WealthEvidenceFamily.ASPECT,
        priority: 'SECONDARY',
        strength: asp.strength,
        effect: asp.effect,
        statement: asp.statement,
        planets: [asp.aspectingPlanet],
        houses: [houseNum],
        factors: asp.factors,
        conditional: asp.conditional,
        dimension: 'MODIFIER'
      }));

      return { triggered: true, evidence: Object.freeze(evidenceList) };
    }
  };
}

export const wealthAspectRules: readonly WealthRule[] = Object.freeze([
  createAspectRule(2),
  createAspectRule(11),
  createAspectRule(9),
  createAspectRule(5)
]);
