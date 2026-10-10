import type {
  QualificationPort,
  ParticipantRolesPort,
  MechanismResolverPort,
  MechanismRefinerPort
} from './canonicalCareerContracts';
import { qualifyCareerPatterns } from '../careerPatternQualification/careerPatternQualification';
import { assignParticipantRoles } from '../careerParticipantRoles/participantRoleEngine';
import { defaultCareerMechanismResolver } from '../careerMechanism/resolver/defaultCareerMechanismResolver';
import { defaultCareerMechanismDispositorRefiner } from '../careerMechanism/dispositor/defaultCareerMechanismDispositorRefiner';

/**
 * P2-11B Canonical Career Ports Adapter
 *
 * This module provides port adapters that wire the real career domain engines to the
 * orchestration port interfaces. The orchestrator itself remains engine-agnostic (ports
 * injected), but this adapter file provides the concrete wiring to the real APIs.
 *
 * ADAPTER MAPPING:
 * - Qualification: qualifyCareerPatterns({ patterns, relevance, condition }) → { qualifiedPatterns }
 * - Participant roles: assignParticipantRoles(context) per pattern with ParticipantRoleContext
 * - Mechanisms: defaultCareerMechanismResolver.resolveAll(inputs) with per-pattern CareerMechanismResolutionInput
 * - Refinement: defaultCareerMechanismDispositorRefiner.refine({ candidate, dispositorContexts }) per candidate
 * - 10H/10L: Consumes Career10HFoundation / Career10LFoundation (status COMPLETE | INSUFFICIENT_DATA)
 *
 * STATUS MAPPING:
 * - Qualification: Uses repo's QUALIFIED | UNQUALIFIED | INSUFFICIENT_DATA (no INDETERMINATE)
 * - Refinement: Maps Refined → REFINED, Unchanged → UNCHANGED, InsufficientData/missing → UNAVAILABLE
 * - 10H/10L: Maps COMPLETE → AVAILABLE, INSUFFICIENT_DATA → PARTIALLY_AVAILABLE/UNAVAILABLE
 *
 * BOUNDARY ENFORCEMENT: This module must NOT:
 * - Implement any astrology calculations or interpretations
 * - Import from careerDasha, careerD10, careerExpression, careerFinalSynthesis
 * - Import from domain/timing
 *
 * Only wiring of existing engines to port interfaces.
 */

/**
 * Adapter for the qualification port.
 * Wires the real qualifyCareerPatterns function to the QualificationPort interface.
 */
export class QualificationPortAdapter implements QualificationPort {
  /**
   * Qualifies career patterns using the real qualification engine.
   */
  qualifyCareerPatterns(input: {
    readonly patterns: readonly import('../careerPattern/careerPatternTypes').CareerPattern[];
    readonly relevance: readonly import('../careerPlanetaryRelevance').CareerPlanetaryRelevance[];
    readonly condition: readonly import('../careerPlanetaryCondition').CareerPlanetaryConditionResult[];
  }): {
    readonly qualifiedPatterns: readonly import('../careerPatternQualification/careerPatternQualificationTypes').QualifiedCareerPattern[];
  } {
    return qualifyCareerPatterns(input);
  }
}

/**
 * Adapter for the participant roles port.
 * Wires the real assignParticipantRoles function to the ParticipantRolesPort interface.
 *
 * The engine's assignParticipantRoles operates per-pattern over a ParticipantRoleContext.
 * This adapter calls it for each pattern and flattens the results.
 */
export class ParticipantRolesPortAdapter implements ParticipantRolesPort {
  /**
   * Assigns participant roles for a single pattern using the real role engine.
   */
  assignParticipantRoles(context: {
    readonly pattern: import('../careerPattern/careerPatternTypes').CareerPattern;
    readonly qualification: import('../careerPatternQualification/careerPatternQualificationTypes').QualifiedCareerPattern;
    readonly networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[];
    readonly planetaryConditions: readonly import('../careerPlanetaryCondition').CareerPlanetaryConditionResult[];
    readonly relevance: readonly import('../careerPlanetaryRelevance').CareerPlanetaryRelevance[];
  }): {
    readonly assignments: readonly import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment[];
  } {
    const result = assignParticipantRoles(context);

    // The engine returns ParticipantRoleResult with assignments array
    // We return it directly as the port expects engine-level assignments
    return {
      assignments: result.assignments
    };
  }
}

