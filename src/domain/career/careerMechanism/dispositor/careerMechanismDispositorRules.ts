import type {
  CareerMechanismDispositorRule,
  CareerMechanismDispositorRuleInput,
  CareerMechanismDispositorRuleResult
} from './careerMechanismDispositorTypes';
import type { CareerMechanismType } from '../careerMechanismTypes';
import { Planet } from '../../../../types';

/**
 * P2-07E Career Mechanism Dispositor Rules
 *
 * This module defines static rules for dispositor-based refinement of career mechanisms.
 * Rules are in deterministic order with no dynamic discovery.
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
 * P1 rules per spec §8–11:
 * - RESEARCH/INVESTIGATION refined by Mercury→SPECIALIZED_KNOWLEDGE or Saturn→TRANSFORMATION terminal
 * - TRANSFORMATION reinforced by Saturn/Mars/Ketu terminals
 * - BANKING_FINANCE/INSURANCE/TAXATION/COMPLIANCE refined via terminal (Mercury→COMMUNICATION, Jupiter→SPECIALIZED_KNOWLEDGE, Saturn→RISK)
 * - FOREIGN_WORK/REMOTE_WORK/INSTITUTIONAL_WORK/ISOLATED_ENVIRONMENT refined via terminal (Saturn/Ketu→ISOLATED_ENVIRONMENT, Mercury→REMOTE_WORK)
 *
 * Evidence via buildCareerMechanismEvidence with source: 'DISPOSITOR', role: 'REFINING' — never 'ESTABLISHING'.
 * Rules only refine an existing mechanismType; they never emit a mechanism for an absent candidate.
 */

/**
 * Rule: RESEARCH/INVESTIGATION → SPECIALIZED_KNOWLEDGE via Mercury terminal
 */
const ruleResearchToSpecializedKnowledge: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_RESEARCH_TO_SPECIALIZED_KNOWLEDGE',
  description: 'Refines RESEARCH or INVESTIGATION to SPECIALIZED_KNOWLEDGE when dispositor chain terminates at Mercury',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to RESEARCH or INVESTIGATION
    if (mechanismType !== 'RESEARCH' && mechanismType !== 'INVESTIGATION') {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Mercury (use terminalPlanetId if available, otherwise fallback to chain end)
    const terminalPlanet = context.terminalPlanetId ?? context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.MERCURY;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['SPECIALIZED_KNOWLEDGE' as CareerMechanismType]),
      explanation: `${mechanismType} refined to SPECIALIZED_KNOWLEDGE via Mercury terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: RESEARCH/INVESTIGATION → TRANSFORMATION via Saturn terminal
 */
const ruleResearchToTransformation: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_RESEARCH_TO_TRANSFORMATION',
  description: 'Refines RESEARCH or INVESTIGATION to TRANSFORMATION when dispositor chain terminates at Saturn',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to RESEARCH or INVESTIGATION
    if (mechanismType !== 'RESEARCH' && mechanismType !== 'INVESTIGATION') {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Saturn (use terminalPlanetId if available, otherwise fallback to chain end)
    const terminalPlanet = context.terminalPlanetId ?? context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.SATURN;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['TRANSFORMATION' as CareerMechanismType]),
      explanation: `${mechanismType} refined to TRANSFORMATION via Saturn terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: TRANSFORMATION reinforced by Saturn/Mars/Ketu terminals
 */
