import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateCareerDashaTiming } from '../../evaluators/dashaEvaluator';

export const careerDashaRules: readonly ThemeRule[] = Object.freeze([
  {
    id: 'CAREER_DASHA_TIMING_001',
    evidenceFamily: CareerEvidenceFamily.DASHA,
    priority: 'TIMING',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const timings = evaluateCareerDashaTiming(context);
      if (timings.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence[] = timings.map((t) => ({
        id: `CAREER_DASHA_TIMING_001:${t.dashaLevel}:${t.planet}`,
        ruleId: 'CAREER_DASHA_TIMING_001',
        evidenceFamily: CareerEvidenceFamily.DASHA,
        priority: 'TIMING',
        strength: t.dashaLevel === 'MAHADASHA' ? 'STRONG' : 'MODERATE',
        effect: 'NEUTRAL',
        statement: `Active ${t.dashaLevel} period lord ${t.planet} activates natal career factors: ${t.relevanceReason}`,
        planets: [t.planet],
        houses: t.houses,
        timingEvidence: t,
        conditional: true,
        dimension: 'TIMING'
      }));

      return { triggered: true, evidence: Object.freeze(evidenceList) };
    }
  }
]);
