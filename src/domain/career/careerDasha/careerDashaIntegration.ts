import type {
  Horoscope
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import {
  parseEvidenceIdentityKey
} from '../../careerWealth/provenance';

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
  DashaSystem
} from '../../../types';

import {
  resolveCareerDashaActivation
} from './careerDashaActivation';

import {
  extractPlanetFromParticipantId
} from '../careerParticipantRoles/participantRoleUtils';

import type {
  SelectedPeriodActivationContext
} from '../../../core/analysis';

/**
 * P2-08B SPEC REQUIREMENT #4: Vimshottari Consumption Verification
 *
 * This module must consume active MD/AD/PD from engine/dasha/vimshottari.ts getActiveDasha() output
 * (planet + start + end verbatim).
 *
 * Current implementation:
 * - getCurrentDasha() extracts from horoscope.dashaInterpretation.current or .activePeriods
 * - Timing extraction preserves planet/start/end verbatim from the source
 *
 * SOURCE VERIFICATION:
 * - horoscope.dashaInterpretation is populated by engine/astroEngine.ts via analyzeActiveDasha()
 * - analyzeActiveDasha() calls getActiveDasha() from engine/dasha/vimshottari.ts (line 1048)
 * - The active MD/AD/PD timing (planet + start + end) is preserved verbatim from the Vimshottari engine
 * - No hand-constructed timings are accepted on the production path
 */

/**
 * Input interface for C9 Dasha activation integration.
 * Consumes the natal analysis aggregate and expression analysis.
 */
export interface CareerDashaIntegrationInput {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  /**
   * Optional canonical dasha interpretation from temporalState.
   * When provided, this takes precedence over horoscope.dashaInterpretation
   * to ensure C9 consumes the same canonical dasha source as C11.
   * This fixes the provenance split where C11 cites temporalState dasha
   * while the mapper consumes stale embedded horoscope dasha.
   */
  readonly dashaInterpretation?: Horoscope['dashaInterpretation'];
}

/**
 * Per P2-11C Gate 3: Mechanism-aware input for C9 Dasha activation.
 *
 * Optional mechanism-aware input carrying:
 * - mechanismId: The mechanism identity (optional, for traceability)
 * - participantIds: Participant IDs for planet association resolution
 * - sourceEvidenceIds: Source evidence IDs for provenance
 * - ruleIds: Rule IDs for provenance
 *
 * When present, resolve planet associations from explicit participant identities
 * via extractPlanetFromParticipantId (returning real Planet enum, not from expression.evidence[].planets).
 *
 * When absent, the legacy planet-derived path may run only with an explicit limitation diagnostic.
 */
