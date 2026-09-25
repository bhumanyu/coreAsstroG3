import { Planet, DignityStatus } from '../../../types';
import type { HouseAnalysis } from '../../../types';
import type { HouseInterpretation } from '../../houseInterpretation/houseInterpretationTypes';
import type { ThemeInterpretationContext } from '../themeInterpretationContext';
import type { ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface HouseEvaluationFacts {
  readonly house: number;
  readonly lord?: Planet;
  readonly occupants: readonly Planet[];
  readonly status: 'STRONG' | 'AFFLICTED' | 'NEUTRAL';
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly summaryStatement: string;
  readonly lordDignity?: DignityStatus | string;
  readonly hasAfflictedLordOrOccupant: boolean;
}

export function evaluateHouseStatus(
  context: ThemeInterpretationContext,
  houseNum: number
): HouseEvaluationFacts {
  let lord: Planet | undefined = undefined;
  let occupants: Planet[] = [];

  const hi: HouseInterpretation | undefined = context.houseInterpretation?.houses?.[houseNum];
  const ha: HouseAnalysis | undefined = context.houseAnalysis?.houses
    ? (Array.isArray(context.houseAnalysis.houses)
      ? context.houseAnalysis.houses.find((h: HouseAnalysis) => h.house === houseNum)
      : (context.houseAnalysis.houses as Record<number, HouseAnalysis>)[houseNum])
    : undefined;

  if (hi) {
    lord = hi.placement?.signLord ?? (hi as any).lord;
    if (hi.occupants?.planets) {
      occupants = [...hi.occupants.planets];
    } else if (Array.isArray((hi as any).occupants)) {
      occupants = [...(hi as any).occupants];
    }
  } else if (ha) {
    lord = ha.lord;
    if (ha.occupants) {
      occupants = [...ha.occupants];
    }
  }

  const bhavaFacts = context.horoscope?.bhavaFacts ?? context.horoscope?.bhavas;
  if (!lord && bhavaFacts?.[houseNum]?.lord) {
    lord = bhavaFacts[houseNum].lord;
  }
  if (occupants.length === 0 && bhavaFacts?.[houseNum]?.occupants) {
    occupants = [...bhavaFacts[houseNum].occupants];
  }

  let status: 'STRONG' | 'AFFLICTED' | 'NEUTRAL' = 'NEUTRAL';
  let effect: ThemeEvidenceEffect = 'NEUTRAL';
  let strength: ThemeEvidenceStrength = 'MODERATE';

  if (hi) {
    const hasChallengingFactors = hi.summary?.challengingFactors && hi.summary.challengingFactors.length > 0;
    const hasSupportingFactors = hi.summary?.supportingFactors && hi.summary.supportingFactors.length > 0;

    if (hasChallengingFactors && !hasSupportingFactors) {
      status = 'AFFLICTED';
      effect = 'CHALLENGE';
      strength = 'MODERATE';
    } else if (hasSupportingFactors && !hasChallengingFactors) {
      status = 'STRONG';
      effect = 'SUPPORT';
      strength = 'STRONG';
    } else if (hasSupportingFactors && hasChallengingFactors) {
      status = 'NEUTRAL';
      effect = 'NEUTRAL';
      strength = 'MODERATE';
    } else if (!hi.summary && (hi as any).status) {
      const flatStatus = (hi as any).status as 'STRONG' | 'AFFLICTED' | 'NEUTRAL';
      if (flatStatus === 'STRONG') {
        status = 'STRONG';
        effect = 'SUPPORT';
        strength = 'STRONG';
      } else if (flatStatus === 'AFFLICTED') {
        status = 'AFFLICTED';
        effect = 'CHALLENGE';
        strength = 'MODERATE';
      }
    }
  }

  // Check lord and occupant dignity from planetInterpretation
  let lordDignity: DignityStatus | string | undefined = undefined;
  let hasAfflictedLordOrOccupant = false;

  if (lord && context.planetInterpretation?.planets?.[lord]) {
    const lordDignityRaw = context.planetInterpretation.planets[lord].dignity;
    lordDignity = typeof lordDignityRaw === 'string' ? lordDignityRaw : (lordDignityRaw as any)?.status;
    const lordDignityStr = String(lordDignity).toUpperCase();
    if (lordDignityStr === DignityStatus.DEBILITATED || lordDignityStr === 'AFFLICTED') {
      hasAfflictedLordOrOccupant = true;
    }
  }

  for (const occupant of occupants) {
    if (context.planetInterpretation?.planets?.[occupant]) {
      const occDignityRaw = context.planetInterpretation.planets[occupant].dignity;
      const occDignity = typeof occDignityRaw === 'string' ? occDignityRaw : (occDignityRaw as any)?.status;
      const occDignityStr = String(occDignity).toUpperCase();
      if (occDignityStr === DignityStatus.DEBILITATED || occDignityStr === 'AFFLICTED') {
        hasAfflictedLordOrOccupant = true;
        break;
      }
    }
  }

  const lordStr = lord ? ` Lord: ${lord}.` : '';
  const occStr = occupants.length > 0 ? ` Occupants: ${occupants.join(', ')}.` : ' No occupants.';
  const summaryStatement = `House ${houseNum} is evaluated as ${status}.${lordStr}${occStr}`;

  return Object.freeze({
    house: houseNum,
    lord,
    occupants: Object.freeze(occupants),
    status,
    effect,
    strength,
    summaryStatement,
    lordDignity,
    hasAfflictedLordOrOccupant
  });
}
