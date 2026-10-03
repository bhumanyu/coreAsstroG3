import type { CareerPattern } from '../careerPattern/careerPatternTypes';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type {
  CareerPatternPlanetaryCondition,
  CareerPatternCareerRelevance,
  CareerPatternStructuralStrength,
  CareerPatternCoherence,
  CareerPatternActivationPotential,
  CareerPatternDivisionalConfirmation,
  CareerPatternQualificationStatus,
  CareerPatternQualificationDimensions
} from './careerPatternQualificationTypes';

/**
 * P2-04 Career Pattern Qualification Rules
 *
 * This module implements the mapping and classification logic for pattern qualification.
 * It maps C5/C6 results to qualification-level assessments and classifies structural
 * dimensions based on pattern topology and participant data.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Maps C6 CareerPlanetaryCondition to qualification-level planetary condition.
 *
 * Switches on result.condition (the C6-resolved condition), not result.dignity.
 * This is correct because C6 has already performed the complex dignity/affliction/
 * combustion analysis to produce a resolved condition value.
 *
 * Mapping:
 * - STRONG → STRONG
 * - MODERATE → MODERATE
 * - NEUTRAL → MODERATE (conservative: neutral dignity does not imply weak condition)
 * - WEAK → WEAK
 * - AFFLICTED → WEAK
 * - UNAVAILABLE or missing → UNAVAILABLE
 */
