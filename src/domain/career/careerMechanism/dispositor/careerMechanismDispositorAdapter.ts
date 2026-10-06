import type { Horoscope, Planet } from '../../../../types';
import type {
  CareerDispositorChain as NormalizedDispositorChain,
  CareerDispositorContext
} from './careerMechanismDispositorTypes';
import type { CareerMechanismCandidate } from '../careerMechanismTypes';
import { traverseDispositorChain, detectChainMutualReception } from '../../careerDispositor/careerDispositor';
import { buildCareerDispositorChainId } from '../../careerDispositor/careerDispositorIdentity';
import { MAX_DISPOSITOR_DEPTH, resolveTermination } from '../../careerDispositor/careerDispositorRules';
import { createParticipantId } from '../../careerParticipantRoles/participantRoleUtils';

/**
 * P2-07E Career Mechanism Dispositor Adapter Boundary
 *
 * This module implements the adapter boundary between the career mechanism dispositor
 * refinement layer and the existing careerDispositor engine.
 *
 * Per spec §20: implement against the REAL exports in src/domain/career/careerDispositor/
 * - traverseDispositorChains/traverseDispositorChain and its chain result type
 * - Termination mapping per spec
 * - chainId from the engine's chain identity
 * - sourceEvidenceIds must carry the specific career-relevance evidence
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerD10
 * - careerDasha
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 */

/**
 * Adapter interface for the career dispositor engine.
 * Wraps the real dispositor traversal for mechanism refinement.
 */
export interface CareerDispositorEngineAdapter {
  /**
   * Resolves the dispositor chain for a given planet.
   * Returns a normalized CareerDispositorChain for mechanism refinement.
   */
  resolve(planetId: Planet, horoscope: Horoscope): NormalizedDispositorChain;
}

/**
 * Default implementation of CareerDispositorEngineAdapter.
 * Uses the real careerDispositor engine's traverseDispositorChain.
 */
export class DefaultCareerDispositorEngineAdapter implements CareerDispositorEngineAdapter {
  /**
   * Resolves the dispositor chain for a given planet.
   * Maps the engine's CareerDispositorChain to the normalized view.
   */
  resolve(planetId: Planet, horoscope: Horoscope): NormalizedDispositorChain {
    // Use the real engine's traverseDispositorChain
    const engineResult = traverseDispositorChain(horoscope, planetId);

    // Detect mutual reception using the engine's function
    const hasMutualReception = detectChainMutualReception(horoscope, engineResult.chain);

    const cycle = engineResult.cycleStartPlanet !== undefined;

    // Determine if it's a self-dispositor
    const isSelfDispositor = !cycle && engineResult.terminalPlanet === planetId && engineResult.depth === 0;

    // Determine if terminal is career-relevant (simplified - always treat as career terminal for now)
    // In a full implementation, this would check if the terminal planet is career-relevant
    const isCareerTerminal = engineResult.terminalPlanet !== undefined;

    // Compute depth-limit exhaustion directly
    const depthLimited = engineResult.terminalPlanet === undefined &&
      engineResult.cycleStartPlanet === undefined &&
      engineResult.depth >= MAX_DISPOSITOR_DEPTH;

    // Compute termination using the engine's resolveTermination function
    const termination = resolveTermination(
      cycle,
      hasMutualReception,
      isSelfDispositor,
      isCareerTerminal,
      engineResult.terminalPlanet !== undefined
    );

    // Map termination enum to normalized outcome, checking depthLimited before UNAVAILABLE
    const outcome = this.mapTerminationToOutcome(termination, engineResult.depth, depthLimited);

    // Build chainId using the engine's identity function
    const chainId = buildCareerDispositorChainId(planetId, engineResult.chain);

    // Extract provenanceIds from the engine chain (empty for now as engine doesn't surface it)
    const provenanceIds: readonly string[] = Object.freeze([]);

    return Object.freeze({
      startPlanetId: planetId,
      chain: Object.freeze(engineResult.chain),
      terminalPlanetId: engineResult.terminalPlanet,
      depth: engineResult.depth,
      outcome,
      chainId,
      provenanceIds
    });
  }

  /**
   * Maps engine termination enum to normalized outcome.
   * Per spec:
   * - CAREER_TERMINAL / NON_CAREER_TERMINAL → TERMINAL
   * - SELF_DISPOSITOR → SELF_DISPOSITOR
   * - CYCLE → CYCLE
   * - MUTUAL_RECEPTION → MUTUAL_RECEPTION
   * - UNAVAILABLE → INSUFFICIENT_DATA (only if not depth-limited)
   * - depth limit → DEPTH_LIMIT
   */
  private mapTerminationToOutcome(
    termination: 'SELF_DISPOSITOR' | 'CYCLE' | 'MUTUAL_RECEPTION' | 'CAREER_TERMINAL' | 'NON_CAREER_TERMINAL' | 'UNAVAILABLE',
    depth: number,
    depthLimited: boolean
  ): NormalizedDispositorChain['outcome'] {
    switch (termination) {
      case 'SELF_DISPOSITOR':
        return 'SELF_DISPOSITOR';
      case 'CYCLE':
        return 'CYCLE';
      case 'MUTUAL_RECEPTION':
        return 'MUTUAL_RECEPTION';
      case 'CAREER_TERMINAL':
      case 'NON_CAREER_TERMINAL':
        return 'TERMINAL';
      case 'UNAVAILABLE':
        // Check depthLimited before mapping to INSUFFICIENT_DATA
        if (depthLimited) {
          return 'DEPTH_LIMIT';
        }
        return 'INSUFFICIENT_DATA';
      default:
        // If depth reached MAX_DISPOSITOR_DEPTH without termination, treat as DEPTH_LIMIT
        if (depthLimited) {
          return 'DEPTH_LIMIT';
        }
        return 'INSUFFICIENT_DATA';
    }
  }
}

