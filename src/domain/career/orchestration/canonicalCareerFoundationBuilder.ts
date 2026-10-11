import type { Horoscope } from '../../../types';
import type {
  CanonicalCareerFoundation,
  CanonicalCareerOrchestrationInput
} from './canonicalCareerContracts';
import { CanonicalCareerOrchestrator } from './canonicalCareerOrchestrator';
import { defaultCareerOrchestrationPorts } from './canonicalCareerPortsAdapter';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph';
import { classifyCareerPatterns } from '../careerPattern/careerPatternClassification';
import { buildCareerPlanetaryRelevance } from '../careerPlanetaryRelevanceIntegration';
import { buildCareerPlanetaryCondition } from '../careerPlanetaryConditionIntegration';
import { resolveCareer10HFoundation } from '../career10h/defaultCareer10HFoundation';
import { resolveCareer10LFoundation } from '../career10h/defaultCareer10LFoundation';

/**
 * P2-11G Production Integration Boundary
 *
 * This module provides the single production composition point that builds the
 * orchestrator's inputs from the real engine chain (structural → graph → networks →
 * patterns → relevance → condition) exactly once, reusing the existing producers.
 *
 * NO re-derivation and NO second authority: The canonical C4–C11 chain in
 * interpretCareerV2 remains the authority; the orchestration foundation is a
 * composition artifact, not a competing conclusion.
 *
 * COMPOSITION POINT RESPONSIBILITIES:
 * - Runs the canonical upstream chain exactly once
 * - Assembles CanonicalCareerOrchestrationInput from real producers
 * - Invokes the orchestrator via defaultCareerOrchestrationPorts
 * - Returns the CanonicalCareerFoundation
 *
 * WIRED FEATURES (current milestone):
 * - 10H: resolveCareer10HFoundation({ horoscope }) - passed when status is COMPLETE
 * - 10L: resolveCareer10LFoundation({ foundation, houseLordship }) - passed when resolvable
 *
 * DEFERRED FEATURES (documented in P2-11G):
 * - Dispositor contexts: ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE
 *   - Blocker: Dispositor contexts depend on resolved mechanisms from the orchestrator,
 *     requiring either a two-pass orchestration or an orchestrator contract change.
 *     Keeping deferred with documented blocker rather than forcing contract change.
 * - Identity mappings: ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED
 *
 * BOUNDARY ENFORCEMENT: This module must NOT:
 * - Implement any astrology calculations or interpretations
 * - Import from careerDasha, careerD10, careerExpression, careerFinalSynthesis
 * - Import from domain/timing
 * - Duplicate derivation from the canonical C4–C11 chain
 *
 * Only composition of existing producers.
 */

/**
 * Input for building the canonical career foundation.
 */
export interface CanonicalCareerFoundationBuilderInput {
  readonly horoscope: Horoscope;
  /**
   * Feature flag for enabling dispositor contexts.
   * Default false - dispositor contexts remain deferred (ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE).
   * Future enablement would require either:
   * - Two-pass orchestration (first pass to get mechanisms, build contexts, second pass with contexts)
   * - Orchestrator contract change to accept contexts after mechanism resolution
   */
  readonly enableDispositorContexts?: boolean;
}

/**
 * Builds the canonical career foundation from a horoscope.
 *
 * This function runs the canonical upstream chain exactly once:
 * 1. buildCareerStructuralReasoning({ horoscope })
 * 2. buildCareerGraphFactsFromStructural(structural)
 * 3. buildCareerAstroGraph({ facts })
 * 4. detectCareerHouseNetworks({ graph })
 * 5. classifyCareerPatterns({ networks })
 * 6. buildCareerPlanetaryRelevance({ horoscope, structural })
 * 7. buildCareerPlanetaryCondition({ horoscope, relevance })
 *
 * Then assembles the orchestrator input and invokes the orchestrator.
 *
 * @param input - The input containing the horoscope and optional feature flags
 * @returns The canonical career foundation
 */
export function buildCanonicalCareerFoundation(
  input: CanonicalCareerFoundationBuilderInput
): CanonicalCareerFoundation {
  const { horoscope } = input;

  // Step 1: Run canonical upstream chain exactly once
  const structural = buildCareerStructuralReasoning({ horoscope });
  const facts = buildCareerGraphFactsFromStructural(structural);
  const graph = buildCareerAstroGraph({ facts });
  const networks = detectCareerHouseNetworks({ graph });
  const patterns = classifyCareerPatterns({ networks: networks.networks });
  const relevance = buildCareerPlanetaryRelevance({ horoscope, structural });
  const condition = buildCareerPlanetaryCondition({ horoscope, relevance });

  // Step 2: Wire 10H foundation
  // Resolve 10H from horoscope, pass only when status is COMPLETE
  const result10H = resolveCareer10HFoundation({ horoscope });
  const result10HOrchestratorInput = result10H.status === 'COMPLETE' ? result10H : undefined;

  // Step 3: Wire 10L foundation
  // Resolve 10L from 10H foundation + houseLordship, pass only when resolvable
  let result10LOrchestratorInput;
  if (result10HOrchestratorInput) {
    const result10L = resolveCareer10LFoundation({
      foundation: result10HOrchestratorInput.foundation,
      houseLordship: horoscope.houseLordship
    });
    result10LOrchestratorInput = result10L.status === 'COMPLETE' ? result10L : undefined;
  } else {
    result10LOrchestratorInput = undefined;
  }

  // Step 4: Assemble orchestrator input
  const orchestrationInput: CanonicalCareerOrchestrationInput = {
    patterns: patterns.patterns,
    relevance,
    condition,
    networks: networks.networks,
    // Dispositor contexts: deferred in this milestone (ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE)
    // Blocker: Dispositor contexts depend on resolved mechanisms from the orchestrator.
    // Two-pass orchestration would be required:
    //   Pass 1: Orchestrate without contexts to get mechanisms
    //   Pass 2: Build contexts from mechanisms, re-orchestrate with contexts
    // This violates the "run each producer once per intended analysis" invariant.
    // Keeping deferred with documented blocker rather than forcing contract change.
    dispositorContexts: undefined,
    // 10H/10L: wired in this milestone (passed when COMPLETE status)
    result10H: result10HOrchestratorInput,
    result10L: result10LOrchestratorInput
  };

  // Step 5: Invoke orchestrator
  const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
  const foundation = orchestrator.orchestrate(orchestrationInput);

  return foundation;
}
