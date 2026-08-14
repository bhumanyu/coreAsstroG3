import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateHouseStatus } from '../../evaluators/houseEvaluator';
import { getHouseLord } from '../../themeInterpretationUtils';

function checkHouseLink(
  context: ThemeInterpretationContext,
  hA: number,
  hB: number
) {
  const lA = getHouseLord(context, hA);
  const lB = getHouseLord(context, hB);
  const statusA = evaluateHouseStatus(context, hA);
  const statusB = evaluateHouseStatus(context, hB);

  let linked = false;
  let reason = '';

  if (lA && lB && lA === lB) {
    linked = true;
    reason = `Single planet (${lA}) rules both house ${hA} and house ${hB}.`;
  } else {
    const lAInB = lA && statusB.occupants.includes(lA);
    const lBInA = lB && statusA.occupants.includes(lB);

    if (lAInB && lBInA) {
      linked = true;
      reason = `Sign exchange (Parivartana) between lord of house ${hA} (${lA}) and lord of house ${hB} (${lB}).`;
    } else if (lAInB) {
      linked = true;
      reason = `Lord of house ${hA} (${lA}) placed in house ${hB}.`;
    } else if (lBInA) {
      linked = true;
      reason = `Lord of house ${hB} (${lB}) placed in house ${hA}.`;
    }
  }

  if (!linked && lA && lB && lA !== lB) {
    let houseLA: number | undefined;
    let houseLB: number | undefined;
    if (context.planetInterpretation?.planets?.[lA]?.placement?.house) houseLA = context.planetInterpretation.planets[lA].placement.house;
    else if (context.horoscope?.planetFacts?.[lA]?.house) houseLA = context.horoscope.planetFacts[lA].house;

    if (context.planetInterpretation?.planets?.[lB]?.placement?.house) houseLB = context.planetInterpretation.planets[lB].placement.house;
    else if (context.horoscope?.planetFacts?.[lB]?.house) houseLB = context.horoscope.planetFacts[lB].house;

    if (houseLA !== undefined && houseLB !== undefined && houseLA === houseLB) {
      linked = true;
      reason = `Lords of house ${hA} (${lA}) and house ${hB} (${lB}) are conjunct in house ${houseLA}.`;
    }
  }

  if (!linked && lA && lB) {
    const aspects = context.natalGrahaDrishti?.aspects || [];
    const lAAspectsLB = aspects.some((a) => a.sourcePlanet === lA && a.targetPlanet === lB);
    const lBAspectsLA = aspects.some((a) => a.sourcePlanet === lB && a.targetPlanet === lA);
    if (lAAspectsLB || lBAspectsLA) {
      linked = true;
      reason = `Aspectual relationship between lord of house ${hA} (${lA}) and lord of house ${hB} (${lB}).`;
    } else {
      const lAAspectsHB = aspects.some((a) => a.sourcePlanet === lA && a.targetHouse === hB);
      const lBAspectsHA = aspects.some((a) => a.sourcePlanet === lB && a.targetHouse === hA);
      if (lAAspectsHB || lBAspectsHA) {
        linked = true;
        reason = `Aspectual connection between house ${hA} lord and house ${hB}.`;
      }
    }
  }

  return { linked, reason, lA, lB };
}