export interface CareerDashaMechanismAwareInput {
  readonly mechanismId?: string;
  readonly participantIds: readonly string[];
  readonly sourceEvidenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * Extended input interface for C9 Dasha activation integration (P2-11C Gate 3).
 *
 * Adds optional mechanismAwareInput to CareerDashaIntegrationInput.
 * Adds optional dashaInterpretation for provenance fix (Gate D).
 */
export interface CareerDashaIntegrationInputExtended extends CareerDashaIntegrationInput {
  readonly mechanismAwareInput?: CareerDashaMechanismAwareInput;
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
 * Gets the current Dasha period from the horoscope or canonical dashaInterpretation.
 * Falls back to activePeriods if current is not available.
 *
 * SPEC NOTE (P2-08B requirement #4):
 * The active MD/AD/PD comes from engine/dasha/vimshottari.ts getActiveDasha() output
 * (planet + start + end verbatim). This function consumes dashaInterpretation.current
 * which is populated by engine/astroEngine.ts via analyzeActiveDasha() calling getActiveDasha().
 * Timing is preserved verbatim from the canonical Vimshottari engine.
 *
 * PROVENANCE FIX (Gate D):
 * When canonicalDashaInterpretation is provided (from temporalState), it takes precedence
 * over horoscope.dashaInterpretation to ensure C9 consumes the same canonical dasha source
 * as C11. This fixes the provenance split where C11 cites temporalState dasha while the
 * mapper consumes stale embedded horoscope dasha.
 */
function getCurrentDasha(
  horoscope: Horoscope,
  canonicalDashaInterpretation?: Horoscope['dashaInterpretation']
) {
  // Prefer canonical dashaInterpretation from temporalState if provided
  const source = canonicalDashaInterpretation ?? horoscope.dashaInterpretation;
  return source?.current ?? source?.activePeriods;
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
 * Optional timing override for building Dasha activation context.
 * Used when a specific MD/AD/PD selection is provided instead of current timing.
 */
interface DashaTimingOverride {
  readonly mdTiming: CareerDashaTiming;
  readonly adTiming: CareerDashaTiming;
  readonly pdTiming: CareerDashaTiming;
}

/**
 * Builds the CareerDashaActivationContext from the integration input.
 *
 * This function:
 * - Returns undefined if no current Dasha is available (when no timing override)
 * - Builds context from natal.structural (direction/strength/primarySupport/primaryChallenge)
 * - Uses planet contexts built from natal and expression
 * - Extracts md/ad/pd timing from current.mahadasha/antardasha/pratyantardasha, or uses override if provided
 *
 * Per P2-11C Gate 3: When mechanismAwareInput is present, resolve planet associations
 * from explicit participant identities via extractPlanetFromParticipantId (returning real Planet enum).
 * When mechanismAwareInput is absent, the legacy planet-derived path runs with an explicit limitation diagnostic.
 *
 * C9 must consume natal.structural — it must NOT recompute houses/lords/relevance/condition/promise.
 *
 * @param input - The integration input containing horoscope, natal, expression, and optional mechanismAwareInput
 * @param timingOverride - Optional timing override for selected MD/AD/PD periods
 * @returns A frozen CareerDashaActivationContext, or undefined if no timing available
 */
function buildCareerDashaActivationContext(
  input: CareerDashaIntegrationInputExtended,
  timingOverride?: DashaTimingOverride
): CareerDashaActivationContext | undefined {
  const { horoscope, natal, mechanismAwareInput, dashaInterpretation } = input;

  // Use timing override if provided, otherwise extract from current Dasha
  let mdTiming: CareerDashaTiming;
  let adTiming: CareerDashaTiming;
  let pdTiming: CareerDashaTiming;

  if (timingOverride) {
    mdTiming = timingOverride.mdTiming;
    adTiming = timingOverride.adTiming;
    pdTiming = timingOverride.pdTiming;
  } else {
    const currentDasha = getCurrentDasha(horoscope, dashaInterpretation);
    if (!currentDasha) {
      return undefined;
    }

    // Extract timing from current Dasha
    // SPEC NOTE (P2-08B requirement #4): Preserve planet + start + end verbatim from upstream source.
    // These should come from engine/dasha/vimshottari.ts getActiveDasha() output.
    mdTiming = Object.freeze({
      planet: currentDasha.mahadasha?.planet,
      start: currentDasha.mahadasha?.start,
      end: currentDasha.mahadasha?.end
    });

    adTiming = Object.freeze({
      planet: currentDasha.antardasha?.planet,
      start: currentDasha.antardasha?.start,
      end: currentDasha.antardasha?.end
    });

    pdTiming = Object.freeze({
      planet: currentDasha.pratyantardasha?.planet,
      start: currentDasha.pratyantardasha?.start,
      end: currentDasha.pratyantardasha?.end
    });
  }

  // Build planet contexts
  // Per P2-11C Gate 3: Use mechanism-aware planet resolution when available
  const planetContexts = mechanismAwareInput
    ? buildPlanetContextsFromMechanismAware(natal, mechanismAwareInput)
    : buildPlanetContexts(natal, input.expression);

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
 * Per P2-11C Gate 3: Build planet contexts from mechanism-aware input.
 *
 * Resolves planet associations from explicit participant identities via extractPlanetFromParticipantId,
 * returning the real Planet enum (not from expression.evidence[].planets).
 *
 * Returns explicit UNAVAILABLE when required participant/planet identity cannot be resolved.
 * Never treats unavailable activation as negative activation.
 * Never creates a mechanism or natal promise.
 */
function buildPlanetContextsFromMechanismAware(
  natal: CareerNatalAnalysis,
  mechanismAwareInput: CareerDashaMechanismAwareInput
): readonly CareerDashaPlanetContext[] {
  const planetContexts: CareerDashaPlanetContext[] = [];

  // Resolve planets from participantIds
  const resolvedPlanets: Planet[] = [];
  for (const participantId of mechanismAwareInput.participantIds) {
    try {
      const planet = extractPlanetFromParticipantId(participantId as any);
      resolvedPlanets.push(planet);
    } catch (error) {
      // Participant ID cannot be resolved to a planet - treat as unavailable
      // Per P2-11C Gate 3: Return explicit UNAVAILABLE, not a fabricated planet
      continue;
    }
  }

  // Build relevance and condition maps from natal
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();
  for (const relevance of natal.relevance) {
    relevanceByPlanet.set(relevance.planet, relevance);
  }

  const conditionByPlanet = new Map<Planet, CareerPlanetaryConditionResult>();
  for (const condition of natal.condition) {
    conditionByPlanet.set(condition.planet, condition);
  }

  // Build planet contexts for resolved planets
  for (const planet of resolvedPlanets) {
    const relevance = relevanceByPlanet.get(planet);
    const condition = conditionByPlanet.get(planet);

    // Per P2-11C Gate 3: Return explicit UNAVAILABLE when planet identity cannot be resolved
    // If planet is not in relevance/condition maps, treat as UNAVAILABLE (not negative evidence)
    const planetRelevance = relevance?.relevance ?? 'NEUTRAL';
    const planetCondition = condition?.condition ?? 'UNAVAILABLE';

    // Skip planets with no relevance (missing evidence is not negative evidence)
    if (planetRelevance === 'NEUTRAL') {
      continue;
    }

    const relatedHouses = relevance?.relatedHouses ?? [];
    const relatedPlanets = relevance?.relatedPlanets ?? [];
    const conditionRelatedPlanets = condition?.relatedPlanets ?? [];

    // Merge related planets
    const mergedRelatedPlanets = Array.from(new Set([...relatedPlanets, ...conditionRelatedPlanets]));

    // Sort by canonical order
    const canonicalOrderMap = new Map<Planet, number>();
    CAREER_DASHA_PLANET_ORDER.forEach((p, index) => canonicalOrderMap.set(p, index));
    mergedRelatedPlanets.sort((a, b) => {
      const orderA = canonicalOrderMap.get(a) ?? 999;
      const orderB = canonicalOrderMap.get(b) ?? 999;
      return orderA - orderB;
    });

    // Sort related houses numerically
    const sortedRelatedHouses = Array.from(relatedHouses).sort((a, b) => a - b);

    const planetContext: CareerDashaPlanetContext = Object.freeze({
      planet,
      relevance: planetRelevance,
      roles: Object.freeze(relevance?.roles ?? []),
      condition: planetCondition,
      expressions: Object.freeze([]), // No expressions from mechanism-aware path
      relatedHouses: Object.freeze(sortedRelatedHouses),
      relatedPlanets: Object.freeze(mergedRelatedPlanets)
    });

    planetContexts.push(planetContext);
  }

  return Object.freeze(planetContexts);
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
 * This function extracts natal evidence IDs that are associated with a specific planet
 * by parsing the identityKey field of WeightedReasoningEvidence items.
 *
 * The identityKey format for natal evidence (from buildEvidenceIdentityKey) is:
 * 'CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]'
 * where SUBJECT_KEY is the planet name (e.g., 'JUPITER', 'SATURN').
 *
 * This parser only trusts canonical CW-... format identityKeys. Non-canonical keys
 * (e.g., raw occurrence-ID fallbacks from classifyReasoningEvidence when neither planet
 * nor house is present) are safely ignored rather than mis-parsed.
 *
 * The parseEvidenceIdentityKey function validates:
 * - CW prefix
 * - Segment count (6 or 7)
 * - Domain, Axis, and Source values against known enums
 * - All required segments are non-empty
 *
 * We parse the identityKey to extract the subjectKey (planet) and match it against
 * the requested planet.
 *
 * Returns the evidenceId (semantic identity) of matching natal evidence items.
 * If no planet is specified, returns an empty array.
 * If no matching evidence is found, returns an empty array.
 */
function resolveNatalRootEvidenceIds(
  natal: CareerNatalAnalysis,
  planet?: Planet
): readonly string[] {
  if (!planet) {
    return Object.freeze([]);
  }

  const matchingIds: string[] = [];

  for (const evidence of natal.evidence) {
    // Parse identityKey using the canonical parser
    const parsed = parseEvidenceIdentityKey(evidence.identityKey);

    // Only match if the key is canonical AND the subjectKey matches the planet
    if (parsed && parsed.subjectKey === planet) {
      // Use evidenceId as the semantic identity (matches identityKey after P0-08)
      matchingIds.push(evidence.evidenceId);
    }
  }

  return Object.freeze(matchingIds);
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
 * - Omits hierarchy (undefined)
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
    statement: 'Career Dasha activation is unavailable due to missing Dasha timing data.',
    hierarchy: undefined
  });
}

/**
 * Private shared function to assemble canonical analysis from activation hierarchy.
 *
 * This function:
 * - Builds canonical MD/AD/PD periods from hierarchy
 * - Aggregates evidence with deterministic identityKey
 * - Returns a frozen CareerDashaCanonicalAnalysis
 *
 * Used by both the current-path buildCareerDashaAnalysis and the selected-path
 * buildSelectedCareerDashaCanonicalAnalysis.
 */
function assembleCareerDashaCanonicalAnalysis(
  hierarchy: CareerDashaActivationHierarchy,
  natal: CareerNatalAnalysis,
  mechanismAwareInput?: CareerDashaMechanismAwareInput
): CareerDashaCanonicalAnalysis {
  // Build canonical periods
  const md = buildCanonicalPeriod(hierarchy.md, 'MD');
  const ad = buildCanonicalPeriod(hierarchy.ad, 'AD');
  const pd = buildCanonicalPeriod(hierarchy.pd, 'PD');

  // Build canonical evidence
  const evidence = buildCanonicalEvidence(hierarchy, natal);

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
    `Evidence count: ${evidence.length}.`,
    mechanismAwareInput ? `Mechanism-aware: true (mechanismId: ${mechanismAwareInput.mechanismId ?? 'none'}).` : 'Mechanism-aware: false (legacy path).'
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

/**
 * P1: Validates selected-period context consistency before C9 resolution.
 *
 * Verifies:
 * - ctx.dashaSystem === VIMSHOTTARI
 * - ctx.level === 'MD_AD'
 * - ctx.intervalSemantics === '[start,end)'
 * - ctx.mahadasha.planet/start/end equal mahadashaNode.planet/start/end
 * - ctx.antardasha.planet/start/end equal antardashaNode.planet/start/end
 * - ctx.interval equals {antardashaNode.start, antardashaNode.end}
 * - ctx.antardasha.mahadashaId === ctx.mahadasha.id
 * - interval.start < interval.end (parsed)
 * - AD interval contained in MD interval
 * 
 * On any mismatch, returns false.
 * Never substitutes current-Dasha data on mismatch.
 * 
 * @param ctx - The selected period activation context to validate
 * @returns true if valid, false if invalid
 */
function validateSelectedPeriodContext(
  ctx: SelectedPeriodActivationContext
): boolean {
  // Verify dasha system
  if (ctx.dashaSystem !== DashaSystem.VIMSHOTTARI) {
    return false;
  }

  // Verify level
  if (ctx.level !== 'MD_AD') {
    return false;
  }

  // Verify interval semantics
  if (ctx.intervalSemantics !== '[start,end)') {
    return false;
  }

  // Verify mahadasha consistency between context and node
  if (ctx.mahadasha.planet !== ctx.mahadashaNode.planet) {
    return false;
  }
  if (ctx.mahadasha.start !== ctx.mahadashaNode.start) {
    return false;
  }
  if (ctx.mahadasha.end !== ctx.mahadashaNode.end) {
    return false;
  }

  // Verify antardasha consistency between context and node
  if (ctx.antardasha.planet !== ctx.antardashaNode.planet) {
    return false;
  }
  if (ctx.antardasha.start !== ctx.antardashaNode.start) {
    return false;
  }
  if (ctx.antardasha.end !== ctx.antardashaNode.end) {
    return false;
  }

  // Verify antardasha mahadashaId matches mahadasha id
  if (ctx.antardasha.mahadashaId !== ctx.mahadasha.id) {
    return false;
  }

  // Verify interval matches antardasha node
  if (ctx.interval.start !== ctx.antardashaNode.start) {
    return false;
  }
  if (ctx.interval.end !== ctx.antardashaNode.end) {
    return false;
  }

  // Parse and verify interval ordering
  const startMs = Date.parse(ctx.interval.start);
  const endMs = Date.parse(ctx.interval.end);
  const mdStartMs = Date.parse(ctx.mahadasha.start);
  const mdEndMs = Date.parse(ctx.mahadasha.end);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || Number.isNaN(mdStartMs) || Number.isNaN(mdEndMs)) {
    return false;
  }

  // Verify start < end
  if (startMs >= endMs) {
    return false;
  }

  // Verify AD interval contained in MD interval
  if (startMs < mdStartMs || endMs > mdEndMs) {
    return false;
  }

  // All checks passed
  return true;
}

/**
 * PBA-04 wrapper: Build canonical analysis for a selected MD/AD period.
 *
 * This function:
 * - Validates selected-period context consistency (P1)
 * - Builds mdTiming/adTiming verbatim from selectedPeriod.mahadashaNode/antardashaNode (planet/start/end exact source strings)
 * - Sets pdTiming = { planet: undefined, start: undefined, end: undefined } (explicitly unavailable)
 * - Never reads horoscope.dashaInterpretation.current/activePeriods or the dashaInterpretation input for the selected path
 * - Runs the shared assembly function
 * - Returns a frozen CareerDashaCanonicalAnalysis on success
 * - Returns undefined on validation failure (P1: discriminated failure pattern)
 *
 * @param input - The integration input containing horoscope, natal, expression, mechanismAwareInput, and selectedPeriod
 * @returns A frozen CareerDashaCanonicalAnalysis on success, undefined on validation failure
 */
export function buildSelectedCareerDashaCanonicalAnalysis(
  input: CareerDashaIntegrationInputExtended & { selectedPeriod: SelectedPeriodActivationContext }
): CareerDashaCanonicalAnalysis | undefined {
  const { selectedPeriod, natal, mechanismAwareInput } = input;

  // P1: Validate selected-period context consistency
  if (!validateSelectedPeriodContext(selectedPeriod)) {
    return undefined;
  }

  // Build timing verbatim from selected period (PD explicitly unavailable)
  const timingOverride: DashaTimingOverride = Object.freeze({
    mdTiming: Object.freeze({
      planet: selectedPeriod.mahadashaNode.planet,
      start: selectedPeriod.mahadashaNode.start,
      end: selectedPeriod.mahadashaNode.end
    }),
    adTiming: Object.freeze({
      planet: selectedPeriod.antardashaNode.planet,
      start: selectedPeriod.antardashaNode.start,
      end: selectedPeriod.antardashaNode.end
    }),
    pdTiming: Object.freeze({
      planet: undefined,
      start: undefined,
      end: undefined
    })
  });

  // Build context with timing override (does NOT read horoscope.dashaInterpretation)
  const context = buildCareerDashaActivationContext(input, timingOverride);

  if (!context) {
    return createUnavailableCareerDashaAnalysis();
  }

  // Call the existing engine
  const hierarchy = resolveCareerDashaActivation(context);

  // Use shared assembly function
  return assembleCareerDashaCanonicalAnalysis(hierarchy, natal, mechanismAwareInput);
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
 * Per P2-11C Gate 3: Accepts extended input with optional mechanismAwareInput.
 * When mechanismAwareInput is present, resolves planet associations from explicit participant identities.
 * When absent, runs legacy planet-derived path with explicit limitation diagnostic.
 *
 * @param input - The integration input containing horoscope, natal, expression, and optional mechanismAwareInput
 * @returns A frozen CareerDashaCanonicalAnalysis
 */
export function buildCareerDashaAnalysis(
  input: CareerDashaIntegrationInputExtended
): CareerDashaCanonicalAnalysis {
  const context = buildCareerDashaActivationContext(input);

  if (!context) {
    return createUnavailableCareerDashaAnalysis();
  }

  // Call the existing engine
  const hierarchy = resolveCareerDashaActivation(context);

  // Use shared assembly function
  return assembleCareerDashaCanonicalAnalysis(hierarchy, input.natal, input.mechanismAwareInput);
}
