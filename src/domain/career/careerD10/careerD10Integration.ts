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
  CareerD10CanonicalAnalysis,
  CareerD10CanonicalEvidence,
  CareerD10Conflict,
  CareerD10ExpressionQualificationCanonical,
  CareerD10CanonicalProvenance
} from './careerD10CanonicalTypes';

import type {
  CareerD10ExpressionQualification
} from './careerD10QualificationTypes';

import type {
  CareerD10Context,
  CareerD10PlanetContext,
  CareerD10HouseContext,
  CareerD10QualificationResult,
  CareerD10Evidence,
  CareerD10QualificationEffect,
  CareerD10QualificationDirection,
  CareerD10QualificationStrength,
  CareerD10HouseRole
} from './careerD10QualificationTypes';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import {
  Planet,
  DignityStatus
} from '../../../types';

import {
  classifyCareerHouse,
  CAREER_HOUSE_PORTFOLIO
} from '../careerTypes';

import {
  resolveCareerD10Qualification
} from './careerD10Qualification';

import {
  evaluateDimensionQualification
} from './careerD10QualificationRules';

/**
 * Input interface for C10 D10 qualification integration.
 * Consumes the natal analysis aggregate and expression analysis.
 * Does NOT include C9/Dasha input (C10 is parallel to C9).
 */
export interface CareerD10IntegrationInput {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
}

/**
 * Canonical planet order for Career D10 processing.
 * Matches the 9-planet Vedic system: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
 */
