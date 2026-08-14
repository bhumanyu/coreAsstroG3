import {
  ThemeRuleResult,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateWealthDashaTiming } from '../../evaluators/wealthDashaEvaluator';

// Note: In v1 timing evidence, `strength` currently denotes period level hierarchy (MAHADASHA = STRONG, ANTARDASHA = MODERATE), not astrological wealth strength or activation potential.
export const wealthDashaRules: readonly WealthRule[] = Object.freeze([
  {
    id: 'WEALTH_DASHA_TIMING_001',
    evidenceFamily: WealthEvidenceFamily.DASHA,
    priority: 'TIMING',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const timings = evaluateWealthDashaTiming(context);
      if (timings.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = timings.map((t) => ({
        id: `WEALTH_DASHA_TIMING_001:${t.dashaLevel}:${t.planet}`,
        ruleId: 'WEALTH_DASHA_TIMING_001',
        evidenceFamily: WealthEvidenceFamily.DASHA,
        priority: 'TIMING',
        strength: t.dashaLevel === 'MAHADASHA' ? 'STRONG' : 'MODERATE',
        effect: 'NEUTRAL',
        statement: `Active ${t.dashaLevel} period lord ${t.planet} activates natal wealth factors: ${t.relevanceReason}`,
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
