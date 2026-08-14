import {
  ThemeRuleResult,
  ThemeInterpretationEvidence,
  ThemeEvidenceEffect
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateHouseStatus } from '../../evaluators/houseEvaluator';
import { evaluateHouseLord } from '../../evaluators/lordEvaluator';
import { getHouseLord, getPlanetHouse } from '../../themeInterpretationUtils';

// Policy: Structural house links yield SUPPORT only when at least one connecting lord is in supportive condition;
// both lords afflicted yields CHALLENGE; one afflicted or neither supportive yields NEUTRAL (conditional=true).
export function checkWealthHouseLink(
  context: ThemeInterpretationContext,
  hA: number,
  hB: number
) {
  const lA = getHouseLord(context, hA);
  const lB = getHouseLord(context, hB);
  const statusA = evaluateHouseStatus(context, hA);
  const statusB = evaluateHouseStatus(context, hB);

  const houseLA = lA ? getPlanetHouse(context, lA) : undefined;
  const houseLB = lB ? getPlanetHouse(context, lB) : undefined;

  let linked = false;
  let reason = '';

  if (lA && lB && lA === lB) {
    linked = true;
    reason = `Single planet (${lA}) rules both house ${hA} and house ${hB}.`;
  } else {
    const lAInB = lA !== undefined && (statusB.occupants.includes(lA) || houseLA === hB);
    const lBInA = lB !== undefined && (statusA.occupants.includes(lB) || houseLB === hA);

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

  let effect: ThemeEvidenceEffect = 'NEUTRAL';
  if (linked) {
    const lordFactsA = evaluateHouseLord(context, hA);
    const lordFactsB = evaluateHouseLord(context, hB);
    const isAfflictedA = lordFactsA.effect === 'CHALLENGE';
    const isAfflictedB = lordFactsB.effect === 'CHALLENGE';
    const isSupportiveA = lordFactsA.effect === 'SUPPORT' || lordFactsA.strength === 'STRONG';
    const isSupportiveB = lordFactsB.effect === 'SUPPORT' || lordFactsB.strength === 'STRONG';

    if (isAfflictedA && isAfflictedB) {
      effect = 'CHALLENGE';
    } else if (isAfflictedA || isAfflictedB) {
      effect = 'NEUTRAL';
    } else if (isSupportiveA || isSupportiveB) {
      effect = 'SUPPORT';
    } else {
      effect = 'NEUTRAL';
    }
  }

  return { linked, reason, lA, lB, effect };
}

function createHouseStatusRule(
  houseNum: number,
  family: WealthEvidenceFamily,
  statusType: 'STRONG' | 'AFFLICTION'
): WealthRule {
  const ruleId = `WEALTH_${houseNum}H_${statusType}_001`;
  const isStrong = statusType === 'STRONG';

  return {
    id: ruleId,
    evidenceFamily: family,
    priority: 'PRIMARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const hStatus = evaluateHouseStatus(context, houseNum);
      const matched = isStrong
        ? hStatus.status === 'STRONG' || hStatus.effect === 'SUPPORT'
        : hStatus.status === 'AFFLICTED' || hStatus.effect === 'CHALLENGE';

      if (matched) {
        const effect: ThemeEvidenceEffect = isStrong ? 'SUPPORT' : 'CHALLENGE';
        const statement = isStrong
          ? hStatus.summaryStatement
          : `${houseNum}th house exhibits structural challenge or affliction: ${hStatus.summaryStatement}`;

        const evidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
          id: `${ruleId}:HOUSE_${houseNum}`,
          ruleId,
          evidenceFamily: family,
          priority: 'PRIMARY',
          strength: hStatus.strength,
          effect,
          statement,
          houses: [houseNum],
          planets: hStatus.occupants.length > 0 ? hStatus.occupants : (hStatus.lord ? [hStatus.lord] : undefined),
          conditional: false,
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  };
}

function createHouseLinkRule(
  hA: number,
  hB: number,
  family: WealthEvidenceFamily
): WealthRule {
  const ruleId = `WEALTH_${hA}H_${hB}H_LINK_001`;
  const is11Related = hA === 11 || hB === 11;
  const is2And11 = (hA === 2 && hB === 11) || (hA === 11 && hB === 2);
  const priority = is11Related ? 'PRIMARY' : 'SECONDARY';
  const strength = is2And11 ? 'STRONG' : 'MODERATE';

  return {
    id: ruleId,
    evidenceFamily: family,
    priority,
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const link = checkWealthHouseLink(context, hA, hB);
      if (link.linked) {
        const evidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
          id: `${ruleId}:HOUSES_${hA}_${hB}`,
          ruleId,
          evidenceFamily: family,
          priority,
          strength,
          effect: link.effect,
          statement: `Connection between house ${hA} and house ${hB}: ${link.reason}`,
          houses: [hA, hB],
          planets: [link.lA, link.lB].filter((p): p is NonNullable<typeof p> => p !== undefined),
          conditional: link.effect !== 'SUPPORT',
          dimension: 'NATAL_STRUCTURE'
        };
        return { triggered: true, evidence };
      }
      return { triggered: false };
    }
  };
}

export const wealthHouseRules: readonly WealthRule[] = Object.freeze([
  createHouseStatusRule(2, WealthEvidenceFamily.SECOND_HOUSE, 'STRONG'),
  createHouseStatusRule(2, WealthEvidenceFamily.SECOND_HOUSE, 'AFFLICTION'),
  createHouseStatusRule(11, WealthEvidenceFamily.ELEVENTH_HOUSE, 'STRONG'),
  createHouseStatusRule(11, WealthEvidenceFamily.ELEVENTH_HOUSE, 'AFFLICTION'),
  createHouseStatusRule(9, WealthEvidenceFamily.NINTH_HOUSE, 'STRONG'),
  createHouseStatusRule(9, WealthEvidenceFamily.NINTH_HOUSE, 'AFFLICTION'),
  createHouseStatusRule(5, WealthEvidenceFamily.FIFTH_HOUSE, 'STRONG'),
  createHouseStatusRule(5, WealthEvidenceFamily.FIFTH_HOUSE, 'AFFLICTION'),
  createHouseLinkRule(2, 11, WealthEvidenceFamily.ELEVENTH_HOUSE),
  createHouseLinkRule(2, 9, WealthEvidenceFamily.NINTH_HOUSE),
  createHouseLinkRule(2, 5, WealthEvidenceFamily.FIFTH_HOUSE),
  createHouseLinkRule(5, 11, WealthEvidenceFamily.ELEVENTH_HOUSE),
  createHouseLinkRule(9, 11, WealthEvidenceFamily.ELEVENTH_HOUSE),
  createHouseLinkRule(5, 9, WealthEvidenceFamily.NINTH_HOUSE)
]);
