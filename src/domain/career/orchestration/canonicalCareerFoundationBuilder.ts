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
 * DEFERRED FEATURES (documented in P2-11G):
 * - Dispositor contexts: ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE
 * - 10H/10L supplements: Not wired in this milestone
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

  // Step 2: Assemble orchestrator input
  const orchestrationInput: CanonicalCareerOrchestrationInput = {
    patterns: patterns.patterns,
    relevance,
    condition,
    networks: networks.networks,
    // Dispositor contexts: deferred in this milestone (ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE)
    // Future enablement: when enableDispositorContexts is true, wire DefaultCareerDispositorContextFactory
    dispositorContexts: undefined,
    // 10H/10L: deferred in this milestone
    // Future enablement: when enable10H/enable10L are true, wire resolveCareer10HFoundation/resolveCareer10LFoundation
    result10H: undefined,
    result10L: undefined
  };

  // Step 3: Invoke orchestrator
  const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
  const foundation = orchestrator.orchestrate(orchestrationInput);

  return foundation;
}