export function mapPlanetaryCondition(
  result: CareerPlanetaryConditionResult | undefined
): CareerPatternPlanetaryCondition {
  if (!result) {
    return 'UNAVAILABLE';
  }

  switch (result.condition) {
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'NEUTRAL':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'AFFLICTED':
      return 'WEAK';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Maps C5 CareerPlanetRelevance to qualification-level career relevance.
 *
 * Mapping:
 * - PRIMARY → PRIMARY
 * - SUPPORTING → SUPPORTING
 * - SECONDARY → SUPPORTING (secondary relevance is treated as supporting)
 * - CONDITIONAL → MIXED (conditional relevance has mixed implications)
 * - NEUTRAL → NEUTRAL
 * - missing → UNAVAILABLE
 */
export function mapCareerRelevance(
  item: CareerPlanetaryRelevance | undefined
): CareerPatternCareerRelevance {
  if (!item) {
    return 'UNAVAILABLE';
  }

  switch (item.relevance) {
    case 'PRIMARY':
      return 'PRIMARY';
    case 'SUPPORTING':
      return 'SUPPORTING';
    case 'SECONDARY':
      return 'SUPPORTING';
    case 'CONDITIONAL':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Classifies the structural strength of a pattern.
 *
 * Per §16: Returns 'NOT_ASSESSED' for all patterns. The canonical
 * topology→strength mapping is deferred until the methodology is frozen.
 * The §5 LOOP→STRONG table is NOT used here.
 *
 * In a future implementation, this would analyze pattern topology
 * (e.g., LOOP, CHAIN, HUB-AND-SPOKE) and participant conditions
 * to produce a strength assessment.
 */
export function classifyStructuralStrength(
  _pattern: CareerPattern,
  _participantConditions: readonly CareerPatternPlanetaryCondition[]
): CareerPatternStructuralStrength {
  // Per §16: canonical topology→strength mapping is deferred until
  // the methodology is frozen. Do NOT use the §5 LOOP→STRONG table.
  return 'NOT_ASSESSED';
}

/**
 * Classifies the activation potential of a pattern.
 *
 * Per §16: Returns 'UNKNOWN' for all patterns. This module only assesses
 * structural potential; current activation remains C9's responsibility
 * (timing-aware). The §5 PARIVARTANA→HIGH table is NOT used here.
 *
 * In a future implementation, this would analyze pattern topology
 * and activation-related factors (e.g., parivartana yoga types) to
 * produce an activation potential assessment.
 */
export function classifyActivationPotential(
  _pattern: CareerPattern
): CareerPatternActivationPotential {
  // Per §16: structural potential only; current activation remains C9's.
  // Do NOT use the §5 PARIVARTANA→HIGH table.
  return 'UNKNOWN';
}

/**
 * Classifies the divisional confirmation of a pattern.
 *
 * Per §16: Returns 'NOT_ASSESSED' for all patterns. D10 qualification
 * is handled by C10 (careerD10), not this module.
 *
 * In a future implementation, this would integrate D10 analysis results
 * to produce a divisional confirmation assessment.
 */
export function classifyDivisionalConfirmation(
  _pattern: CareerPattern
): CareerPatternDivisionalConfirmation {
  // Per §16: D10 qualification is handled by C10 (careerD10).
  return 'NOT_ASSESSED';
}

/**
 * Classifies the coherence of a pattern.
 *
 * Keeps the assessment minimal and structural:
 * - INSUFFICIENT_DATA if houses or relationshipIds are empty
 * - MODERATE otherwise
 *
 * Does NOT rank topologies (e.g., LOOP > CHAIN) due to the same
 * unfrozen-methodology concern as structural strength.
 */
export function classifyPatternCoherence(
  pattern: CareerPattern
): CareerPatternCoherence {
  if (pattern.houses.length === 0 || pattern.relationshipIds.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  // Per §16: minimal structural assessment only; topology ranking
  // is deferred until the methodology is frozen.
  return 'MODERATE';
}

/**
 * Classifies the qualification status of a pattern.
 *
 * Uses semantic combinatorial logic (no arithmetic scoring). Since
 * structuralStrength will be 'NOT_ASSESSED', this extends the
 * insufficient-data guard so that NOT_ASSESSED/UNKNOWN/UNAVAILABLE
 * dimensions yield INSUFFICIENT_DATA rather than silently falling to
 * UNQUALIFIED.
 *
 * Logic:
 * - If any dimension is NOT_ASSESSED, UNKNOWN, or UNAVAILABLE → INSUFFICIENT_DATA
 * - If structuralStrength is STRONG and all dimensions are positive → QUALIFIED
 * - If structuralStrength is WEAK or any dimension is negative → UNQUALIFIED
 * - Otherwise → UNQUALIFIED (conservative default)
 *
 * Keep participants retained on the output for explainability (§8).
 */
export function classifyQualificationStatus(
  dimensions: CareerPatternQualificationDimensions
): CareerPatternQualificationStatus {
  // Insufficient data guard: NOT_ASSESSED, UNKNOWN, or UNAVAILABLE dimensions
  if (
    dimensions.structuralStrength === 'NOT_ASSESSED' ||
    dimensions.activationPotential === 'UNKNOWN' ||
    dimensions.divisionalConfirmation === 'NOT_ASSESSED' ||
    dimensions.planetaryCondition === 'UNAVAILABLE' ||
    dimensions.careerRelevance === 'UNAVAILABLE' ||
    dimensions.coherence === 'INSUFFICIENT_DATA'
  ) {
    return 'INSUFFICIENT_DATA';
  }

  // Positive qualification path
  if (
    dimensions.structuralStrength === 'STRONG' &&
    dimensions.planetaryCondition === 'STRONG' &&
    dimensions.careerRelevance === 'PRIMARY' &&
    dimensions.coherence === 'HIGH'
  ) {
    return 'QUALIFIED';
  }

  // Negative qualification path
  if (
    dimensions.structuralStrength === 'WEAK' ||
    dimensions.planetaryCondition === 'WEAK' ||
    dimensions.careerRelevance === 'NEUTRAL' ||
    dimensions.coherence === 'LOW'
  ) {
    return 'UNQUALIFIED';
  }

  // Conservative default
  return 'UNQUALIFIED';
}

/**
 * Computes qualification dimensions for a pattern.
 *
 * Aggregates all dimension classifications into a single dimensions object.
 *
 * Aggregation logic:
 * - Planetary condition: conservative (weakest participant condition wins)
 *   - UNAVAILABLE or WEAK in any participant yields that result
 * - Career relevance: conservative (lowest participant relevance wins)
 *   - MIXED downgrades both PRIMARY and SUPPORTING (any MIXED yields MIXED)
 *   - NEUTRAL or UNAVAILABLE in any participant yields that result
 */
export function computeQualificationDimensions(
  pattern: CareerPattern,
  participantConditions: readonly CareerPatternPlanetaryCondition[],
  participantRelevance: readonly CareerPatternCareerRelevance[]
): CareerPatternQualificationDimensions {
  const structuralStrength = classifyStructuralStrength(pattern, participantConditions);
  const activationPotential = classifyActivationPotential(pattern);
  const divisionalConfirmation = classifyDivisionalConfirmation(pattern);
  const coherence = classifyPatternCoherence(pattern);

  // Aggregate planetary condition (conservative: weakest participant condition)
  // UNAVAILABLE or WEAK in any participant yields that result
  const planetaryCondition = participantConditions.length > 0
    ? participantConditions.reduce((weakest, condition) => {
      if (condition === 'WEAK' || condition === 'UNAVAILABLE') return condition;
      if (weakest === 'WEAK' || weakest === 'UNAVAILABLE') return weakest;
      if (condition === 'MODERATE' && weakest === 'STRONG') return condition;
      return weakest;
    }, participantConditions[0])
    : 'UNAVAILABLE';

  // Aggregate career relevance (conservative: lowest participant relevance)
  // MIXED downgrades both PRIMARY and SUPPORTING (any MIXED in the set yields MIXED)
  const careerRelevance = participantRelevance.length > 0
    ? participantRelevance.reduce((lowest, relevance) => {
      if (relevance === 'NEUTRAL' || relevance === 'UNAVAILABLE') return relevance;
      if (lowest === 'NEUTRAL' || lowest === 'UNAVAILABLE') return lowest;
      if (relevance === 'MIXED' || lowest === 'MIXED') return 'MIXED';
      if (relevance === 'SUPPORTING' && lowest === 'PRIMARY') return relevance;
      return lowest;
    }, participantRelevance[0])
    : 'UNAVAILABLE';

  return Object.freeze({
    structuralStrength,
    planetaryCondition,
    careerRelevance,
    coherence,
    activationPotential,
    divisionalConfirmation
  });
}