export const careerHouseRules: readonly ThemeRule[] = Object.freeze([
  // CAREER_10H_STRONG_001
  {
    id: 'CAREER_10H_STRONG_001',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'PRIMARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h10 = evaluateHouseStatus(context, 10);
      if (h10.status === 'STRONG' || h10.effect === 'SUPPORT') {
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_10H_STRONG_001:HOUSE_10',
          ruleId: 'CAREER_10H_STRONG_001',
          evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
          priority: 'PRIMARY',
          strength: h10.strength,
          effect: 'SUPPORT',
          statement: h10.summaryStatement,
          houses: [10],
          planets: h10.occupants.length > 0 ? h10.occupants : (h10.lord ? [h10.lord] : undefined),
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_10H_AFFLICTION_001
  {
    id: 'CAREER_10H_AFFLICTION_001',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'PRIMARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h10 = evaluateHouseStatus(context, 10);
      if (h10.status === 'AFFLICTED' || h10.effect === 'CHALLENGE') {
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_10H_AFFLICTION_001:HOUSE_10',
          ruleId: 'CAREER_10H_AFFLICTION_001',
          evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
          priority: 'PRIMARY',
          strength: h10.strength,
          effect: 'CHALLENGE',
          statement: `10th house exhibits structural challenge or affliction: ${h10.summaryStatement}`,
          houses: [10],
          planets: h10.occupants.length > 0 ? h10.occupants : (h10.lord ? [h10.lord] : undefined),
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_10H_OCCUPANT_001
  {
    id: 'CAREER_10H_OCCUPANT_001',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h10 = evaluateHouseStatus(context, 10);
      if (h10.occupants.length > 0) {
        let effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
        let conditional = true;
        if (h10.status === 'STRONG' || h10.effect === 'SUPPORT') {
          effect = 'SUPPORT';
          conditional = false;
        } else if (h10.status === 'AFFLICTED' || h10.effect === 'CHALLENGE') {
          effect = 'CHALLENGE';
          conditional = true;
        }

        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_10H_OCCUPANT_001:HOUSE_10',
          ruleId: 'CAREER_10H_OCCUPANT_001',
          evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
          priority: 'SECONDARY',
          strength: 'MODERATE',
          effect,
          statement: `10th house occupied by ${h10.occupants.join(', ')}, shaping public work expression.`,
          houses: [10],
          planets: h10.occupants,
          conditional,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_6H_SERVICE_001
  {
    id: 'CAREER_6H_SERVICE_001',
    evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h6 = evaluateHouseStatus(context, 6);
      const link = checkHouseLink(context, 6, 10);

      const isStrongOrAfflicted = h6.status === 'STRONG' || h6.status === 'AFFLICTED';

      if (isStrongOrAfflicted || link.linked) {
        const effect = h6.status === 'AFFLICTED' || h6.effect === 'CHALLENGE' ? 'CHALLENGE' : (h6.status === 'STRONG' ? 'SUPPORT' : 'NEUTRAL');
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_6H_SERVICE_001:HOUSE_6',
          ruleId: 'CAREER_6H_SERVICE_001',
          evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
          priority: 'SECONDARY',
          strength: h6.strength || 'MODERATE',
          effect,
          statement: `6th house (daily service, problem-solving, competition): ${h6.summaryStatement}`,
          houses: [6],
          planets: h6.occupants,
          conditional: effect !== 'SUPPORT',
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_11H_GAINS_001
  {
    id: 'CAREER_11H_GAINS_001',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h11 = evaluateHouseStatus(context, 11);
      const link = checkHouseLink(context, 10, 11);

      const isStrongOrAfflicted = h11.status === 'STRONG' || h11.status === 'AFFLICTED';

      if (isStrongOrAfflicted || link.linked) {
        const effect = h11.status === 'AFFLICTED' || h11.effect === 'CHALLENGE' ? 'CHALLENGE' : (h11.status === 'STRONG' ? 'SUPPORT' : 'NEUTRAL');
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_11H_GAINS_001:HOUSE_11',
          ruleId: 'CAREER_11H_GAINS_001',
          evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
          priority: 'SECONDARY',
          strength: h11.strength || 'MODERATE',
          effect,
          statement: `11th house (income from profession, gains, networks): ${h11.summaryStatement}`,
          houses: [11],
          planets: h11.occupants,
          conditional: effect !== 'SUPPORT',
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_2H_WEALTH_001
  {
    id: 'CAREER_2H_WEALTH_001',
    evidenceFamily: CareerEvidenceFamily.SECOND_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const h2 = evaluateHouseStatus(context, 2);
      const link = checkHouseLink(context, 2, 10);

      const isStrongOrAfflicted = h2.status === 'STRONG' || h2.status === 'AFFLICTED';

      if (isStrongOrAfflicted || link.linked) {
        const effect = h2.status === 'AFFLICTED' || h2.effect === 'CHALLENGE' ? 'CHALLENGE' : (h2.status === 'STRONG' ? 'SUPPORT' : 'NEUTRAL');
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_2H_WEALTH_001:HOUSE_2',
          ruleId: 'CAREER_2H_WEALTH_001',
          evidenceFamily: CareerEvidenceFamily.SECOND_HOUSE,
          priority: 'SECONDARY',
          strength: h2.strength || 'MODERATE',
          effect,
          statement: `2nd house (accumulated wealth, professional speech/assets): ${h2.summaryStatement}`,
          houses: [2],
          planets: h2.occupants,
          conditional: effect !== 'SUPPORT',
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_6H_10H_LINK_001
  {
    id: 'CAREER_6H_10H_LINK_001',
    evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const link = checkHouseLink(context, 6, 10);

      if (link.linked) {
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_6H_10H_LINK_001:HOUSES_6_10',
          ruleId: 'CAREER_6H_10H_LINK_001',
          evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
          priority: 'SECONDARY',
          strength: 'MODERATE',
          effect: 'SUPPORT',
          statement: `Connection between 6th house (service/competition) and 10th house (career): ${link.reason}`,
          houses: [6, 10],
          planets: [link.lA, link.lB].filter((p): p is NonNullable<typeof p> => p !== undefined),
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  },

  // CAREER_10H_11H_LINK_001
  {
    id: 'CAREER_10H_11H_LINK_001',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const link = checkHouseLink(context, 10, 11);

      if (link.linked) {
        const evidence: ThemeInterpretationEvidence = {
          id: 'CAREER_10H_11H_LINK_001:HOUSES_10_11',
          ruleId: 'CAREER_10H_11H_LINK_001',
          evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
          priority: 'SECONDARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: `Direct linkage between 10th house (career) and 11th house (gains): ${link.reason}`,
          houses: [10, 11],
          planets: [link.lA, link.lB].filter((p): p is NonNullable<typeof p> => p !== undefined),
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  }
]);
