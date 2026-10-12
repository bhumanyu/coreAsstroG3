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
import {
  defaultCareerDispositorContextFactory,
  defaultCareerDispositorEngineAdapter
} from '../careerMechanism/dispositor/careerMechanismDispositorAdapter';

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
 * - Dispositor contexts: two-pass orchestration when enableDispositorContexts=true
 *
 * DEFERRED FEATURES (documented in P2-11G):
 * - Identity mappings: ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED (partial linkage exists)
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
   *
   * When true, the builder runs a two-pass orchestration:
   * - Pass 1: orchestrate with dispositorContexts: undefined to obtain resolvedMechanisms
   * - Build CareerDispositorContext[] for each resolved candidate via
   *   defaultCareerDispositorContextFactory.create(candidate, defaultCareerDispositorEngineAdapter, horoscope)
   * - Pass 2: orchestrate again with the assembled dispositorContexts
   *
   * CRITICAL invariant preservation: only the orchestrator composition re-runs between passes.
   * The upstream astrology producers (structural, graph, networks, patterns, relevance, condition)
   * are computed once and reused for both passes, preserving the "run each producer once per intended analysis" invariant.
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
 * When enableDispositorContexts is true, runs a two-pass orchestration:
 * - Pass 1: orchestrate without dispositor contexts to get resolved mechanisms
 * - Build dispositor contexts from resolved mechanisms
 * - Pass 2: re-orchestrate with dispositor contexts
 *
 * CRITICAL: The upstream producers (structural, graph, networks, patterns, relevance, condition)
 * are computed once and reused for both passes, preserving the "run each producer once per intended analysis" invariant.
 *
 * @param input - The input containing the horoscope and optional feature flags
 * @returns The canonical career foundation
 */
export function buildCanonicalCareerFoundation(
  input: CanonicalCareerFoundationBuilderInput
): CanonicalCareerFoundation {
  const { horoscope, enableDispositorContexts = false } = input;

  // Step 1: Run canonical upstream chain exactly once (shared between passes if two-pass)
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

  // Step 4: Two-pass orchestration if dispositor contexts enabled
  if (enableDispositorContexts) {
    // Pass 1: Orchestrate without dispositor contexts to get resolved mechanisms
    const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
    const pass1Input: CanonicalCareerOrchestrationInput = {
      patterns: patterns.patterns,
      relevance,
      condition,
      networks: networks.networks,
      dispositorContexts: undefined,
      result10H: result10HOrchestratorInput,
      result10L: result10LOrchestratorInput
    };
    const pass1Foundation = orchestrator.orchestrate(pass1Input);

    // Build dispositor contexts from resolved mechanisms
    const dispositorContexts: import('../careerMechanism/dispositor/careerMechanismDispositorTypes').CareerDispositorContext[] = [];
    for (const resolvedMechanism of pass1Foundation.resolvedMechanisms) {
      const contexts = defaultCareerDispositorContextFactory.create(
        resolvedMechanism.candidate,
        defaultCareerDispositorEngineAdapter,
        horoscope
      );
      dispositorContexts.push(...contexts);
    }

    // Pass 2: Re-orchestrate with dispositor contexts
    const pass2Input: CanonicalCareerOrchestrationInput = {
      patterns: patterns.patterns,
      relevance,
      condition,
      networks: networks.networks,
      dispositorContexts: Object.freeze(dispositorContexts),
      result10H: result10HOrchestratorInput,
      result10L: result10LOrchestratorInput
    };
    const pass2Foundation = orchestrator.orchestrate(pass2Input);

    return pass2Foundation;
  }

  // Single-pass orchestration (default behavior)
  const orchestrationInput: CanonicalCareerOrchestrationInput = {
    patterns: patterns.patterns,
    relevance,
    condition,
    networks: networks.networks,
    // Dispositor contexts: deferred (ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE)
    dispositorContexts: undefined,
    // 10H/10L: wired (passed when COMPLETE status)
    result10H: result10HOrchestratorInput,
    result10L: result10LOrchestratorInput
  };

  // Invoke orchestrator
  const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
  const foundation = orchestrator.orchestrate(orchestrationInput);

  return foundation;
}
