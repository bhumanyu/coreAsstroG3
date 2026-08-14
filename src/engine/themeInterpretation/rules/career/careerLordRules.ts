import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateHouseLord } from '../../evaluators/lordEvaluator';
import { getHouseLord } from '../../themeInterpretationUtils';

export const careerLordRules: readonly ThemeRule[] = Object.freeze([
  // CAREER_10L_DIGNITY_001
  {
    id: 'CAREER_10L_DIGNITY_001',
    evidenceFamily: CareerEvidenceFamily.TENTH_LORD,
    priority: 'PRIMARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const lordFacts = evaluateHouseLord(context, 10);
      if (!lordFacts.lordPlanet) {
        return { triggered: false };
      }

      const evidence: ThemeInterpretationEvidence = {
        id: `CAREER_10L_DIGNITY_001:${lordFacts.lordPlanet}`,
        ruleId: 'CAREER_10L_DIGNITY_001',
        evidenceFamily: CareerEvidenceFamily.TENTH_LORD,
        priority: 'PRIMARY',
        strength: lordFacts.strength,
        effect: lordFacts.effect,
        statement: lordFacts.statement,
        planets: [lordFacts.lordPlanet],
        houses: lordFacts.occupiedHouse ? [10, lordFacts.occupiedHouse] : [10],
        factors: lordFacts.factors,
        conditional: lordFacts.conditional,
        dimension: 'NATAL_STRUCTURE'
      };

      return { triggered: true, evidence };
    }
  },

  // CAREER_6L_10L_LINK_001
  {
    id: 'CAREER_6L_10L_LINK_001',
    evidenceFamily: CareerEvidenceFamily.SIXTH_LORD,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const l6 = getHouseLord(context, 6);
      const l10 = getHouseLord(context, 10);

      if (l6 && l10 && l6 === l10) {
        const evidence: ThemeInterpretationEvidence = {
          id: `CAREER_6L_10L_LINK_001:${l6}`,
          ruleId: 'CAREER_6L_10L_LINK_001',
          evidenceFamily: CareerEvidenceFamily.SIXTH_LORD,
          priority: 'SECONDARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: `Single planet (${l6}) rules both 6th house (service/competition) and 10th house (career), creating a direct structural relationship between service/work and career.`,
          planets: [l6],
          houses: [6, 10],
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_10L_11L_LINK_001
  {
    id: 'CAREER_10L_11L_LINK_001',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_LORD,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const l10 = getHouseLord(context, 10);
      const l11 = getHouseLord(context, 11);

      if (l10 && l11 && l10 === l11) {
        const evidence: ThemeInterpretationEvidence = {
          id: `CAREER_10L_11L_LINK_001:${l10}`,
          ruleId: 'CAREER_10L_11L_LINK_001',
          evidenceFamily: CareerEvidenceFamily.ELEVENTH_LORD,
          priority: 'SECONDARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: `Single planet (${l10}) rules both 10th house (career) and 11th house (gains), creating a direct linkage between career and gains houses.`,
          planets: [l10],
          houses: [10, 11],
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  }
]);