/**
 * Adapter for the mechanism resolver port.
 * Wires the real defaultCareerMechanismResolver to the MechanismResolverPort interface.
 *
 * The engine's resolveAll accepts CareerMechanismResolutionInput[] and returns CareerMechanismCandidateSet[].
 * This adapter passes through the inputs and outputs verbatim.
 */
export class MechanismResolverPortAdapter implements MechanismResolverPort {
  /**
   * Resolves mechanism candidates for a single pattern using the real resolver.
   */
  resolve(input: {
    readonly pattern: import('../careerPattern/careerPatternTypes').CareerPattern;
    readonly qualification: import('../careerPatternQualification/careerPatternQualificationTypes').QualifiedCareerPattern;
    readonly participantRoles: readonly import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment[];
    readonly establishingEvidence: readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismEvidence[];
    readonly networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[];
  }): import('../careerMechanism/careerMechanismTypes').CareerMechanismCandidateSet {
    return defaultCareerMechanismResolver.resolve(input);
  }

  /**
   * Resolves mechanism candidates for multiple patterns using the real resolver.
   */
  resolveAll(inputs: readonly {
    readonly pattern: import('../careerPattern/careerPatternTypes').CareerPattern;
    readonly qualification: import('../careerPatternQualification/careerPatternQualificationTypes').QualifiedCareerPattern;
    readonly participantRoles: readonly import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment[];
    readonly establishingEvidence: readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismEvidence[];
    readonly networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[];
  }[]): readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismCandidateSet[] {
    return defaultCareerMechanismResolver.resolveAll(inputs);
  }
}

/**
 * Adapter for the mechanism refiner port.
 * Wires the real defaultCareerMechanismDispositorRefiner to the MechanismRefinerPort interface.
 *
 * The engine's refine accepts CareerMechanismDispositorRefinementInput and returns
 * CareerMechanismDispositorRefinementResult.
 *
 * STATUS MAPPING:
 * - Refined → REFINED (orchestration status)
 * - Unchanged → UNCHANGED (orchestration status)
 * - InsufficientData → UNAVAILABLE (orchestration status, missing data)
 */
export class MechanismRefinerPortAdapter implements MechanismRefinerPort {
  /**
   * Refines a mechanism candidate using the real dispositor refiner.
   */
  refine(input: {
    readonly candidate: import('../careerMechanism/careerMechanismTypes').CareerMechanismCandidate;
    readonly dispositorContexts: readonly import('../careerMechanism/dispositor/careerMechanismDispositorTypes').CareerDispositorContext[];
    readonly coreParticipants?: readonly string[];
    readonly supportingParticipants?: readonly string[];
    readonly challengingParticipants?: readonly string[];
  }): import('../careerMechanism/dispositor/careerMechanismDispositorTypes').CareerMechanismDispositorRefinementResult {
    return defaultCareerMechanismDispositorRefiner.refine(input);
  }
}

/**
 * Default port adapters.
 * Exported for convenience when wiring the orchestrator.
 */
export const qualificationPortAdapter = Object.freeze(new QualificationPortAdapter());
export const participantRolesPortAdapter = Object.freeze(new ParticipantRolesPortAdapter());
export const mechanismResolverPortAdapter = Object.freeze(new MechanismResolverPortAdapter());
export const mechanismRefinerPortAdapter = Object.freeze(new MechanismRefinerPortAdapter());

/**
 * Default orchestration ports.
 * Pre-configured with all adapters for easy use.
 */
export const defaultCareerOrchestrationPorts = Object.freeze({
  qualification: qualificationPortAdapter,
  participantRoles: participantRolesPortAdapter,
  mechanismResolver: mechanismResolverPortAdapter,
  mechanismRefiner: mechanismRefinerPortAdapter
});