export const CANONICAL_D10_PLANETS: readonly Planet[] = Object.freeze([
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
 * Maps DignityStatus to CareerPlanetaryCondition.
 * 
 * Mapping rules:
 * - EXALTED, OWN_SIGN, MOOLATRIKONA → STRONG
 * - DEBILITATED → AFFLICTED
 * - GREAT_FRIEND_SIGN, FRIEND_SIGN → MODERATE
 * - ENEMY_SIGN, GREAT_ENEMY_SIGN → WEAK
 * - Default (incl. NEUTRAL, NEUTRAL_SIGN, undefined) → UNAVAILABLE
 * 
 * This is a conservative mapping: neutral dignity does not imply moderate condition.
 */
function mapD10Condition(
  dignity: DignityStatus | undefined
): CareerPlanetaryCondition {
  if (!dignity) {
    return 'UNAVAILABLE';
  }

  switch (dignity) {
    case DignityStatus.EXALTED:
    case DignityStatus.MOOLATRIKONA:
    case DignityStatus.OWN_SIGN:
      return 'STRONG';

    case DignityStatus.DEBILITATED:
      return 'AFFLICTED';

    case DignityStatus.GREAT_FRIEND_SIGN:
    case DignityStatus.FRIEND_SIGN:
      return 'MODERATE';

    case DignityStatus.ENEMY_SIGN:
    case DignityStatus.GREAT_ENEMY_SIGN:
      return 'WEAK';

    case DignityStatus.NEUTRAL:
    case DignityStatus.NEUTRAL_SIGN:
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Builds D10 planet contexts from the horoscope.
 *
 * This function:
 * - Reads horoscope.divisionalInterpretation?.d10?.planets
 * - Iterates in canonical planet order
 * - Skips planets missing or without a house
 * - Builds CareerD10PlanetContext with condition from mapD10Condition
 * - Sets natalHouse from horoscope.planetFacts[planet].house (or undefined if unavailable)
 * - Sets relatedHouses: [info.house]
 * - Freezes each context and the array
 */
function buildD10PlanetContexts(
  horoscope: Horoscope
): readonly CareerD10PlanetContext[] {
  const d10Planets = horoscope.divisionalInterpretation?.d10?.planets;
  if (!d10Planets) {
    return Object.freeze([]);
  }

  const planetContexts: CareerD10PlanetContext[] = [];

  for (const planet of CANONICAL_D10_PLANETS) {
    const info = d10Planets[planet];
    if (!info || !info.house) {
      continue;
    }

    const condition = mapD10Condition(info.dignity);

    // Map natal house from horoscope.planetFacts
    const natalPlanetFact = horoscope.planetFacts[planet];
    const natalHouse = natalPlanetFact?.house;

    const planetContext: CareerD10PlanetContext = Object.freeze({
      planet,
      condition,
      d10House: info.house,
      natalHouse: natalHouse ?? 0, // Use 0 only if truly unavailable (natalPlanetFact missing or house undefined)
      relatedHouses: Object.freeze([info.house])
    });

    planetContexts.push(planetContext);
  }

  return Object.freeze(planetContexts);
}

/**
 * Builds D10 house contexts from the horoscope.
 * 
 * This function:
 * - Reads d10.houses (array of DivisionalHouseInterpretation)
 * - Sorts by house number
 * - Sets role via classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO)
 * - Sets lordCondition via mapD10Condition(d10.planets?.[lord]?.dignity)
 * - Populates tenants from house.occupants (real D10 data)
 * - Populates tenantConditions by mapping each occupant's dignity
 * - Freezes each context and the array
 */
function buildD10HouseContexts(
  horoscope: Horoscope
): readonly CareerD10HouseContext[] {
  const d10 = horoscope.divisionalInterpretation?.d10;
  if (!d10 || !d10.houses) {
    return Object.freeze([]);
  }

  const d10Planets = d10.planets;

  // Sort by house number for determinism
  const sortedHouses = [...d10.houses].sort((a, b) => a.house - b.house);

  const houseContexts: CareerD10HouseContext[] = [];

  for (const house of sortedHouses) {
    const role = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO) as CareerD10HouseRole;
    const lordCondition = mapD10Condition(d10Planets?.[house.lord]?.dignity);

    // Populate tenants from real D10 occupants
    const tenants = Object.freeze([...house.occupants]);
    const tenantConditions = Object.freeze(
      house.occupants.map((occupant: Planet) => mapD10Condition(d10Planets?.[occupant]?.dignity))
    );

    const houseContext: CareerD10HouseContext = Object.freeze({
      house: house.house,
      role,
      occupied: tenants.length > 0,
      lord: house.lord,
      lordCondition,
      tenants,
      tenantConditions
    });

    houseContexts.push(houseContext);
  }

  return Object.freeze(houseContexts);
}

/**
 * Builds the CareerD10Context from the integration input.
 *
 * This function:
 * - Computes d10Available from presence of non-empty houses+planets
 * - Maps natal.direction/strength/structural.primarySupport/structural.primaryChallenge
 * - Includes expressions for per-expression qualification in the semantic resolver
 * - Does NOT set dashaEffect/dashaDirection/dashaStrength (C10 is parallel to C9)
 */
function buildCareerD10Context(
  input: CareerD10IntegrationInput
): CareerD10Context {
  const { horoscope, natal, expression } = input;

  const d10Planets = buildD10PlanetContexts(horoscope);
  const d10Houses = buildD10HouseContexts(horoscope);

  const d10Available = d10Houses.length > 0 && d10Planets.length > 0;

  const context: CareerD10Context = Object.freeze({
    natalDirection: natal.structural.direction,
    natalStrength: natal.structural.strength,
    natalPrimarySupport: natal.structural.primarySupport,
    natalPrimaryChallenge: natal.structural.primaryChallenge,
    d10Available,
    d10Houses,
    d10Planets,
    expressions: expression.expressions
  });

  return context;
}

/**
 * Resolves canonical relationship from D10 qualification effect.
 * 
 * Mapping:
 * - REINFORCES → REINFORCES
 * - QUALIFIES → QUALIFIES
 * - WEAKENS → MODIFIES
 * - CONFLICTS → CONFLICTS
 * - INSUFFICIENT_DATA → PRESERVES
 * - UNAVAILABLE/default → UNAVAILABLE
 */
function resolveCanonicalRelationship(
  effect: CareerD10QualificationEffect
): 'REINFORCES' | 'QUALIFIES' | 'MODIFIES' | 'CONFLICTS' | 'PRESERVES' | 'UNAVAILABLE' {
  switch (effect) {
    case 'REINFORCES':
      return 'REINFORCES';
    case 'QUALIFIES':
      return 'QUALIFIES';
    case 'WEAKENS':
      return 'MODIFIES';
    case 'CONFLICTS':
      return 'CONFLICTS';
    case 'INSUFFICIENT_DATA':
      return 'PRESERVES';
    case 'UNAVAILABLE':
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Builds evidence identity key for canonical D10 evidence.
 * Format: CAREER_D10:<source>:<role>
 * Direction/effect/strength are occurrence attributes, not identity.
 */
export function buildD10EvidenceIdentityKey(
  source: string,
  role: string
): string {
  return `CAREER_D10:${source}:${role}`;
}

/**
 * Builds raw canonical occurrences from the semantic engine (no deduplication).
 *
 * This function:
 * - Builds identityKey without direction/effect/strength (semantic identity)
 * - Builds id with direction/effect/strength (occurrence identity)
 * - Attaches result.d10Effect and result.d10Strength to each canonical evidence
 * - Sets direction from the item
 * - Sets sourceIds: [item.id]
 * - Sets provenance with source: 'C10_D10', ruleIds, sourceIds, natalRootIds: []
 * - Does NOT deduplicate - returns one record per source occurrence
 * - Sorts output by identityKey.localeCompare
 * - Freezes all
 */
export function buildCanonicalOccurrences(
  evidence: readonly CareerD10Evidence[],
  result: CareerD10QualificationResult
): readonly CareerD10CanonicalEvidence[] {
  const occurrences: CareerD10CanonicalEvidence[] = [];

  for (const item of evidence) {
    const identityKey = buildD10EvidenceIdentityKey(
      item.source ?? 'UNKNOWN',
      item.role
    );

    const id = [identityKey, item.direction, result.d10Effect, result.d10Strength].join(':');

    const natalRootIds = Object.freeze([]);

    const provenance: CareerD10CanonicalProvenance = Object.freeze({
      source: 'C10_D10',
      ruleIds: Object.freeze([item.source ?? 'UNKNOWN']),
      sourceIds: Object.freeze([item.id]),
      natalRootIds
    });

    const canonicalEvidence: CareerD10CanonicalEvidence = Object.freeze({
      identityKey,
      id,
      role: item.role,
      direction: item.direction,
      d10Effect: result.d10Effect,
      d10Strength: result.d10Strength,
      weight: item.weight,
      statement: item.statement,
      sourceIds: provenance.sourceIds,
      provenance
    });

    occurrences.push(canonicalEvidence);
  }

  // Sort by identityKey.localeCompare
  const sortedOccurrences = occurrences.sort((a, b) =>
    a.identityKey.localeCompare(b.identityKey)
  );

  return Object.freeze(sortedOccurrences);
}

/**
 * Merges two canonical evidence occurrences with the same identityKey.
 * Resolves combined semantic state:
 * - direction: SUPPORT+SUPPORT→SUPPORT, CHALLENGE+CHALLENGE→CHALLENGE, SUPPORT+CHALLENGE→MIXED, MIXED+anything→MIXED
 * - weight: Math.max(existing.weight, incoming.weight)
 * - id: recomputed to reflect resolved state
 * - sourceIds, ruleIds, natalRootIds: merged via Set
 */
function mergeCanonicalOccurrences(
  existing: CareerD10CanonicalEvidence,
  incoming: CareerD10CanonicalEvidence
): CareerD10CanonicalEvidence {
  // Resolve direction
  let resolvedDirection: CareerD10QualificationDirection;
  if (existing.direction === 'MIXED' || incoming.direction === 'MIXED') {
    resolvedDirection = 'MIXED';
  } else if (existing.direction === incoming.direction) {
    resolvedDirection = existing.direction;
  } else {
    // SUPPORT + CHALLENGE or CHALLENGE + SUPPORT
    resolvedDirection = 'MIXED';
  }

  // Resolve weight (MAX)
  const resolvedWeight = Math.max(existing.weight, incoming.weight);

  // Merge sourceIds, ruleIds, natalRootIds
  const mergedSourceIds = Array.from(new Set([...existing.sourceIds, ...incoming.sourceIds]));
  const mergedRuleIds = Array.from(new Set([...existing.provenance.ruleIds, ...incoming.provenance.ruleIds]));
  const mergedRootIds = Array.from(new Set([...existing.provenance.natalRootIds, ...incoming.provenance.natalRootIds]));

  // Recompute id to reflect resolved state
  const resolvedId = [existing.identityKey, resolvedDirection, existing.d10Effect, existing.d10Strength].join(':');

  const mergedProvenance: CareerD10CanonicalProvenance = Object.freeze({
    source: 'C10_D10',
    ruleIds: Object.freeze(mergedRuleIds),
    sourceIds: Object.freeze(mergedSourceIds),
    natalRootIds: Object.freeze(mergedRootIds)
  });

  return Object.freeze({
    identityKey: existing.identityKey,
    id: resolvedId,
    role: existing.role,
    direction: resolvedDirection,
    d10Effect: existing.d10Effect,
    d10Strength: existing.d10Strength,
    weight: resolvedWeight,
    statement: existing.statement,
    sourceIds: Object.freeze(mergedSourceIds),
    provenance: mergedProvenance
  });
}

/**
 * Deduplicates canonical occurrences by identityKey.
 *
 * This function:
 * - Groups occurrences by identityKey
 * - Merges occurrences with the same identityKey using mergeCanonicalOccurrences
 * - Resolves combined direction (SUPPORT+CHALLENGE→MIXED) and MAX weight
 * - Sorts output by identityKey.localeCompare
 * - Freezes all
 */
export function dedupCanonicalEvidence(
  occurrences: readonly CareerD10CanonicalEvidence[]
): readonly CareerD10CanonicalEvidence[] {
  const evidenceMap = new Map<string, CareerD10CanonicalEvidence>();

  for (const occurrence of occurrences) {
    const existing = evidenceMap.get(occurrence.identityKey);
    if (existing) {
      evidenceMap.set(occurrence.identityKey, mergeCanonicalOccurrences(existing, occurrence));
    } else {
      evidenceMap.set(occurrence.identityKey, occurrence);
    }
  }

  // Sort by identityKey.localeCompare
  const sortedEvidence = Array.from(evidenceMap.values()).sort((a, b) =>
    a.identityKey.localeCompare(b.identityKey)
  );

  return Object.freeze(sortedEvidence);
}

/**
 * Builds D10 conflicts from canonical evidence.
 *
 * This function:
 * - Groups evidence by identityKey
 * - Emits a conflict only when both SUPPORT and CHALLENGE directions exist for the same key
 * - Sorts evidence-id arrays
 * - Sets supportWeight/challengeWeight to MAX single-occurrence weight (not counts)
 * - Sorts conflicts by identityKey
 *
 * This is traceability only — not a second direction resolver.
 */
export function buildD10Conflicts(
  canonicalEvidence: readonly CareerD10CanonicalEvidence[]
): readonly CareerD10Conflict[] {
  const evidenceByKey = new Map<string, CareerD10CanonicalEvidence[]>();

  for (const evidence of canonicalEvidence) {
    const existing = evidenceByKey.get(evidence.identityKey) ?? [];
    evidenceByKey.set(evidence.identityKey, [...existing, evidence]);
  }

  const conflicts: CareerD10Conflict[] = [];

  for (const [identityKey, evidenceList] of evidenceByKey.entries()) {
    const supportEvidence = evidenceList.filter(e => e.direction === 'SUPPORT');
    const challengeEvidence = evidenceList.filter(e => e.direction === 'CHALLENGE');

    if (supportEvidence.length > 0 && challengeEvidence.length > 0) {
      const supportEvidenceIds = Object.freeze(
        supportEvidence.map(e => e.id).sort()
      );
      const challengeEvidenceIds = Object.freeze(
        challengeEvidence.map(e => e.id).sort()
      );

      // Use MAX single-occurrence weight, not counts
      const supportWeight = supportEvidence.length > 0 ? Math.max(...supportEvidence.map(e => e.weight)) : 0;
      const challengeWeight = challengeEvidence.length > 0 ? Math.max(...challengeEvidence.map(e => e.weight)) : 0;

      const conflict: CareerD10Conflict = Object.freeze({
        identityKey,
        supportEvidenceIds,
        challengeEvidenceIds,
        supportWeight,
        challengeWeight,
        statement: `Conflict in D10 evidence for ${identityKey}: ${supportWeight} support weight vs ${challengeWeight} challenge weight.`
      });

      conflicts.push(conflict);
    }
  }

  // Sort by identityKey for determinism
  return Object.freeze(conflicts.sort((a, b) => a.identityKey.localeCompare(b.identityKey)));
}

/**
 * Resolves availability from the qualification result.
 * Per spec §23.
 */
function resolveAvailability(
  result: CareerD10QualificationResult
): 'AVAILABLE' | 'UNAVAILABLE' {
  // D10 is available if it produced a non-UNAVAILABLE effect
  return result.d10Effect !== 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE';
}

/**
 * Converts semantic expression qualification to canonical format.
 * This is assembly/formatting over the resolver's per-expression results.
 */
function canonicalizeExpressionQualification(
  semanticQual: CareerD10ExpressionQualification,
  expression: CareerExpression,
  canonicalEvidence: readonly CareerD10CanonicalEvidence[]
): CareerD10ExpressionQualificationCanonical {
  // Filter canonical evidence by semantic evidence IDs
  const qualificationEvidence = Object.freeze(
    canonicalEvidence.filter(e =>
      semanticQual.evidence.some(se => e.sourceIds.includes(se.id))
    )
  );

  return Object.freeze({
    expressionId: semanticQual.expressionId,
    expression, // Preserve the original expression (including conditional flag)
    qualified: semanticQual.qualified,
    effect: semanticQual.effect,
    direction: semanticQual.direction,
    strength: semanticQual.strength,
    evidence: qualificationEvidence,
    statement: semanticQual.statement
  });
}

/**
 * Resolves natal root evidence IDs.
 * 
 * Conservative implementation: returns empty array (mirror C9).
 * WeightedReasoningEvidence does not expose a structured field that reliably
 * identifies the planet/subject. The rootEvidenceId field is a forward-looking
 * W1 concept that is not yet implemented in the current codebase.
 * 
 * Rather than fabricating links via string matching (which would be unreliable
 * and create false provenance), this function returns an empty array.
 */
function resolveNatalRootEvidenceIds(
  _natal: CareerNatalAnalysis,
  _evidence: readonly CareerD10Evidence[]
): readonly string[] {
  return Object.freeze([]);
}

/**
 * Canonical public function for C10 D10 qualification analysis.
 * 
 * This function:
 * - Builds context from horoscope and natal
 * - Calls resolveCareerD10Qualification(context) from ./careerD10Qualification
 * - Canonicalizes evidence with identityKey and provenance
 * - Builds conflicts from canonical evidence
 * - Qualifies expressions from C8
 * - Resolves availability and relationship
 * - Collects root evidence IDs (conservative empty array)
 * - Returns a frozen CareerD10CanonicalAnalysis
 * 
 * Does NOT include dasha/timing/C11 fields (no dashaEffect, no timing, no finalConclusion).
 * 
 * @param input - The integration input containing horoscope, natal, and expression
 * @returns A frozen CareerD10CanonicalAnalysis
 */
export function buildCareerD10Analysis(
  input: CareerD10IntegrationInput
): CareerD10CanonicalAnalysis {
  const context = buildCareerD10Context(input);

  // Call the existing C10 semantic engine
  const result = resolveCareerD10Qualification(context);

  // Build raw canonical occurrences (no dedup)
  const rawOccurrences = buildCanonicalOccurrences(result.evidence, result);

  // Build conflicts from raw occurrences (so we can see both SUPPORT and CHALLENGE for same key)
  const conflicts = buildD10Conflicts(rawOccurrences);

  // Dedup canonical evidence for output (resolves combined state)
  const canonicalEvidence = dedupCanonicalEvidence(rawOccurrences);

  // Convert semantic expression qualifications to canonical format
  // The semantic resolver already populated expressionQualifications in result
  const expressionQualifications = Object.freeze(
    result.expressionQualifications.map(semanticQual => {
      // Find the original expression by mode (first part of expressionId)
      const mode = semanticQual.expressionId.split(':')[0];
      const expression = input.expression.expressions.find(e => e.mode === mode);
      if (!expression) {
        throw new Error(`Expression with mode ${mode} not found in input`);
      }
      return canonicalizeExpressionQualification(semanticQual, expression, canonicalEvidence);
    })
  );

  // Resolve availability
  const availability = resolveAvailability(result);

  // Resolve relationship
  const relationship = resolveCanonicalRelationship(result.d10Effect);

  // Collect root evidence IDs (conservative empty array)
  const rootEvidenceIds = Object.freeze(
    Array.from(new Set(canonicalEvidence.flatMap(e => e.provenance.natalRootIds))).sort()
  );

  // Build statement
  const statement = [
    `Career D10 qualification analysis.`,
    `Availability: ${availability}.`,
    `Natal direction: ${result.natalDirection}.`,
    `Natal strength: ${result.natalStrength}.`,
    `D10 effect: ${result.d10Effect}.`,
    `D10 direction: ${result.d10Direction}.`,
    `D10 strength: ${result.d10Strength}.`,
    `Qualified direction: ${result.qualifiedDirection}.`,
    `Qualified strength: ${result.qualifiedStrength}.`,
    `Natal promise preserved: ${result.natalPromisePreserved}.`,
    `Relationship: ${relationship}.`,
    `Evidence count: ${canonicalEvidence.length}.`,
    `Conflicts count: ${conflicts.length}.`,
    `Expression qualifications count: ${expressionQualifications.length}.`
  ].join(' ');

  // Return frozen canonical analysis
  return Object.freeze({
    availability,
    natalDirection: result.natalDirection,
    natalStrength: result.natalStrength,
    d10Effect: result.d10Effect,
    d10Direction: result.d10Direction,
    d10Strength: result.d10Strength,
    qualifiedDirection: result.qualifiedDirection,
    qualifiedStrength: result.qualifiedStrength,
    natalPromisePreserved: result.natalPromisePreserved,
    relationship,
    evidence: canonicalEvidence,
    conflicts,
    expressionQualifications,
    rootEvidenceIds,
    statement
  });
}
