import {
  Planet,
  DignityStatus,
  PlanetCondition,
  ShadbalaAggregationStatus
} from '../../types';
import {
  YogaResult,
  YogaAnalysisInput,
  YogaModifier,
  YogaAssessment,
  YogaStrengthLevel,
  YogaType
} from './yogaTypes';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';

export interface YogaModifierRule {
  readonly ruleId: string;
  readonly appliesTo: readonly YogaType[];
  evaluate(yoga: YogaResult, input: YogaAnalysisInput): readonly YogaModifier[];
}

export interface YogaCancellationRule {
  readonly ruleId: string;
  readonly yogaTypes: readonly YogaType[];
  evaluate(yoga: YogaResult, input: YogaAnalysisInput): YogaModifier | null;
}

const ALL_YOGA_TYPES: readonly YogaType[] = Object.freeze(Object.values(YogaType));

/**
 * The engine's explicit assessment policy, not a classical scoring truth.
 * Defines category-based decision rules for determining assessment strength and final status.
 */
export const YOGA_STRENGTH_POLICY = Object.freeze({
  rules: Object.freeze({
    VERY_STRONG: 'majorSupportCount >= 2 && !hasMajorWeakening',
    STRONG: 'majorSupportCount >= 1 && !hasMajorWeakening',
    VERY_WEAK: 'majorWeakeningCount >= 2',
    WEAK: 'majorWeakeningCount >= 1',
    MODERATE: 'otherwise'
  }),
  statusRules: Object.freeze({
    CANCELLED: 'cancellationFactors.length > 0',
    WEAKENED: 'hasMajorWeakening',
    STRONG: 'hasMajorSupport',
    PRESENT: 'otherwise'
  })
});

/**
 * Evaluates dignity support (exaltation, own sign, moolatrikona) for Yoga-forming planets.
 * Applies generically to all planetary Yogas per classical Parashari principles.
 * Note: Provides generic supporting/weakening evidence for the participating planet,
 * not a complete classical Yoga strength rule.
 */
const dignitySupportRule: YogaModifierRule = {
  ruleId: 'YOGA_SUPPORT_DIGNITY_001',
  appliesTo: ALL_YOGA_TYPES,
  evaluate(yoga, input) {
    const modifiers: YogaModifier[] = [];
    for (const p of yoga.planets) {
      const dignityStatus =
        input.planetAnalysis?.planets[p]?.dignity ??
        input.planetFacts[p]?.dignity?.status;
      if (
        dignityStatus === DignityStatus.EXALTED ||
        dignityStatus === DignityStatus.OWN_SIGN ||
        dignityStatus === DignityStatus.MOOLATRIKONA
      ) {
        modifiers.push(
          Object.freeze({
            ruleId: 'YOGA_SUPPORT_DIGNITY_001',
            type: 'SUPPORT',
            category: 'MAJOR_SUPPORT',
            effect: 'POSITIVE',
            planets: Object.freeze([p]),
            reason: `Planet ${p} is in ${dignityStatus} dignity.`,
            source: 'DIGNITY'
          })
        );
      }
    }
    return Object.freeze(modifiers);
  }
};

/**
 * Evaluates debilitation weakening for Yoga-forming planets.
 * Applies generically to all planetary Yogas per classical Parashari principles.
 */
const debilitationWeakeningRule: YogaModifierRule = {
  ruleId: 'YOGA_AFFLICTION_DEBILITATION_001',
  appliesTo: ALL_YOGA_TYPES,
  evaluate(yoga, input) {
    const modifiers: YogaModifier[] = [];
    for (const p of yoga.planets) {
      const dignityStatus =
        input.planetAnalysis?.planets[p]?.dignity ??
        input.planetFacts[p]?.dignity?.status;
      if (dignityStatus === DignityStatus.DEBILITATED) {
        modifiers.push(
          Object.freeze({
            ruleId: 'YOGA_AFFLICTION_DEBILITATION_001',
            type: 'WEAKEN',
            category: 'MAJOR_WEAKENING',
            effect: 'NEGATIVE',
            planets: Object.freeze([p]),
            reason: `Planet ${p} is debilitated.`,
            source: 'DIGNITY'
          })
        );
      }
    }
    return Object.freeze(modifiers);
  }
};

/**
 * Evaluates combustion weakening for Yoga-forming planets.
 * Applies generically to all planetary Yogas per classical Parashari principles.
 */
