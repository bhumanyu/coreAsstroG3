import type {
  Horoscope
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression
} from '../careerExpression';

import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaCanonicalEvidence,
  CareerDashaCanonicalPeriod,
  CareerDashaCanonicalEffect,
  CareerDashaCanonicalLevel,
  CareerDashaCanonicalRole,
  CareerDashaCanonicalProvenance
} from './careerDashaCanonicalTypes';

import type {
  CareerDashaActivationContext,
  CareerDashaPlanetContext,
  CareerDashaTiming,
  CareerDashaActivation,
  CareerDashaActivationHierarchy
} from './careerDashaActivationTypes';

import type {
  CareerPlanetRelevance,
  CareerPlanetRole,
  CareerPlanetaryRelevance
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from '../careerPlanetaryCondition';

import type {
  ReasoningDirection,
  DomainStrength
} from '../../reasoning/reasoningTypes';

import {
  Planet
} from '../../../types';

import {
  resolveCareerDashaActivation
} from './careerDashaActivation';

/**
 * Input interface for C9 Dasha activation integration.
 * Consumes the natal analysis aggregate and expression analysis.
 */
export interface CareerDashaIntegrationInput {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
}

/**
 * Canonical planet order for Career Dasha processing.
 * Matches the 9-planet Vedic system: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
 */
export const CAREER_DASHA_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
] as const);

/**
 * Gets the current Dasha period from the horoscope.
 * Falls back to activePeriods if current is not available.
 */
function getCurrentDasha(horoscope: Horoscope) {
  return horoscope.dashaInterpretation?.current ?? horoscope.dashaInterpretation?.activePeriods;
}

/**
 * Builds planet contexts from natal analysis and expression analysis.
 * 
 * This function:
 * - Builds relevanceByPlanet and conditionByPlanet maps from natal.relevance / natal.condition
 * - Builds an expressions-by-planet map derived from expression.expressions[].evidence[].planets
 * - Iterates CAREER_DASHA_PLANET_ORDER
 * - Skips planets with no C5 relevance (missing evidence is not negative evidence)
 * - Maps condition?.condition ?? 'UNAVAILABLE' (preserves C6 UNAVAILABLE — never coerces to WEAK/NEUTRAL/CHALLENGE)
 * - Sorts relatedHouses numerically and relatedPlanets by canonical order
 * - Freezes each context
 */
function buildPlanetContexts(
  natal: CareerNatalAnalysis,
  expression: CareerExpressionAnalysis
): readonly CareerDashaPlanetContext[] {
  // Build relevance and condition maps
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();
  for (const relevance of natal.relevance) {
    relevanceByPlanet.set(relevance.planet, relevance);
  }

  const conditionByPlanet = new Map<Planet, CareerPlanetaryConditionResult>();
  for (const condition of natal.condition) {
    conditionByPlanet.set(condition.planet, condition);
  }

  // Build expressions-by-planet map with semantic deduplication
  // Use Map<Planet, Map<string, CareerExpression>> where key is `${mode}:${direction}`
  // to deduplicate expressions per planet (same mode+direction appears once)
  const expressionsByPlanet = new Map<Planet, Map<string, CareerExpression>>();
  for (const expr of expression.expressions) {
    for (const evidence of expr.evidence) {
      for (const planet of evidence.planets) {
        const planetMap = expressionsByPlanet.get(planet) ?? new Map<string, CareerExpression>();
        const exprKey = `${expr.mode}:${expr.direction}`;
        if (!planetMap.has(exprKey)) {
          planetMap.set(exprKey, expr);
        }
        expressionsByPlanet.set(planet, planetMap);
      }
    }
  }

  // Build planet contexts in canonical order
  const planetContexts: CareerDashaPlanetContext[] = [];

  for (const planet of CAREER_DASHA_PLANET_ORDER) {
    const relevance = relevanceByPlanet.get(planet);

    // Skip planets with no C5 relevance (missing evidence is not negative evidence)
    if (!relevance || relevance.relevance === 'NEUTRAL') {
      continue;
    }

    const condition = conditionByPlanet.get(planet);

    // Preserve C6 UNAVAILABLE — do NOT default to WEAK/MODERATE
    const planetCondition = condition?.condition ?? 'UNAVAILABLE';

    // Merge relatedPlanets from relevance and condition, deduped and sorted by canonical order
    const relevanceRelatedPlanets = relevance.relatedPlanets;
    const conditionRelatedPlanets = condition?.relatedPlanets ?? [];
    const mergedRelatedPlanets = Array.from(new Set([...relevanceRelatedPlanets, ...conditionRelatedPlanets]));

    // Sort by canonical order
    const canonicalOrderMap = new Map<Planet, number>();
    CAREER_DASHA_PLANET_ORDER.forEach((p, index) => canonicalOrderMap.set(p, index));
    mergedRelatedPlanets.sort((a, b) => {
      const orderA = canonicalOrderMap.get(a) ?? 999;
      const orderB = canonicalOrderMap.get(b) ?? 999;
      return orderA - orderB;
    });

    // Sort relatedHouses numerically
    const sortedRelatedHouses = Array.from(relevance.relatedHouses).sort((a, b) => a - b);

    // Get expressions for this planet (deduplicated)
    const planetExpressionsMap = expressionsByPlanet.get(planet);
    const planetExpressions = planetExpressionsMap
      ? Array.from(planetExpressionsMap.values())
      : [];

    // Build planet context
    const planetContext: CareerDashaPlanetContext = Object.freeze({
      planet,
      relevance: relevance.relevance,
      roles: Object.freeze([...relevance.roles]),
      condition: planetCondition,
      expressions: Object.freeze(planetExpressions),
      relatedHouses: Object.freeze(sortedRelatedHouses),
      relatedPlanets: Object.freeze(mergedRelatedPlanets)
    });

    planetContexts.push(planetContext);
  }

  return Object.freeze(planetContexts);
}

