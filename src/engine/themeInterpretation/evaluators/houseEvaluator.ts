import { Planet } from '../../../types';
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
    } else if ((hi as any).status || (hi as any).effect) {
      if ((hi as any).status) {
        status = (hi as any).status;
        if (status === 'STRONG' && !(hi as any).effect) effect = 'SUPPORT';
        if (status === 'AFFLICTED' && !(hi as any).effect) effect = 'CHALLENGE';
        if (status === 'STRONG' && !(hi as any).strength) strength = 'STRONG';
      }
      if ((hi as any).effect) effect = (hi as any).effect;
      if ((hi as any).strength) strength = (hi as any).strength;
    }
  } else if (ha && ((ha as any).status || (ha as any).effect)) {
    if ((ha as any).status) {
      status = (ha as any).status;
      if (status === 'STRONG' && !(ha as any).effect) effect = 'SUPPORT';
      if (status === 'AFFLICTED' && !(ha as any).effect) effect = 'CHALLENGE';
      if (status === 'STRONG' && !(ha as any).strength) strength = 'STRONG';
    }
    if ((ha as any).effect) effect = (ha as any).effect;
    if ((ha as any).strength) strength = (ha as any).strength;
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
    summaryStatement
  });
}