const combustionWeakeningRule: YogaModifierRule = {
  ruleId: 'YOGA_MODIFIER_COMBUSTION_001',
  appliesTo: ALL_YOGA_TYPES,
  evaluate(yoga, input) {
    const modifiers: YogaModifier[] = [];
    for (const p of yoga.planets) {
      const condition = input.planetFacts[p]?.state?.condition;
      if (
        condition === PlanetCondition.COMBUST ||
        condition === PlanetCondition.DEEP_COMBUST
      ) {
        modifiers.push(
          Object.freeze({
            ruleId: 'YOGA_MODIFIER_COMBUSTION_001',
            type: 'AFFLICTION',
            category: 'MAJOR_WEAKENING',
            effect: 'NEGATIVE',
            planets: Object.freeze([p]),
            reason: `Planet ${p} is combust.`,
            source: 'COMBUSTION'
          })
        );
      }
    }
    return Object.freeze(modifiers);
  }
};

/**
 * Evaluates functional role support for Yoga-forming planets.
 *
 * Yogakaraka is the only documented generic functional role support in classical texts
 * for generic planetary Yogas; other roles (Lagna Lord, Trikona Lord, Kendra Lord)
 * are deferred until specific Yoga-specific rules justify their application.
 */
const functionalRoleSupportRule: YogaModifierRule = {
  ruleId: 'YOGA_SUPPORT_FUNCTIONAL_ROLE_001',
  appliesTo: ALL_YOGA_TYPES,
  evaluate(yoga, input) {
    const modifiers: YogaModifier[] = [];
    if (!input.functionalRoles?.planets) {
      return Object.freeze(modifiers);
    }
    for (const p of yoga.planets) {
      const pRoles = input.functionalRoles.planets[p];
      if (!pRoles) continue;
      if (
        pRoles.isYogakaraka ||
        pRoles.roles.includes(FunctionalRole.YOGAKARAKA)
      ) {
        const hasOwned = pRoles.ownedHouses && pRoles.ownedHouses.length > 0;
        modifiers.push(
          Object.freeze({
            ruleId: 'YOGA_SUPPORT_FUNCTIONAL_ROLE_001',
            type: 'SUPPORT',
            category: 'MAJOR_SUPPORT',
            effect: 'POSITIVE',
            planets: Object.freeze([p]),
            ...(hasOwned ? { houses: Object.freeze([...pRoles.ownedHouses]) } : {}),
            reason: `Planet ${p} holds functional role YOGAKARAKA.`,
            source: 'FUNCTIONAL_ROLE'
          })
        );
      }
    }
    return Object.freeze(modifiers);
  }
};

/**
 * Evaluates Natal Graha Drishti afflictions on Yoga-forming planets.
 *
 * Qualifying condition:
 * Fires when ALL of the following criteria are met:
 * (a) The aspecting (source) planet is a natural malefic (Saturn, Mars, Sun, Rahu, Ketu).
 *     Do NOT treat benefic aspects as afflictions.
 * (b) The aspect target is one of the Yoga-forming planets (yoga.planets).
 * (c) The aspect is an actual Graha Drishti present in input.natalGrahaDrishti.
 */
const grahaDrishtiAfflictionRule: YogaModifierRule = {
  ruleId: 'YOGA_AFFLICTION_GRAHA_DRISHTI_001',
  appliesTo: ALL_YOGA_TYPES,
  evaluate(yoga, input) {
    const modifiers: YogaModifier[] = [];
    const aspects = (input.natalGrahaDrishti as any)?.aspects || input.natalGrahaDrishti?.planetToPlanetAspects;
    if (!aspects) {
      return Object.freeze(modifiers);
    }
    const naturalMalefics: ReadonlySet<Planet> = new Set<Planet>([
      Planet.SATURN,
      Planet.MARS,
      Planet.SUN,
      Planet.RAHU,
      Planet.KETU
    ]);
    const yogaPlanetsSet: ReadonlySet<Planet> = new Set<Planet>(yoga.planets);

    for (const aspect of aspects) {
      if (
        naturalMalefics.has(aspect.sourcePlanet) &&
        yogaPlanetsSet.has(aspect.targetPlanet)
      ) {
        modifiers.push(
          Object.freeze({
            ruleId: 'YOGA_AFFLICTION_GRAHA_DRISHTI_001',
            type: 'AFFLICTION',
            category: 'MINOR_WEAKENING',
            effect: 'NEGATIVE',
            planets: Object.freeze([aspect.sourcePlanet, aspect.targetPlanet]),
            houses: Object.freeze([aspect.sourceHouse, aspect.targetHouse]),
            reason: `Natural malefic ${aspect.sourcePlanet} casts Graha Drishti aspect on Yoga planet ${aspect.targetPlanet}.`,
            source: 'NATAL_GRAHA_DRISHTI'
          })
        );
      }
    }
    return Object.freeze(modifiers);
  }
};

/*
 * Note: No Shadbala-based modifier rule is included in YOGA_MODIFIER_RULES because
 * no strength threshold policy exists in P-11 yet. Shadbala aggregation status
 * remains available in YogaAnalysisInput for assessment confidence calculation only.
 */