const ruleTransformationReinforcement: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_TRANSFORMATION_REINFORCEMENT',
  description: 'Reinforces TRANSFORMATION when dispositor chain terminates at Saturn, Mars, or Ketu',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to TRANSFORMATION
    if (mechanismType !== 'TRANSFORMATION') {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Saturn, Mars, or Ketu (use terminalPlanetId if available, otherwise fallback to chain end)
    const terminalPlanet = context.terminalPlanetId ?? context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.SATURN || terminalPlanet === Planet.MARS || terminalPlanet === Planet.KETU;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { context } = input;

    const terminalPlanet = context.chain[context.chain.length - 1];

    return Object.freeze({
      mechanismTypes: Object.freeze(['TRANSFORMATION' as CareerMechanismType]),
      explanation: `TRANSFORMATION reinforced via ${terminalPlanet} terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: BANKING_FINANCE/INSURANCE/TAXATION/COMPLIANCE → COMMUNICATION via Mercury terminal
 */
const ruleFinanceToCommunication: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_FINANCE_TO_COMMUNICATION',
  description: 'Refines BANKING_FINANCE, INSURANCE, TAXATION, or COMPLIANCE to COMMUNICATION when dispositor chain terminates at Mercury',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to finance-related mechanisms
    const financeMechanisms = ['BANKING_FINANCE', 'INSURANCE', 'TAXATION', 'COMPLIANCE'];
    if (!financeMechanisms.includes(mechanismType)) {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Mercury (use terminalPlanetId if available, otherwise fallback to chain end)
    const terminalPlanet = context.terminalPlanetId ?? context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.MERCURY;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['COMMUNICATION' as CareerMechanismType]),
      explanation: `${mechanismType} refined to COMMUNICATION via Mercury terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: BANKING_FINANCE/INSURANCE/TAXATION/COMPLIANCE → SPECIALIZED_KNOWLEDGE via Jupiter terminal
 */
const ruleFinanceToSpecializedKnowledge: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_FINANCE_TO_SPECIALIZED_KNOWLEDGE',
  description: 'Refines BANKING_FINANCE, INSURANCE, TAXATION, or COMPLIANCE to SPECIALIZED_KNOWLEDGE when dispositor chain terminates at Jupiter',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to finance-related mechanisms
    const financeMechanisms = ['BANKING_FINANCE', 'INSURANCE', 'TAXATION', 'COMPLIANCE'];
    if (!financeMechanisms.includes(mechanismType)) {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Jupiter
    const terminalPlanet = context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.JUPITER;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['SPECIALIZED_KNOWLEDGE' as CareerMechanismType]),
      explanation: `${mechanismType} refined to SPECIALIZED_KNOWLEDGE via Jupiter terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: BANKING_FINANCE/INSURANCE/TAXATION/COMPLIANCE → RISK via Saturn terminal
 */
const ruleFinanceToRisk: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_FINANCE_TO_RISK',
  description: 'Refines BANKING_FINANCE, INSURANCE, TAXATION, or COMPLIANCE to RISK when dispositor chain terminates at Saturn',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to finance-related mechanisms
    const financeMechanisms = ['BANKING_FINANCE', 'INSURANCE', 'TAXATION', 'COMPLIANCE'];
    if (!financeMechanisms.includes(mechanismType)) {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Saturn
    const terminalPlanet = context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.SATURN;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['RISK' as CareerMechanismType]),
      explanation: `${mechanismType} refined to RISK via Saturn terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: FOREIGN_WORK/REMOTE_WORK/INSTITUTIONAL_WORK/ISOLATED_ENVIRONMENT → ISOLATED_ENVIRONMENT via Saturn/Ketu terminal
 */
const ruleForeignToIsolated: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_FOREIGN_TO_ISOLATED',
  description: 'Refines FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, or ISOLATED_ENVIRONMENT to ISOLATED_ENVIRONMENT when dispositor chain terminates at Saturn or Ketu',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to foreign/institutional mechanisms
    const foreignMechanisms = ['FOREIGN_WORK', 'REMOTE_WORK', 'INSTITUTIONAL_WORK', 'ISOLATED_ENVIRONMENT'];
    if (!foreignMechanisms.includes(mechanismType)) {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Saturn or Ketu
    const terminalPlanet = context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.SATURN || terminalPlanet === Planet.KETU;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['ISOLATED_ENVIRONMENT' as CareerMechanismType]),
      explanation: `${mechanismType} refined to ISOLATED_ENVIRONMENT via ${context.chain[context.chain.length - 1]} terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Rule: FOREIGN_WORK/REMOTE_WORK/INSTITUTIONAL_WORK/ISOLATED_ENVIRONMENT → REMOTE_WORK via Mercury terminal
 */
const ruleForeignToRemote: CareerMechanismDispositorRule = Object.freeze({
  ruleId: 'RULE_DISPOSITOR_FOREIGN_TO_REMOTE',
  description: 'Refines FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, or ISOLATED_ENVIRONMENT to REMOTE_WORK when dispositor chain terminates at Mercury',

  applies(input: CareerMechanismDispositorRuleInput): boolean {
    const { mechanismType, context } = input;

    // Only applies to foreign/institutional mechanisms
    const foreignMechanisms = ['FOREIGN_WORK', 'REMOTE_WORK', 'INSTITUTIONAL_WORK', 'ISOLATED_ENVIRONMENT'];
    if (!foreignMechanisms.includes(mechanismType)) {
      return false;
    }

    // Requires sufficient data and a terminal planet
    if (!context.sufficientData || context.chain.length === 0) {
      return false;
    }

    // Terminal planet must be Mercury (use terminalPlanetId if available, otherwise fallback to chain end)
    const terminalPlanet = context.terminalPlanetId ?? context.chain[context.chain.length - 1];
    return terminalPlanet === Planet.MERCURY;
  },

  refine(input: CareerMechanismDispositorRuleInput): CareerMechanismDispositorRuleResult {
    const { mechanismType, context } = input;

    return Object.freeze({
      mechanismTypes: Object.freeze(['REMOTE_WORK' as CareerMechanismType]),
      explanation: `${mechanismType} refined to REMOTE_WORK via Mercury terminal dispositor chain`,
      evidence: Object.freeze(context.sourceEvidenceIds)
    });
  }
});

/**
 * Static registry of dispositor-based mechanism refinement rules.
 * Deterministic order, no dynamic discovery.
 */
export const CAREER_DISPOSITOR_MECHANISM_RULES: readonly CareerMechanismDispositorRule[] = Object.freeze([
  ruleResearchToSpecializedKnowledge,
  ruleResearchToTransformation,
  ruleTransformationReinforcement,
  ruleFinanceToCommunication,
  ruleFinanceToSpecializedKnowledge,
  ruleFinanceToRisk,
  ruleForeignToIsolated,
  ruleForeignToRemote
]);
