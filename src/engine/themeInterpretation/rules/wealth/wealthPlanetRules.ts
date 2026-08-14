import { Planet } from '../../../../types';
import {
  ThemeRuleResult,
  ThemeInterpretationEvidence,
  ThemeEvidenceFactor
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateDignity } from '../../evaluators/dignityEvaluator';
import { evaluateFunctionalRoles } from '../../evaluators/functionalRoleEvaluator';
import { evaluatePlanetaryStrength } from '../../evaluators/strengthEvaluator';
import { evaluateWealthYogas } from '../../evaluators/wealthYogaEvaluator';
import { getDignity, getHouseLord, getPlanetHouse } from '../../themeInterpretationUtils';

const WEALTH_HOUSES = [2, 5, 9, 11];

function evaluateWealthKarakaPlanet(
  context: ThemeInterpretationContext,
  planet: Planet,
  family: WealthEvidenceFamily,
  ruleId: string,
  karakaTitle: string,
  traitDescription: string
): ThemeRuleResult<WealthEvidenceFamily> {
  const house = getPlanetHouse(context, planet);

  const roleFacts = evaluateFunctionalRoles(context, planet);

  const wealthLords = WEALTH_HOUSES.map((h) => getHouseLord(context, h)).filter(
    (p): p is Planet => p !== undefined
  );

  const ruledHouses = WEALTH_HOUSES.filter(
    (h) => roleFacts.ownedHouses.includes(h) || getHouseLord(context, h) === planet
  );
  const rulesWealthHouse = ruledHouses.length > 0;

  const occupiesWealthHouse = house !== undefined && WEALTH_HOUSES.includes(house);

  const aspectedWealthHouses: number[] = [];
  const aspectedWealthLords: Planet[] = [];
  const conjunctWealthLords: Planet[] = [];

  const aspects = context.natalGrahaDrishti?.aspects || [];

  for (const wh of WEALTH_HOUSES) {
    if (aspects.some((a) => a.sourcePlanet === planet && a.targetHouse === wh)) {
      aspectedWealthHouses.push(wh);
    }
  }

  for (const wl of wealthLords) {
    if (aspects.some((a) => a.sourcePlanet === planet && a.targetPlanet === wl)) {
      aspectedWealthLords.push(wl);
    }
    const wlHouse = getPlanetHouse(context, wl);

    if (house !== undefined && wlHouse !== undefined && house === wlHouse) {
      conjunctWealthLords.push(wl);
    }
  }

  const connectsToWealthFactors =
    aspectedWealthHouses.length > 0 ||
    aspectedWealthLords.length > 0 ||
    conjunctWealthLords.length > 0;

  const wealthYogas = evaluateWealthYogas(context);
  const participatesInWealthYoga = wealthYogas.some((y) => y.planets.includes(planet));

  const isRelevant =
    rulesWealthHouse ||
    occupiesWealthHouse ||
    connectsToWealthFactors ||
    participatesInWealthYoga;

  if (!isRelevant) {
    return { triggered: false };
  }

  const relevanceParts: string[] = [];
  if (rulesWealthHouse) {
    relevanceParts.push(`rules house ${ruledHouses.join(', ')}`);
  }
  if (occupiesWealthHouse && house !== undefined) {
    relevanceParts.push(`occupies house ${house}`);
  }
  if (aspectedWealthHouses.length > 0) {
    relevanceParts.push(`aspects house ${aspectedWealthHouses.join(', ')}`);
  }
  if (aspectedWealthLords.length > 0) {
    relevanceParts.push(`aspects wealth lord ${aspectedWealthLords.join(', ')}`);
  }
  if (conjunctWealthLords.length > 0) {
    relevanceParts.push(`conjunct wealth lord ${conjunctWealthLords.join(', ')}`);
  }
  if (participatesInWealthYoga) {
    relevanceParts.push('participates in a wealth Yoga');
  }

  const relevanceDescription = relevanceParts.join('; ') || 'Relates to financial indicators';

  const dignity = getDignity(context, planet);
  const dignityEval = evaluateDignity(dignity);
  const strengthFacts = evaluatePlanetaryStrength(context, planet);

  const factors: ThemeEvidenceFactor[] = [
    {
      label: 'Wealth Relevance',
      value: relevanceDescription,
      role: 'PRIMARY'
    },
    {
      label: 'Natural Significator',
      value: `${planet} (${karakaTitle})`,
      role: 'MODIFIER'
    },
    {
      label: 'Karaka Significance',
      value: traitDescription,
      role: 'MODIFIER'
    },
    {
      label: 'Dignity',
      value: dignityEval.dignity ? String(dignityEval.dignity) : 'Neutral/Undetermined',
      role: 'MODIFIER'
    },
    {
      label: 'House Placement',
      value: house ? `Placed in house ${house}` : 'House undetermined',
      role: 'MODIFIER'
    },
    {
      label: 'Functional Roles',
      value: roleFacts.roles.join(', ') || 'Standard',
      role: 'MODIFIER'
    }
  ];

  if (strengthFacts.available) {
    factors.push({
      label: 'Shadbala Strength',
      value: strengthFacts.statement,
      role: 'CONFIRMATION'
    });
  }

  const effect = dignityEval.effect;
  const conditional = effect !== 'SUPPORT';

  const statement = `${planet} (${karakaTitle}) is placed in house ${house || 'N/A'} with ${dignityEval.dignity || 'standard'} dignity and relates to financial indicators. ${traitDescription}`;

  const evidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
    id: `${ruleId}:${planet}`,
    ruleId,
    evidenceFamily: family,
    priority: 'SECONDARY',
    strength: dignityEval.strength,
    effect,
    statement,
    planets: [planet],
    houses: house ? [house] : undefined,
    factors: Object.freeze(factors),
    conditional,
    dimension: 'MODIFIER'
  };

  return { triggered: true, evidence };
}

export const wealthPlanetRules: readonly WealthRule[] = Object.freeze([
  {
    id: 'WEALTH_JUPITER_KARAKA_001',
    evidenceFamily: WealthEvidenceFamily.JUPITER,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> =>
      evaluateWealthKarakaPlanet(
        context,
        Planet.JUPITER,
        WealthEvidenceFamily.JUPITER,
        'WEALTH_JUPITER_KARAKA_001',
        'Dhana Karaka / Universal Wealth Significator',
        'Jupiter naturally signifies broad prosperity, financial abundance, liquid capital, and ethical growth.'
      )
  },
  {
    id: 'WEALTH_VENUS_KARAKA_001',
    evidenceFamily: WealthEvidenceFamily.VENUS,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> =>
      evaluateWealthKarakaPlanet(
        context,
        Planet.VENUS,
        WealthEvidenceFamily.VENUS,
        'WEALTH_VENUS_KARAKA_001',
        'Lakshmi / Prosperity Significator',
        'Venus signifies material luxuries, conveyances, landed comforts, aesthetic wealth, and tangible assets.'
      )
  },
  {
    id: 'WEALTH_MERCURY_KARAKA_001',
    evidenceFamily: WealthEvidenceFamily.MERCURY,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> =>
      evaluateWealthKarakaPlanet(
        context,
        Planet.MERCURY,
        WealthEvidenceFamily.MERCURY,
        'WEALTH_MERCURY_KARAKA_001',
        'Commerce & Trade Significator',
        'Mercury signifies commercial intelligence, business profits, financial transactions, and liquid assets.'
      )
  }
]);