export const YOGA_MODIFIER_RULES: readonly YogaModifierRule[] = Object.freeze([
  dignitySupportRule,
  debilitationWeakeningRule,
  combustionWeakeningRule,
  functionalRoleSupportRule,
  grahaDrishtiAfflictionRule
]);

/**
 * Cancellation framework implemented; no cancellation rule activated
 * until a documented Yoga-specific rule is added.
 */
export const YOGA_CANCELLATION_RULES: readonly YogaCancellationRule[] = Object.freeze([]);

export function evaluateYogaModifiers(
  yoga: YogaResult,
  input: YogaAnalysisInput
): YogaAssessment {
  const supportingFactors: YogaModifier[] = [];
  const weakeningFactors: YogaModifier[] = [];
  const cancellationFactors: YogaModifier[] = [];

  for (const rule of YOGA_MODIFIER_RULES) {
    if (rule.appliesTo.includes(yoga.type)) {
      const mods = rule.evaluate(yoga, input);
      for (const mod of mods) {
        if (mod.type === 'SUPPORT' || mod.effect === 'POSITIVE') {
          supportingFactors.push(mod);
        } else if (
          mod.type === 'WEAKEN' ||
          mod.type === 'AFFLICTION' ||
          mod.effect === 'NEGATIVE'
        ) {
          weakeningFactors.push(mod);
        } else if (mod.type === 'CANCELLATION' || mod.effect === 'CANCELLED') {
          cancellationFactors.push(mod);
        }
      }
    }
  }

  for (const rule of YOGA_CANCELLATION_RULES) {
    if (rule.yogaTypes.includes(yoga.type)) {
      const cancelMod = rule.evaluate(yoga, input);
      if (cancelMod) {
        cancellationFactors.push(cancelMod);
      }
    }
  }

  // Engine Policy Note:
  // Multiple major supports (or major weakenings) can originate from the same planet
  // (e.g., Mars being both Yogakaraka and Exalted yielding two major supports, or a
  // planet being both Debilitated and Combust yielding two major weakenings).
  // This factor counting is an intentional, deterministic engine-assessment policy
  // and NOT a claim of classically additive strength.
  const hasMajorSupport = supportingFactors.some(f => f.category === 'MAJOR_SUPPORT');
  const hasMajorWeakening = weakeningFactors.some(f => f.category === 'MAJOR_WEAKENING');
  const majorSupportCount = supportingFactors.filter(f => f.category === 'MAJOR_SUPPORT').length;
  const majorWeakeningCount = weakeningFactors.filter(f => f.category === 'MAJOR_WEAKENING').length;

  let strength: YogaStrengthLevel;
  if (majorSupportCount >= 2 && !hasMajorWeakening) {
    strength = YogaStrengthLevel.VERY_STRONG;
  } else if (majorSupportCount >= 1 && !hasMajorWeakening) {
    strength = YogaStrengthLevel.STRONG;
  } else if (majorWeakeningCount >= 2) {
    strength = YogaStrengthLevel.VERY_WEAK;
  } else if (majorWeakeningCount >= 1) {
    strength = YogaStrengthLevel.WEAK;
  } else {
    strength = YogaStrengthLevel.MODERATE;
  }

  let finalStatus: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  if (cancellationFactors.length > 0) {
    finalStatus = 'CANCELLED';
  } else if (hasMajorWeakening) {
    finalStatus = 'WEAKENED';
  } else if (hasMajorSupport) {
    finalStatus = 'STRONG';
  } else {
    finalStatus = 'PRESENT';
  }

  const hasRoles = input.functionalRoles !== undefined;
  const hasAnalysis = input.planetAnalysis !== undefined;
  const hasDrishti = input.natalGrahaDrishti !== undefined;
  const hasStrength = input.planetaryStrength !== undefined;

  const allPresent = hasRoles && hasAnalysis && hasDrishti && hasStrength;
  const shadbalaComplete =
    hasStrength &&
    input.planetaryStrength?.strengths !== undefined &&
    yoga.planets.every(
      p => (input.planetaryStrength?.strengths?.[p] as any)?.shadbala?.status === ShadbalaAggregationStatus.AVAILABLE
    );

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (allPresent && shadbalaComplete) {
    confidence = 'HIGH';
  } else if (allPresent || (hasRoles && hasAnalysis)) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  const frozenSupporting = Object.freeze(supportingFactors.map(m => Object.freeze(m)));
  const frozenWeakening = Object.freeze(weakeningFactors.map(m => Object.freeze(m)));
  const frozenCancellation = Object.freeze(cancellationFactors.map(m => Object.freeze(m)));

  return Object.freeze({
    formationPresent: true,
    strength,
    supportingFactors: frozenSupporting,
    weakeningFactors: frozenWeakening,
    cancellationFactors: frozenCancellation,
    finalStatus,
    confidence
  });
}