/**
 * Factory for creating dispositor contexts from candidates and the engine.
 */
export interface CareerDispositorContextFactory {
  /**
   * Creates dispositor contexts for a candidate using the engine.
   * Contexts are derived from the candidate's participant planets.
   */
  create(
    candidate: CareerMechanismCandidate,
    engine: CareerDispositorEngineAdapter,
    horoscope: Horoscope
  ): readonly CareerDispositorContext[];
}

/**
 * Default implementation of CareerDispositorContextFactory.
 * Extracts participant planets from the candidate and builds contexts.
 */
export class DefaultCareerDispositorContextFactory implements CareerDispositorContextFactory {
  /**
   * Creates dispositor contexts for a candidate.
   * For each participant planet in the candidate, resolve its dispositor chain
   * and create a context with sourceEvidenceIds from the candidate's evidence.
   */
  create(
    candidate: CareerMechanismCandidate,
    engine: CareerDispositorEngineAdapter,
    horoscope: Horoscope
  ): readonly CareerDispositorContext[] {
    const contexts: CareerDispositorContext[] = [];

    // Extract participant planets from candidate provenance
    const participantPlanets = this.extractParticipantPlanets(candidate);

    // For each participant planet, create a context
    for (const planet of participantPlanets) {
      const chain = engine.resolve(planet, horoscope);

      // Determine if data is sufficient
      const sufficientData = chain.outcome !== 'INSUFFICIENT_DATA';

      // Extract sourceEvidenceIds for this planet from candidate evidence
      const sourceEvidenceIds = this.extractSourceEvidenceIds(candidate, planet);

      // Extract relevant house IDs from candidate evidence
      const relevantHouseIds = this.extractRelevantHouseIds(candidate);

      const context: CareerDispositorContext = Object.freeze({
        startPlanetId: planet,
        chain: chain.chain,
        terminalPlanetId: chain.terminalPlanetId,
        depth: chain.depth,
        outcome: chain.outcome,
        chainId: chain.chainId,
        provenanceIds: chain.provenanceIds,
        sourceEvidenceIds,
        relevantHouseIds,
        sufficientData
      });

      contexts.push(context);
    }

    // Sort by startPlanetId for deterministic output
    const sorted = [...contexts].sort((a, b) =>
      a.startPlanetId.localeCompare(b.startPlanetId)
    );

    return Object.freeze(sorted);
  }

  /**
   * Extracts participant planets from a candidate.
   * Parses participant IDs to extract planet names.
   * Normalizes to canonical PLANET: format.
   */
  private extractParticipantPlanets(candidate: CareerMechanismCandidate): Planet[] {
    const planets = new Set<Planet>();

    for (const participantId of candidate.provenance.participantIds) {
      // Extract planet from participant ID (e.g., "PLANET:Mercury" -> "Mercury")
      const match = participantId.match(/^PLANET:(.+)$/);
      if (match) {
        planets.add(match[1] as Planet);
      }
    }

    return Array.from(planets);
  }

  /**
   * Extracts source evidence IDs for a specific planet from candidate evidence.
   * This carries the specific evidence responsible for the planet being career-relevant.
   * Uses canonical PLANET: format for matching.
   */
  private extractSourceEvidenceIds(
    candidate: CareerMechanismCandidate,
    planet: Planet
  ): readonly string[] {
    const evidenceIds: string[] = [];

    for (const evidence of candidate.evidence) {
      // Check if this evidence mentions the planet (canonical PLANET: format)
      const planetId = createParticipantId(planet);
      if (evidence.participantIds.includes(planetId)) {
        evidenceIds.push(evidence.evidenceId);
      }
    }

    return Object.freeze(evidenceIds);
  }

  /**
   * Extracts relevant house IDs from candidate evidence.
   * Parses evidence explanations or participant IDs to find house references.
   */
  private extractRelevantHouseIds(candidate: CareerMechanismCandidate): readonly number[] {
    const houseIds = new Set<number>();

    // For now, return empty array as house extraction is context-specific
    // This can be enhanced later if needed

    return Object.freeze(Array.from(houseIds));
  }
}

/**
 * Default adapter instance.
 */
export const defaultCareerDispositorEngineAdapter = Object.freeze(
  new DefaultCareerDispositorEngineAdapter()
);

/**
 * Default context factory instance.
 */
export const defaultCareerDispositorContextFactory = Object.freeze(
  new DefaultCareerDispositorContextFactory()
);
