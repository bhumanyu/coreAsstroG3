import {
  ThemeRuleResult,
  ThemeInterpretationEvidence,
  ThemeEvidenceEffect
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateHouseLord } from '../../evaluators/lordEvaluator';
import { getHouseLord, getPlanetHouse } from '../../themeInterpretationUtils';

const WEALTH_HOUSES = new Set([2, 5, 9, 11]);

function createLordDignityRule(
  houseNum: number,
  family: WealthEvidenceFamily
): WealthRule {
  const ruleId = `WEALTH_${houseNum}L_DIGNITY_001`;

  return {
    id: ruleId,
    evidenceFamily: family,
    priority: 'PRIMARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const lordFacts = evaluateHouseLord(context, houseNum);
      if (!lordFacts.lordPlanet) {
        return { triggered: false };
      }

      // Gate: Materially relevant condition only ("fact exists ≠ evidence")
      const isSupportive = lordFacts.effect === 'SUPPORT' || lordFacts.strength === 'STRONG';
      const isChallenging = lordFacts.effect === 'CHALLENGE';
      const isConnectedToWealthHouse =
        lordFacts.occupiedHouse !== undefined && WEALTH_HOUSES.has(lordFacts.occupiedHouse);

      if (!isSupportive && !isChallenging && !isConnectedToWealthHouse) {
        return { triggered: false };
      }

      const evidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: `${ruleId}:${lordFacts.lordPlanet}`,
        ruleId,
        evidenceFamily: family,
        priority: 'PRIMARY',
        strength: lordFacts.strength,
        effect: lordFacts.effect,
        statement: lordFacts.statement,
        planets: [lordFacts.lordPlanet],
        houses: lordFacts.occupiedHouse ? [houseNum, lordFacts.occupiedHouse] : [houseNum],
        factors: lordFacts.factors,
        conditional: lordFacts.conditional,
        dimension: 'NATAL_STRUCTURE'
      };

      return { triggered: true, evidence };
    }
  };
}

// Policy: Structural lord links yield SUPPORT only when at least one connecting lord is in supportive condition;
// both lords afflicted yields CHALLENGE; one afflicted or neither supportive yields NEUTRAL (conditional=true).
function createLordLinkRule(
  hA: number,
  hB: number,
  family: WealthEvidenceFamily
): WealthRule {
  const ruleId = `WEALTH_${hA}L_${hB}L_LINK_001`;
  const is11Related = hA === 11 || hB === 11;
  const priority = is11Related ? 'PRIMARY' : 'SECONDARY';

  return {
    id: ruleId,
    evidenceFamily: family,
    priority,
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const lA = getHouseLord(context, hA);
      const lB = getHouseLord(context, hB);

      if (!lA || !lB) {
        return { triggered: false };
      }

      const isSameLord = lA === lB;

      // Check for link: same lord or conjunction/aspect
      let linked = false;
      let reason = '';
      let strength: 'STRONG' | 'MODERATE' = isSameLord ? 'STRONG' : 'MODERATE';

      if (isSameLord) {
        linked = true;
        reason = `Single planet (${lA}) rules both house ${hA} and house ${hB}, creating a direct structural relationship.`;
      } else {
        const houseLA = getPlanetHouse(context, lA);
        const houseLB = getPlanetHouse(context, lB);

        if (houseLA !== undefined && houseLB !== undefined && houseLA === houseLB) {
          linked = true;
          reason = `Lords of house ${hA} (${lA}) and house ${hB} (${lB}) are conjunct in house ${houseLA}.`;
        } else {
          const aspects = context.natalGrahaDrishti?.aspects || [];
          const lAAspectsLB = aspects.some((a) => a.sourcePlanet === lA && a.targetPlanet === lB);
          const lBAspectsLA = aspects.some((a) => a.sourcePlanet === lB && a.targetPlanet === lA);
          if (lAAspectsLB || lBAspectsLA) {
            linked = true;
            reason = `Aspectual relationship between lord of house ${hA} (${lA}) and lord of house ${hB} (${lB}).`;
          }
        }
      }

      if (!linked) {
        return { triggered: false };
      }

      // Evaluate lord condition to contextualize effect (tri-state policy)
      const lordFactsA = evaluateHouseLord(context, hA);
      const lordFactsB = evaluateHouseLord(context, hB);
      const isAfflictedA = lordFactsA.effect === 'CHALLENGE';
      const isAfflictedB = lordFactsB.effect === 'CHALLENGE';
      const isSupportiveA = lordFactsA.effect === 'SUPPORT' || lordFactsA.strength === 'STRONG';
      const isSupportiveB = lordFactsB.effect === 'SUPPORT' || lordFactsB.strength === 'STRONG';

      let effect: ThemeEvidenceEffect = 'NEUTRAL';
      if (isAfflictedA && isAfflictedB) {
        effect = 'CHALLENGE';
      } else if (isAfflictedA || isAfflictedB) {
        effect = 'NEUTRAL';
      } else if (isSupportiveA || isSupportiveB) {
        effect = 'SUPPORT';
      } else {
        effect = 'NEUTRAL';
      }

      const evidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: `${ruleId}:${isSameLord ? lA : `${lA}_${lB}`}`,
        ruleId,
        evidenceFamily: family,
        priority,
        strength,
        effect,
        statement: reason,
        planets: isSameLord ? [lA] : [lA, lB],
        houses: [hA, hB],
        conditional: effect !== 'SUPPORT',
        dimension: 'NATAL_STRUCTURE'
      };

      return { triggered: true, evidence };
    }
  };
}

export const wealthLordRules: readonly WealthRule[] = Object.freeze([
  createLordDignityRule(2, WealthEvidenceFamily.SECOND_LORD),
  createLordDignityRule(11, WealthEvidenceFamily.ELEVENTH_LORD),
  createLordDignityRule(9, WealthEvidenceFamily.NINTH_LORD),
  createLordDignityRule(5, WealthEvidenceFamily.FIFTH_LORD),
  createLordLinkRule(2, 11, WealthEvidenceFamily.ELEVENTH_LORD),
  createLordLinkRule(2, 9, WealthEvidenceFamily.NINTH_LORD),
  createLordLinkRule(2, 5, WealthEvidenceFamily.FIFTH_LORD),
  createLordLinkRule(5, 11, WealthEvidenceFamily.ELEVENTH_LORD),
  createLordLinkRule(9, 11, WealthEvidenceFamily.ELEVENTH_LORD),
  createLordLinkRule(5, 9, WealthEvidenceFamily.NINTH_LORD)
]);
