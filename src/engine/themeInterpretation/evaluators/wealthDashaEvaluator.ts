import { Planet } from '../../../types';
import type { ThemeInterpretationContext } from '../themeInterpretationContext';
import type { WealthTimingEvidence } from '../wealthThemeInterpretationTypes';
import { evaluateHouseStatus } from './houseEvaluator';
import { getHouseLord } from '../themeInterpretationUtils';
import { defaultDomainActivationRuleProvider } from '../../dashaInterpretation/domainActivationRuleProvider';

export function evaluateWealthDashaTiming(
  context: ThemeInterpretationContext
): readonly WealthTimingEvidence[] {
  const results: WealthTimingEvidence[] = [];

  const dashaRep = context.dashaInterpretation;
  const current = dashaRep?.current || dashaRep?.activePeriods;
  if (!current) {
    return Object.freeze([]);
  }

  const wealthHouses = defaultDomainActivationRuleProvider.getRelevantHouses('WEALTH');

  const checkPeriod = (
    level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA',
    lordPlanet?: Planet
  ) => {
    if (!lordPlanet) return;

    let isRelevant = false;
    let reason = '';
    const houses: number[] = [];
    let relevanceType:
      | 'WEALTH_LORD'
      | 'WEALTH_HOUSE_OCCUPANT'
      | 'WEALTH_HOUSE_ASPECT'
      | 'WEALTH_LORD_ASPECT'
      | undefined;

    // Check if lord of 2H, 11H, 9H, 5H
    for (const hNum of wealthHouses) {
      const houseLord = getHouseLord(context, hNum);
      if (houseLord === lordPlanet) {
        isRelevant = true;
        houses.push(hNum);
        reason += `${lordPlanet} is lord of house ${hNum}. `;
        if (!relevanceType) {
          relevanceType = 'WEALTH_LORD';
        }
      }
      const hStatus = evaluateHouseStatus(context, hNum);
      if (hStatus.occupants.includes(lordPlanet)) {
        isRelevant = true;
        if (!houses.includes(hNum)) houses.push(hNum);
        reason += `${lordPlanet} occupies house ${hNum}. `;
        if (!relevanceType) {
          relevanceType = 'WEALTH_HOUSE_OCCUPANT';
        }
      }
    }

    // Check if aspecting wealth houses or wealth lords
    const wealthLords = wealthHouses.map((h) => getHouseLord(context, h)).filter((p): p is Planet => !!p);
    const aspects = context.natalGrahaDrishti?.aspects || [];
    for (const wh of wealthHouses) {
      if (aspects.some((a) => a.sourcePlanet === lordPlanet && a.targetHouse === wh)) {
        isRelevant = true;
        if (!houses.includes(wh)) houses.push(wh);
        reason += `${lordPlanet} aspects house ${wh}. `;
        if (!relevanceType) {
          relevanceType = 'WEALTH_HOUSE_ASPECT';
        }
      }
    }
    for (const wl of wealthLords) {
      if (aspects.some((a) => a.sourcePlanet === lordPlanet && a.targetPlanet === wl)) {
        isRelevant = true;
        reason += `${lordPlanet} aspects wealth lord ${wl}. `;
        if (!relevanceType) {
          relevanceType = 'WEALTH_LORD_ASPECT';
        }
      }
    }

    // If already relevant through chart linkage, append natural karaka context if applicable
    if (isRelevant && (lordPlanet === Planet.JUPITER || lordPlanet === Planet.VENUS || lordPlanet === Planet.MERCURY)) {
      reason += `${lordPlanet} is a natural wealth significator. `;
    }

    if (isRelevant) {
      results.push(
        Object.freeze({
          dashaLevel: level,
          planet: lordPlanet,
          relevanceReason: reason.trim(),
          houses: Object.freeze(houses),
          relevanceType
        })
      );
    }
  };

  const mdLord = current.mahadasha?.planet || current.mahadasha?.natal?.planet || current.mahadasha?.lord;
  const adLord = current.antardasha?.planet || current.antardasha?.natal?.planet || current.antardasha?.lord;
  const pdLord = current.pratyantardasha?.planet || current.pratyantardasha?.natal?.planet || current.pratyantardasha?.lord;

  if (mdLord) checkPeriod('MAHADASHA', mdLord);
  if (adLord) checkPeriod('ANTARDASHA', adLord);
  if (pdLord) checkPeriod('PRATYANTARDASHA', pdLord);

  return Object.freeze(results);
}
