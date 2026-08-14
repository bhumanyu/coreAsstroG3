import { ThemeInterpretationContext } from '../themeInterpretationContext';
import {
  VargaRelationship,
  VargaThemeEvidence,
  CareerNatalPromise,
  D10EvaluationDiagnostics
} from '../themeInterpretationTypes';
import { getHouseLord } from '../themeInterpretationUtils';
import { evaluateHouseStatus } from './houseEvaluator';
import { evaluateHouseLord } from './lordEvaluator';

export function getD1CareerPromiseLevel(
  context: ThemeInterpretationContext
): 'STRONG' | 'NEUTRAL' | 'ADVERSE' | 'UNAVAILABLE' {
  const natal10L = getHouseLord(context, 10);
  if (!natal10L) {
    return 'UNAVAILABLE';
  }
  const h10 = evaluateHouseStatus(context, 10);
  const lord10 = evaluateHouseLord(context, 10);

  const isStrong = h10.status === 'STRONG' || h10.effect === 'SUPPORT' || lord10.effect === 'SUPPORT';
  const isAdverse = h10.status === 'AFFLICTED' || h10.effect === 'CHALLENGE' || lord10.effect === 'CHALLENGE';

  if (isStrong && !isAdverse) return 'STRONG';
  if (isAdverse && !isStrong) return 'ADVERSE';
  return 'NEUTRAL';
}

export function getD10EvaluationDiagnostics(
  context: ThemeInterpretationContext
): D10EvaluationDiagnostics | undefined {
  if (!context.divisionalInterpretation?.d10) {
    return undefined;
  }
  const d10 = context.divisionalInterpretation.d10;
  const natal10L = getHouseLord(context, 10);

  const d10TenthHouse = d10.houses?.find((h) => h.house === 10);
  const d10Lord = d10TenthHouse?.lord;

  const d10LordPlanetInfo = d10Lord ? d10.planets?.[d10Lord] : undefined;
  const natal10LInD10 = natal10L ? d10.planets?.[natal10L] : undefined;
  const d1Comparison = natal10L ? context.divisionalInterpretation.d1Comparisons?.[natal10L] : undefined;

  const isD10Vargottama = d1Comparison?.isD10Vargottama ?? false;

  const isD10LordStrong =
    d10LordPlanetInfo?.dignity === 'EXALTED' ||
    d10LordPlanetInfo?.dignity === 'OWN_SIGN' ||
    d10LordPlanetInfo?.house === 10;

  const isNatal10LStrongInD10 =
    natal10LInD10?.dignity === 'EXALTED' ||
    natal10LInD10?.dignity === 'OWN_SIGN' ||
    isD10Vargottama ||
    natal10LInD10?.house === 10;

  const isD10LordAdverse = d10LordPlanetInfo?.dignity === 'DEBILITATED';
  const isNatal10LAdverseInD10 = natal10LInD10?.dignity === 'DEBILITATED';

  const d10SupportFactors: string[] = [];
  if (d10LordPlanetInfo?.dignity === 'EXALTED') d10SupportFactors.push(`D10 10th lord (${d10Lord}) is exalted in D10`);
  if (d10LordPlanetInfo?.dignity === 'OWN_SIGN') d10SupportFactors.push(`D10 10th lord (${d10Lord}) is in own sign in D10`);
  if (d10LordPlanetInfo?.house === 10) d10SupportFactors.push(`D10 10th lord (${d10Lord}) is placed in 10th house of D10`);
  if (natal10LInD10?.dignity === 'EXALTED') d10SupportFactors.push(`Natal 10th lord (${natal10L}) is exalted in D10`);
  if (natal10LInD10?.dignity === 'OWN_SIGN') d10SupportFactors.push(`Natal 10th lord (${natal10L}) is in own sign in D10`);
  if (isD10Vargottama) d10SupportFactors.push(`Natal 10th lord (${natal10L}) is D10 Vargottama`);
  if (natal10LInD10?.house === 10) d10SupportFactors.push(`Natal 10th lord (${natal10L}) is placed in 10th house of D10`);

  const d10ChallengeFactors: string[] = [];
  if (isD10LordAdverse) d10ChallengeFactors.push(`D10 10th lord (${d10Lord}) is debilitated in D10`);
  if (isNatal10LAdverseInD10) d10ChallengeFactors.push(`Natal 10th lord (${natal10L}) is debilitated in D10`);

  return Object.freeze({
    d10Lord,
    d10LordHouse: d10LordPlanetInfo?.house,
    d10LordDignity: d10LordPlanetInfo?.dignity,
    natal10Lord: natal10L,
    natal10LordHouse: natal10LInD10?.house,
    natal10LordDignity: natal10LInD10?.dignity,
    d10LordStrong: isD10LordStrong,
    d10LordAdverse: isD10LordAdverse,
    natal10LordStrong: isNatal10LStrongInD10,
    natal10LordAdverse: isNatal10LAdverseInD10,
    d10SupportFactors: Object.freeze(d10SupportFactors),
    d10ChallengeFactors: Object.freeze(d10ChallengeFactors)
  });
}

