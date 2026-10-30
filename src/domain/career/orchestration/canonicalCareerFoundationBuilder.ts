import type { Horoscope } from '../../../types';
import type {
  CanonicalCareerFoundation,
  OrchestrationDiagnostic,
  CanonicalCareerOrchestrationInput
} from './canonicalCareerContracts';
import { CanonicalCareerOrchestrator } from './canonicalCareerOrchestrator';
import { defaultCareerOrchestrationPorts } from './canonicalCareerPortsAdapter';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import type { CareerStructuralReasoning } from '../careerStructuralReasoning';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph';
import { classifyCareerPatterns } from '../careerPattern/careerPatternClassification';
import { buildCareerPlanetaryRelevance } from '../careerPlanetaryRelevanceIntegration';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import { buildCareerPlanetaryCondition } from '../careerPlanetaryConditionIntegration';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
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
 * - Dispositor contexts: two-pass orchestration when enableDispositorContexts=true (default false)
 *
 * DEFERRED FEATURES (documented in P2-11G):
 * - Identity mappings: ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL (semantic identity is partial)
 *   - Pattern → Qualification: mapped only when both producers supply semantic identity keys
 *   - Qualification → Mechanism and Mechanism → Refinement: no producer identity keys
 *   - Participant-role and downstream lineage: validated structural relationship mappings
 *   - No fabricated identity keys - only real semantic identityKey values are used
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
   * Optional pre-computed inputs from the canonical C4-C11 chain.
   * When provided, these values are reused instead of recomputed.
   * This eliminates duplicate derivation when the foundation builder is called
   * from interpretCareerV2, which already computes structural, relevance, and condition
   * via buildCareerNatalAnalysis.
   *
   * When not provided, the builder computes these values internally as before.
   */
  readonly preComputedInputs?: {
    readonly structural: CareerStructuralReasoning;
    readonly relevance: readonly CareerPlanetaryRelevance[];
    readonly condition: readonly CareerPlanetaryConditionResult[];
  };
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
 * 1. buildCareerStructuralReasoning({ horoscope }) - OR reuse from preComputedInputs
 * 2. buildCareerGraphFactsFromStructural(structural)
 * 3. buildCareerAstroGraph({ facts })
 * 4. detectCareerHouseNetworks({ graph })
 * 5. classifyCareerPatterns({ networks })
 * 6. buildCareerPlanetaryRelevance({ horoscope, structural }) - OR reuse from preComputedInputs
 * 7. buildCareerPlanetaryCondition({ horoscope, relevance }) - OR reuse from preComputedInputs
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
 * When preComputedInputs is provided, structural, relevance, and condition are reused from the caller
 * (e.g., from buildCareerNatalAnalysis in interpretCareerV2) to eliminate duplicate derivation.
 *
 * @param input - The input containing the horoscope and optional feature flags
 * @returns The canonical career foundation
 */
export function buildCanonicalCareerFoundation(
  input: CanonicalCareerFoundationBuilderInput
): CanonicalCareerFoundation {
  const { horoscope, preComputedInputs, enableDispositorContexts = false } = input;

  // Step 1: Run canonical upstream chain exactly once (shared between passes if two-pass)
  // Use preComputedInputs if provided to avoid duplicate derivation
  const structural = preComputedInputs?.structural ?? buildCareerStructuralReasoning({ horoscope });
  const facts = buildCareerGraphFactsFromStructural(structural);
  const graph = buildCareerAstroGraph({ facts });
  const networks = detectCareerHouseNetworks({ graph });
  const patterns = classifyCareerPatterns({ networks: networks.networks });
  const relevance = preComputedInputs?.relevance ?? buildCareerPlanetaryRelevance({ horoscope, structural });
  const condition = preComputedInputs?.condition ?? buildCareerPlanetaryCondition({ horoscope, relevance });

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
    const contextFactoryDiagnostics: OrchestrationDiagnostic[] = [];
    for (const resolvedMechanism of pass1Foundation.resolvedMechanisms) {
      try {
        const contexts = defaultCareerDispositorContextFactory.create(
          resolvedMechanism.candidate,
          defaultCareerDispositorEngineAdapter,
          horoscope
        );
        dispositorContexts.push(...contexts);
      } catch (error) {
        contextFactoryDiagnostics.push(Object.freeze({
          diagnosticId: `ORCHESTRATION_DISPOSITOR_CONTEXT_FACTORY_ERROR_${resolvedMechanism.candidateId}`,
          severity: 'ERROR',
          category: 'PORT_ERROR',
          message: `Dispositor context factory threw; pass-two refinement unavailable for candidate ${resolvedMechanism.candidateId}: ${error instanceof Error ? error.message : String(error)}`,
          relatedIds: Object.freeze([resolvedMechanism.candidateId]),
          stage: 'REFINEMENT'
        }));
      }
    }

    // A missing context affects only its candidate. The orchestrator calls the
    // refiner with an empty candidate-owned context set and returns INSUFFICIENT_DATA.
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

    if (contextFactoryDiagnostics.length > 0) {
      // Context-factory exceptions are isolated operational failures for the named candidate(s).
      // Candidate refinement is unavailable, but the shared canonical foundation remains VALID;
      // aggregate contractValidity is reserved for pass-wide input/identity failures.
      return Object.freeze({
        ...pass2Foundation,
        diagnostics: Object.freeze([...pass2Foundation.diagnostics, ...contextFactoryDiagnostics])
      });
    }
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