/**
 * Builds the CareerDashaActivationContext from the integration input.
 * 
 * This function:
 * - Returns undefined if no current Dasha is available
 * - Builds context from natal.structural (direction/strength/primarySupport/primaryChallenge)
 * - Uses planet contexts built from natal and expression
 * - Extracts md/ad/pd timing from current.mahadasha/antardasha/pratyantardasha
 * 
 * C9 must consume natal.structural — it must NOT recompute houses/lords/relevance/condition/promise.
 */
function buildCareerDashaActivationContext(
  input: CareerDashaIntegrationInput
): CareerDashaActivationContext | undefined {
  const { horoscope, natal } = input;

  const currentDasha = getCurrentDasha(horoscope);
  if (!currentDasha) {
    return undefined;
  }

  // Extract timing from current Dasha
  const mdTiming: CareerDashaTiming = Object.freeze({
    planet: currentDasha.mahadasha?.planet,
    start: currentDasha.mahadasha?.start,
    end: currentDasha.mahadasha?.end
  });

  const adTiming: CareerDashaTiming = Object.freeze({
    planet: currentDasha.antardasha?.planet,
    start: currentDasha.antardasha?.start,
    end: currentDasha.antardasha?.end
  });

  const pdTiming: CareerDashaTiming = Object.freeze({
    planet: currentDasha.pratyantardasha?.planet,
    start: currentDasha.pratyantardasha?.start,
    end: currentDasha.pratyantardasha?.end
  });

  // Build planet contexts
  const planetContexts = buildPlanetContexts(natal, input.expression);

  // Build activation context from natal.structural
  const context: CareerDashaActivationContext = Object.freeze({
    structuralDirection: natal.structural.direction,
    structuralStrength: natal.structural.strength,
    structuralPrimarySupport: natal.structural.primarySupport,
    structuralPrimaryChallenge: natal.structural.primaryChallenge,
    planetContexts,
    mdTiming,
    adTiming,
    pdTiming
  });

  return context;
}

/**
 * Maps CareerDashaActivationDirection to ReasoningDirection using exhaustive switch.
 */
