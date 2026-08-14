import { Planet } from '../../../../types';
import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence,
  ThemeEvidenceFactor
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateDignity } from '../../evaluators/dignityEvaluator';
import { evaluateFunctionalRoles } from '../../evaluators/functionalRoleEvaluator';
import { evaluatePlanetaryStrength } from '../../evaluators/strengthEvaluator';
import { evaluateCareerYogas } from '../../evaluators/yogaEvaluator';
import { getDignity, getHouseLord } from '../../themeInterpretationUtils';

function evaluateKarakaPlanet(
  context: ThemeInterpretationContext,
  planet: Planet,
  family: CareerEvidenceFamily,
  ruleId: string,
  karakaTitle: string,
  traitDescription: string
): ThemeRuleResult {
  let house: number | undefined = undefined;
  if (context.planetInterpretation?.planets?.[planet]?.placement?.house) {
    house = context.planetInterpretation.planets[planet].placement.house;
  } else if ((context.planetAnalysis?.planets?.[planet] as any)?.house) {
    house = (context.planetAnalysis!.planets[planet] as any).house;
  } else if (context.horoscope?.planetFacts?.[planet]?.house) {
    house = context.horoscope.planetFacts[planet].house;
  } else if (context.horoscope?.planetFacts?.[planet]?.position?.house) {
    house = context.horoscope.planetFacts[planet].position.house;
  }

  const roleFacts = evaluateFunctionalRoles(context, planet);
  const lord10 = getHouseLord(context, 10);

  let lord10House: number | undefined = undefined;
  if (lord10) {
    if (context.planetInterpretation?.planets?.[lord10]?.placement?.house) {
      lord10House = context.planetInterpretation.planets[lord10].placement.house;
    } else if ((context.planetAnalysis?.planets?.[lord10] as any)?.house) {
      lord10House = (context.planetAnalysis!.planets[lord10] as any).house;
    } else if (context.horoscope?.planetFacts?.[lord10]?.house) {
      lord10House = context.horoscope.planetFacts[lord10].house;
    } else if (context.horoscope?.planetFacts?.[lord10]?.position?.house) {
      lord10House = context.horoscope.planetFacts[lord10].position.house;
    }
  }

  // 1. Rules 10th house
  const rules10H = roleFacts.ownedHouses.includes(10) || lord10 === planet;

  // 2. Occupies 10th house
  const occupies10H = house === 10;

  // 3. Conjunct/aspects 10th house or 10th lord
  let connectsTo10HOr10L = false;

  if (house !== undefined && lord10House !== undefined && house === lord10House) {
    connectsTo10HOr10L = true;
  }

  const aspects = context.natalGrahaDrishti?.aspects || [];
  if (aspects.some((a) => a.sourcePlanet === planet && (a.targetHouse === 10 || (lord10 && a.targetPlanet === lord10)))) {
    connectsTo10HOr10L = true;
  }

  const h10Aspects = context.houseInterpretation?.houses?.[10]?.aspects?.received || [];
  if (h10Aspects.some((rx) => rx.sourcePlanets?.includes(planet))) {
    connectsTo10HOr10L = true;
  }

  // 4. Participates in a career-relevant Yoga in context.yogas
  let participatesInCareerYoga = false;
  const careerYogas = evaluateCareerYogas(context);
  if (careerYogas.length > 0) {
    if (context.yogas?.yogas) {
      for (const y of context.yogas.yogas) {
        if (y.planets?.includes(planet)) {
          participatesInCareerYoga = true;
          break;
        }
      }
    }
  }

  // 5. Rules/occupies another career house (6/11/2) AND has a direct relationship to 10H/10L
  const rulesOrOccupiesOtherCareerHouse =
    house === 6 || house === 11 || house === 2 ||
    roleFacts.ownedHouses.includes(6) || roleFacts.ownedHouses.includes(11) || roleFacts.ownedHouses.includes(2);

  const isRelevant =
    rules10H ||
    occupies10H ||
    connectsTo10HOr10L ||
    participatesInCareerYoga ||
    (rulesOrOccupiesOtherCareerHouse && connectsTo10HOr10L);

  if (!isRelevant) {
    return { triggered: false };
  }

  const dignity = getDignity(context, planet);
  const dignityEval = evaluateDignity(dignity);
  const strengthFacts = evaluatePlanetaryStrength(context, planet);

  const factors: ThemeEvidenceFactor[] = [
    {
      label: 'Natural Karaka Role',
      value: `${planet} (${karakaTitle})`,
      role: 'PRIMARY'
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

  let effect = dignityEval.effect;
  let conditional = false;

  if (occupies10H || rules10H) {
    effect = dignityEval.effect === 'CHALLENGE' ? 'CHALLENGE' : 'SUPPORT';
    conditional = dignityEval.effect === 'CHALLENGE';
  } else if (effect === 'CHALLENGE') {
    conditional = true;
  }

  const statement = `${planet} (${karakaTitle}) is placed in house ${house || 'N/A'} with ${dignityEval.dignity || 'standard'} dignity and connects to career factors. ${traitDescription}`;

  const evidence: ThemeInterpretationEvidence = {
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
    dimension: rules10H || occupies10H ? 'NATAL_STRUCTURE' : 'MODIFIER'
  };

  return { triggered: true, evidence };
}

export const careerPlanetRules: readonly ThemeRule[] = Object.freeze([
  // Sun
  {
    id: 'CAREER_SUN_RELEVANCE_001',
    evidenceFamily: CareerEvidenceFamily.SUN,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      return evaluateKarakaPlanet(
        context,
        Planet.SUN,
        CareerEvidenceFamily.SUN,
        'CAREER_SUN_RELEVANCE_001',
        'Karaka for Public Status & Authority',
        'Sun governs public visibility, managerial authority, executive dignity, and government standing.'
      );
    }
  },

  // Saturn
  {
    id: 'CAREER_SATURN_RELEVANCE_001',
    evidenceFamily: CareerEvidenceFamily.SATURN,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      return evaluateKarakaPlanet(
        context,
        Planet.SATURN,
        CareerEvidenceFamily.SATURN,
        'CAREER_SATURN_RELEVANCE_001',
        'Karaka for Karma & Professional Endurance',
        'Saturn governs career discipline, long-term perseverance, institutional structures, and labor duties.'
      );
    }
  },

  // Mercury
  {
    id: 'CAREER_MERCURY_RELEVANCE_001',
    evidenceFamily: CareerEvidenceFamily.MERCURY,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      return evaluateKarakaPlanet(
        context,
        Planet.MERCURY,
        CareerEvidenceFamily.MERCURY,
        'CAREER_MERCURY_RELEVANCE_001',
        'Karaka for Commerce & Analytical Intellect',
        'Mercury governs commercial transactions, analytical reasoning, communication skills, and trade skills.'
      );
    }
  },

  // Mars
  {
    id: 'CAREER_MARS_RELEVANCE_001',
    evidenceFamily: CareerEvidenceFamily.MARS,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      return evaluateKarakaPlanet(
        context,
        Planet.MARS,
        CareerEvidenceFamily.MARS,
        'CAREER_MARS_RELEVANCE_001',
        'Karaka for Executive Drive & Technical Initiative',
        'Mars provides executive energy, decisive initiative, courage in leadership, and technical problem solving.'
      );
    }
  },

  // Jupiter
  {
    id: 'CAREER_JUPITER_RELEVANCE_001',
    evidenceFamily: CareerEvidenceFamily.JUPITER,
    priority: 'SECONDARY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      return evaluateKarakaPlanet(
        context,
        Planet.JUPITER,
        CareerEvidenceFamily.JUPITER,
        'CAREER_JUPITER_RELEVANCE_001',
        'Karaka for Executive Wisdom & Guidance',
        'Jupiter provides ethical expansion, high-level counsel, administrative wisdom, and organizational guidance.'
      );
    }
  }
]);