export function getD10CareerExpressionLevel(
  context: ThemeInterpretationContext
): 'STRONG' | 'NEUTRAL' | 'ADVERSE' | 'UNAVAILABLE' {
  if (!context.divisionalInterpretation?.d10) {
    return 'UNAVAILABLE';
  }
  const d10 = context.divisionalInterpretation.d10;
  const natal10L = getHouseLord(context, 10);

  const d10TenthHouse = d10.houses?.find((h) => h.house === 10);
  const d10Lord = d10TenthHouse?.lord;

  const d10LordPlanetInfo = d10Lord ? d10.planets?.[d10Lord] : undefined;
  const natal10LInD10 = natal10L ? d10.planets?.[natal10L] : undefined;
  const d1Comparison = natal10L ? context.divisionalInterpretation.d1Comparisons?.[natal10L] : undefined;

  const isVargottama = d1Comparison?.isD10Vargottama ?? false;

  const isD10LordStrong =
    d10LordPlanetInfo?.dignity === 'EXALTED' ||
    d10LordPlanetInfo?.dignity === 'OWN_SIGN' ||
    d10LordPlanetInfo?.house === 10;

  const isNatal10LStrongInD10 =
    natal10LInD10?.dignity === 'EXALTED' ||
    natal10LInD10?.dignity === 'OWN_SIGN' ||
    isVargottama ||
    natal10LInD10?.house === 10;

  const isD10LordAdverse = d10LordPlanetInfo?.dignity === 'DEBILITATED';
  const isNatal10LAdverseInD10 = natal10LInD10?.dignity === 'DEBILITATED';

  const isStrong = isD10LordStrong || isNatal10LStrongInD10;
  const isAdverse = isD10LordAdverse || isNatal10LAdverseInD10;

  if (isStrong && !isAdverse) return 'STRONG';
  if (isAdverse && !isStrong) return 'ADVERSE';
  return 'NEUTRAL';
}

export function evaluateD10VargaConfirmation(
  context: ThemeInterpretationContext,
  natalPromise?: CareerNatalPromise | 'STRONG' | 'NEUTRAL' | 'ADVERSE' | 'UNAVAILABLE'
): VargaThemeEvidence {
  let d1Level: 'STRONG' | 'NEUTRAL' | 'ADVERSE' | 'UNAVAILABLE' = 'UNAVAILABLE';

  if (natalPromise) {
    if (typeof natalPromise === 'string') {
      d1Level = natalPromise;
    } else {
      switch (natalPromise.status) {
        case 'STRONG':
        case 'SUPPORTED':
          d1Level = 'STRONG';
          break;
        case 'MIXED':
          d1Level = 'NEUTRAL';
          break;
        case 'ADVERSE':
          d1Level = 'ADVERSE';
          break;
        case 'UNAVAILABLE':
        default:
          d1Level = 'UNAVAILABLE';
          break;
      }
    }
  } else {
    d1Level = getD1CareerPromiseLevel(context);
  }

  const d10Level = getD10CareerExpressionLevel(context);
  const diagnostics = getD10EvaluationDiagnostics(context);

  if (d1Level === 'UNAVAILABLE' || d10Level === 'UNAVAILABLE') {
    return Object.freeze({
      varga: 'D10',
      relationship: 'UNAVAILABLE',
      statement: 'D10 Dasamsa divisional interpretation or D1 career promise is unavailable.',
      effect: 'NEUTRAL',
      diagnostics
    });
  }

  let relationship: VargaRelationship = 'UNAVAILABLE';
  let effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
  let statement = 'D10 Dasamsa chart provides no explicit career confirmation details.';

  if (d1Level === 'STRONG' && d10Level === 'STRONG') {
    relationship = 'CONFIRMS';
    effect = 'SUPPORT';
    statement = 'D10 Dasamsa chart confirms strong natal 10th house career promise through supportive divisional placement and dignity.';
  } else if (d1Level === 'STRONG' && d10Level === 'NEUTRAL') {
    relationship = 'PARTIALLY_CONFIRMS';
    effect = 'NEUTRAL';
    statement = 'D10 Dasamsa provides a mixed or neutral expression of the natal career promise and does not override the underlying D1 structure.';
  } else if (d1Level === 'STRONG' && d10Level === 'ADVERSE') {
    relationship = 'CONFLICTS';
    effect = 'CHALLENGE';
    statement = 'D10 Dasamsa provides a significant challenge to the natal career promise through adverse divisional indicators.';
  } else if ((d1Level === 'ADVERSE' || d1Level === 'NEUTRAL') && d10Level === 'STRONG') {
    relationship = 'MODIFIES';
    effect = 'NEUTRAL';
    statement = 'Strong D10 divisional career alignment modifies D1 career expectations.';
  } else if (d1Level === 'ADVERSE' && d10Level === 'ADVERSE') {
    relationship = 'CONFLICTS';
    effect = 'CHALLENGE';
    statement = 'D10 Dasamsa chart reflects divisional challenges matching D1 career friction.';
  } else {
    relationship = 'UNAVAILABLE';
    effect = 'NEUTRAL';
    statement = 'D10 Dasamsa chart provides no explicit career confirmation details.';
  }

  return Object.freeze({
    varga: 'D10',
    relationship,
    statement,
    effect,
    diagnostics
  });
}


