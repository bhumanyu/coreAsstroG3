import { Planet } from '../../../types';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { CareerTimingEvidence } from '../themeInterpretationTypes';
import { getHouseLord } from '../themeInterpretationUtils';
import { defaultDomainActivationRuleProvider } from '../../dashaInterpretation/domainActivationRuleProvider';

export function evaluateCareerDashaTiming(
  context: ThemeInterpretationContext
): readonly CareerTimingEvidence[] {
  const results: CareerTimingEvidence[] = [];

  const dashaRep = context.dashaInterpretation;
  const current = dashaRep?.current || (dashaRep as any)?.activePeriods;
  if (!current) {
    return Object.freeze([]);
  }

  const checkPeriod = (
    level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA',
    lordPlanet?: Planet
  ) => {
    if (!lordPlanet) return;

    let isRelevant = false;
    let reason = '';
    const houses: number[] = [];

    // Canonical career domain houses sourced from DomainActivationRuleProvider (10, 6, 2, 11) + Lagna (1)
    const canonicalCareerHouses = defaultDomainActivationRuleProvider.getRelevantHouses('CAREER');
    const careerHousesToCheck = Array.from(new Set([...canonicalCareerHouses, 1]));

    for (const hNum of careerHousesToCheck) {
      const houseLord = getHouseLord(context, hNum);
      if (houseLord === lordPlanet) {
        isRelevant = true;
        houses.push(hNum);
        reason += `${lordPlanet} is lord of house ${hNum}. `;
      }
      const hInfo = context.houseInterpretation?.houses?.[hNum];
      if (hInfo?.occupants) {
        const occList = Array.isArray(hInfo.occupants)
          ? hInfo.occupants.map((o: any) => typeof o === 'string' ? o : o.planet)
          : [];
        if (occList.includes(lordPlanet)) {
          isRelevant = true;
          if (!houses.includes(hNum)) houses.push(hNum);
          reason += `${lordPlanet} occupies house ${hNum}. `;
        }
      }
    }

    // Check if conjunct or aspecting 10H or 10L
    const lord10 = getHouseLord(context, 10);
    const aspects = context.natalGrahaDrishti?.aspects || [];
    if (aspects.some((a) => a.sourcePlanet === lordPlanet && (a.targetHouse === 10 || (lord10 && a.targetPlanet === lord10)))) {
      isRelevant = true;
      reason += `${lordPlanet} aspects 10th house or 10th lord. `;
    }

    if (isRelevant) {
      results.push(
        Object.freeze({
          dashaLevel: level,
          planet: lordPlanet,
          relevanceReason: reason.trim(),
          houses: Object.freeze(houses)
        })
      );
    }
  };

  const mdLord = current.mahadasha?.planet || current.mahadasha?.natal?.planet || (current.mahadasha as any)?.lord;
  const adLord = current.antardasha?.planet || current.antardasha?.natal?.planet || (current.antardasha as any)?.lord;
  const pdLord = current.pratyantardasha?.planet || current.pratyantardasha?.natal?.planet || (current.pratyantardasha as any)?.lord;

  if (mdLord) checkPeriod('MAHADASHA', mdLord);
  if (adLord) checkPeriod('ANTARDASHA', adLord);
  if (pdLord) checkPeriod('PRATYANTARDASHA', pdLord);

  return Object.freeze(results);
}