function mapActivationDirection(
  direction: string
): ReasoningDirection {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Maps CareerDashaActivationStrength to DomainStrength using exhaustive switch.
 */
function mapActivationStrength(
  strength: string
): DomainStrength {
  switch (strength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'VERY_WEAK':
      return 'VERY_WEAK';
    case 'UNDETERMINED':
      return 'UNDETERMINED';
    default:
      return 'UNDETERMINED';
  }
}

/**
 * Builds a canonical period from a CareerDashaActivation.
 */
function buildCanonicalPeriod(
  activation: CareerDashaActivation,
  level: CareerDashaCanonicalLevel
): CareerDashaCanonicalPeriod {
  return Object.freeze({
    level,
    planet: activation.planet,
    role: activation.role as CareerDashaCanonicalRole,
    effect: activation.effect as CareerDashaCanonicalEffect,
    direction: mapActivationDirection(activation.direction),
    strength: mapActivationStrength(activation.strength),
    start: activation.start,
    end: activation.end,
    statement: activation.statement
  });
}

/**
 * Resolves natal root evidence IDs for a planet.
 *
 * Conservative implementation: WeightedReasoningEvidence does not expose a structured
 * field that reliably identifies the planet/subject. The rootEvidenceId field is a
 * forward-looking W1 concept that is not yet implemented in the current codebase.
 *
 * Rather than fabricating links via string matching (which would be unreliable and
 * create false provenance), this function returns an empty array. This preserves
 * correctness by not claiming traceability that does not exist in the data contract.
 *
 * Future W1 work may establish a root evidence tree structure for evidence dependency
 * tracking, at which point this function can be updated to use the structured mechanism.
 */
function resolveNatalRootEvidenceIds(
  _natal: CareerNatalAnalysis,
  _planet?: Planet
): readonly string[] {
  // Conservative: return empty array since WeightedReasoningEvidence does not
  // expose a structured planet/subject field, and rootEvidenceId is not yet implemented.
  // Do not fabricate links via string matching.
  return Object.freeze([]);
}

/**
 * Builds canonical evidence from the activation hierarchy.
 *
 * This function:
 * - Uses deterministic identityKey = ['CAREER_DASHA', level, planet, role].join(':')
 * - id = identityKey + ':' + effect (occurrence identity)
 * - sourceIds = activation.evidence.map(e => e.id) (actual source occurrence ids)
 * - provenance = { source: 'C9_DASHA', activationLevel, natalRootIds }
 * - Deduplicates canonical evidence by identityKey (merging sourceIds/rootEvidenceIds)
 * - Sorts output by identityKey.localeCompare
 */
function buildCanonicalEvidence(
  hierarchy: CareerDashaActivationHierarchy,
  natal: CareerNatalAnalysis
): readonly CareerDashaCanonicalEvidence[] {
  const evidenceMap = new Map<string, CareerDashaCanonicalEvidence>();

  const levels: Array<{ level: CareerDashaCanonicalLevel; activation: CareerDashaActivation }> = [
    { level: 'MD', activation: hierarchy.md },
    { level: 'AD', activation: hierarchy.ad },
    { level: 'PD', activation: hierarchy.pd }
  ];

  for (const { level, activation } of levels) {
    // Build identityKey (semantic identity, excludes effect)
    const identityKey = ['CAREER_DASHA', level, activation.planet ?? 'none', activation.role].join(':');

    // Build id (occurrence identity, includes effect)
    const id = `${identityKey}:${activation.effect}`;

    // Resolve natal root evidence IDs
    const natalRootIds = activation.planet ? resolveNatalRootEvidenceIds(natal, activation.planet) : [];

    // Build provenance
    const provenance: CareerDashaCanonicalProvenance = Object.freeze({
      source: 'C9_DASHA',
      activationLevel: level,
      natalRootIds
    });

    // Build canonical evidence
    // sourceIds are the actual source occurrence ids from the activation level
    // (each CareerDashaActivationEvidence.id), not the C9-generated occurrence id
    const sourceIds = Object.freeze(activation.evidence.map(e => e.id));

    const canonicalEvidence: CareerDashaCanonicalEvidence = Object.freeze({
      identityKey,
      id,
      level,
      planet: activation.planet,
      role: activation.role as CareerDashaCanonicalRole,
      effect: activation.effect as CareerDashaCanonicalEffect,
      direction: mapActivationDirection(activation.direction),
      strength: mapActivationStrength(activation.strength),
      statement: activation.statement,
      sourceIds,
      provenance
    });

    // Deduplicate by identityKey (merge sourceIds and rootEvidenceIds)
    const existing = evidenceMap.get(identityKey);
    if (existing) {
      // Merge sourceIds and rootEvidenceIds
      const mergedSourceIds = Array.from(new Set([...existing.sourceIds, ...canonicalEvidence.sourceIds]));
      const mergedRootIds = Array.from(new Set([...existing.provenance.natalRootIds, ...natalRootIds]));
      const mergedProvenance: CareerDashaCanonicalProvenance = Object.freeze({
        source: 'C9_DASHA',
        activationLevel: level,
        natalRootIds: Object.freeze(mergedRootIds)
      });

      evidenceMap.set(identityKey, Object.freeze({
        ...existing,
        sourceIds: Object.freeze(mergedSourceIds),
        provenance: mergedProvenance
      }));
    } else {
      evidenceMap.set(identityKey, canonicalEvidence);
    }
  }

  // Sort by identityKey.localeCompare
  const sortedEvidence = Array.from(evidenceMap.values()).sort((a, b) =>
    a.identityKey.localeCompare(b.identityKey)
  );

  return Object.freeze(sortedEvidence);
}

/**
 * Creates an explicit unavailable Career Dasha analysis result.
 *
 * This function:
 * - Returns overallEffect INSUFFICIENT_DATA
 * - Returns overallDirection UNAVAILABLE
 * - Returns overallStrength UNDETERMINED
 * - Returns dominantLevel NONE
 * - Returns empty evidence and rootEvidenceIds
 * - Omits hierarchy
 * - Sets planet: undefined for MD/AD/PD to make absence explicit (not misread as real Sun Dasha)
 */
function createUnavailableCareerDashaAnalysis(): CareerDashaCanonicalAnalysis {
  return Object.freeze({
    overallEffect: 'INSUFFICIENT_DATA',
    overallDirection: 'UNAVAILABLE',
    overallStrength: 'UNDETERMINED',
    dominantLevel: 'NONE',
    md: Object.freeze({
      level: 'MD',
      planet: undefined,
      role: 'PRIMARY_DRIVER',
      effect: 'INSUFFICIENT_DATA',
      direction: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      start: undefined,
      end: undefined,
      statement: 'No current Dasha period available.'
    }),
    ad: Object.freeze({
      level: 'AD',
      planet: undefined,
      role: 'MODIFIER',
      effect: 'INSUFFICIENT_DATA',
      direction: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      start: undefined,
      end: undefined,
      statement: 'No current Dasha period available.'
    }),
    pd: Object.freeze({
      level: 'PD',
      planet: undefined,
      role: 'REFINEMENT',
      effect: 'INSUFFICIENT_DATA',
      direction: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      start: undefined,
      end: undefined,
      statement: 'No current Dasha period available.'
    }),
    evidence: Object.freeze([]),
    rootEvidenceIds: Object.freeze([]),
    statement: 'Career Dasha activation is unavailable due to missing Dasha timing data.'
  });
}

/**
 * Canonical public function for C9 Dasha activation analysis.
 * 
 * This function:
 * - Returns createUnavailableCareerDashaAnalysis() when no context
 * - Calls resolveCareerDashaActivation(context) from ./careerDashaActivation
 * - Builds canonical MD/AD/PD periods
 * - Aggregates evidence with deterministic identityKey
 * - Returns a frozen CareerDashaCanonicalAnalysis
 * 
 * @param input - The integration input containing horoscope, natal, and expression
 * @returns A frozen CareerDashaCanonicalAnalysis
 */
export function buildCareerDashaAnalysis(
  input: CareerDashaIntegrationInput
): CareerDashaCanonicalAnalysis {
  const context = buildCareerDashaActivationContext(input);

  if (!context) {
    return createUnavailableCareerDashaAnalysis();
  }

  // Call the existing engine
  const hierarchy = resolveCareerDashaActivation(context);

  // Build canonical periods
  const md = buildCanonicalPeriod(hierarchy.md, 'MD');
  const ad = buildCanonicalPeriod(hierarchy.ad, 'AD');
  const pd = buildCanonicalPeriod(hierarchy.pd, 'PD');

  // Build canonical evidence
  const evidence = buildCanonicalEvidence(hierarchy, input.natal);

  // Collect all root evidence IDs
  const rootEvidenceIds = Object.freeze(
    evidence.flatMap(e => e.provenance.natalRootIds)
  );

  // Build statement
  const statement = [
    `Career Dasha activation analysis.`,
    `Overall effect: ${hierarchy.overallEffect}.`,
    `Overall direction: ${hierarchy.overallDirection}.`,
    `Overall strength: ${hierarchy.overallStrength}.`,
    `Dominant level: ${hierarchy.dominantLevel}.`,
    `Evidence count: ${evidence.length}.`
  ].join(' ');

  // Derive overallDirection from hierarchy.overallEffect at the adapter level
  // This avoids changing the shared CareerDashaActivationHierarchy.overallDirection
  // that C11 consumes. Mapping: INSUFFICIENT_DATA/UNKNOWN → UNAVAILABLE (missing evidence ≠ negative),
  // DOES_NOT_ACTIVATE → NEUTRAL, ACTIVATES → SUPPORT, CHALLENGES → CHALLENGE, PARTIALLY_ACTIVATES → MIXED.
  function mapOverallDirectionFromEffect(effect: string): ReasoningDirection {
    switch (effect) {
      case 'ACTIVATES':
        return 'SUPPORT';
      case 'CHALLENGES':
        return 'CHALLENGE';
      case 'PARTIALLY_ACTIVATES':
        return 'MIXED';
      case 'DOES_NOT_ACTIVATE':
        return 'NEUTRAL';
      case 'INSUFFICIENT_DATA':
      case 'UNKNOWN':
        return 'UNAVAILABLE';
      default:
        return 'UNAVAILABLE';
    }
  }

  // Return frozen canonical analysis
  return Object.freeze({
    overallEffect: hierarchy.overallEffect as CareerDashaCanonicalEffect,
    overallDirection: mapOverallDirectionFromEffect(hierarchy.overallEffect),
    overallStrength: mapActivationStrength(hierarchy.overallStrength),
    dominantLevel: hierarchy.dominantLevel,
    md,
    ad,
    pd,
    evidence,
    rootEvidenceIds,
    statement,
    hierarchy
  });
}
