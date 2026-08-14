import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateAspectOnHouse } from '../../evaluators/aspectEvaluator';

export const careerAspectRules: readonly ThemeRule[] = Object.freeze([
  {
    id: 'CAREER_ASPECT_10H_001',
    evidenceFamily: CareerEvidenceFamily.ASPECT,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const aspects = evaluateAspectOnHouse(context, 10);
      if (aspects.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence[] = aspects.map((asp) => ({
        id: `CAREER_ASPECT_10H_001:${asp.aspectingPlanet}`,
        ruleId: 'CAREER_ASPECT_10H_001',
        evidenceFamily: CareerEvidenceFamily.ASPECT,
        priority: 'SECONDARY',
        strength: asp.strength,
        effect: asp.effect,
        statement: asp.statement,
        planets: [asp.aspectingPlanet],
        houses: [10],
        factors: asp.factors,
        conditional: asp.conditional,
        dimension: 'MODIFIER'
      }));

      return { triggered: true, evidence: Object.freeze(evidenceList) };
    }
  }
]);
