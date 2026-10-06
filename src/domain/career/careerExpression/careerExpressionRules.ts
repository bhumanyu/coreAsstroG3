import type { CareerMechanismType } from '../careerMechanism';
import type { CareerExpressionType } from './careerExpressionTypes';

/**
 * P2-08A Career Expression Rules
 *
 * This module defines the rules that map career mechanism types to career expression types.
 * Per spec §23: primary 1:1 mappings and a small, explicit composite list only where justified.
 *
 * Rules are frozen descriptors that specify:
 * - ruleId: Unique identifier for the rule
 * - mechanismTypes: The mechanism types that trigger this rule
 * - expressionType: The expression type produced by this rule
 * - requiredContext: Optional context requirements (e.g., composite rules require multiple mechanisms)
 * - precedence: Rule precedence for conflict resolution (higher = higher priority)
 *
 * PRIMARY 1:1 MAPPINGS:
 * Most mechanism types map 1:1 to expression types with a naming convention:
 * - EXPRESSION family mechanism → EXPRESSION expression
 * - EXECUTION family mechanism → WORK expression
 * - KNOWLEDGE family mechanism → KNOWLEDGE expression
 * - BUSINESS family mechanism → BUSINESS expression
 * - INSTITUTIONAL family mechanism → INSTITUTIONAL expression
 * - FOREIGN family mechanism → FOREIGN expression
 *
 * COMPOSITE RULES:
 * Only justified composites are included. The exemplar from spec §23:
 * - RESEARCH + SPECIALIZED_KNOWLEDGE → ANALYTICAL_SPECIALIZED_WORK
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 * - legacy careerExpression.ts
 */

/**
 * Career expression rule descriptor.
 * Per spec §23: rule descriptor for mechanism→expression mapping.
 */
export interface CareerExpressionRule {
  readonly ruleId: string;
  readonly mechanismTypes: readonly CareerMechanismType[];
  readonly expressionType: CareerExpressionType;
  readonly requiredContext?: {
    readonly composite?: boolean; // True if this rule requires multiple mechanism types
    readonly minMechanismCount?: number; // Minimum number of mechanisms required
  };
  readonly precedence: number; // Higher = higher priority
}

/**
 * Rule: RESEARCH → RESEARCH_WORK
 * Primary 1:1 mapping from KNOWLEDGE family to WORK family.
 */
const RULE_EXPRESSION_RESEARCH: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_RESEARCH',
  mechanismTypes: Object.freeze(['RESEARCH' as CareerMechanismType]),
  expressionType: 'RESEARCH_WORK',
  precedence: 100
});

/**
 * Rule: COMMUNICATION → COMMUNICATION_WORK
 * Primary 1:1 mapping from EXPRESSION family to WORK family.
 */
const RULE_EXPRESSION_COMMUNICATION: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_COMMUNICATION',
  mechanismTypes: Object.freeze(['COMMUNICATION' as CareerMechanismType]),
  expressionType: 'COMMUNICATION_WORK',
  precedence: 100
});

/**
 * Rule: AUTHORITY → AUTHORITY_EXPRESSION
 * Primary 1:1 mapping within EXPRESSION family.
 */
const RULE_EXPRESSION_AUTHORITY: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_AUTHORITY',
  mechanismTypes: Object.freeze(['AUTHORITY' as CareerMechanismType]),
  expressionType: 'AUTHORITY_EXPRESSION',
  precedence: 100
});

/**
 * Rule: LEADERSHIP → LEADERSHIP_EXPRESSION
 * Primary 1:1 mapping within EXPRESSION family.
 */
const RULE_EXPRESSION_LEADERSHIP: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_LEADERSHIP',
  mechanismTypes: Object.freeze(['LEADERSHIP' as CareerMechanismType]),
  expressionType: 'LEADERSHIP_EXPRESSION',
  precedence: 100
});

/**
 * Rule: TEACHING → TEACHING_EXPRESSION
 * Primary 1:1 mapping within EXPRESSION family.
 */
const RULE_EXPRESSION_TEACHING: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_TEACHING',
  mechanismTypes: Object.freeze(['TEACHING' as CareerMechanismType]),
  expressionType: 'TEACHING_EXPRESSION',
  precedence: 100
});

/**
 * Rule: WRITING → WRITING_WORK
 * Primary 1:1 mapping from EXPRESSION family to WORK family.
 */
const RULE_EXPRESSION_WRITING: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_WRITING',
  mechanismTypes: Object.freeze(['WRITING' as CareerMechanismType]),
  expressionType: 'WRITING_WORK',
  precedence: 100
});

/**
 * Rule: INNOVATION → INNOVATION_WORK
 * Primary 1:1 mapping from EXPRESSION family to WORK family.
 */
const RULE_EXPRESSION_INNOVATION: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_INNOVATION',
  mechanismTypes: Object.freeze(['INNOVATION' as CareerMechanismType]),
  expressionType: 'INNOVATION_WORK',
  precedence: 100
});

/**
 * Rule: SERVICE_EMPLOYMENT → SERVICE_WORK
 * Primary 1:1 mapping from EXECUTION family to WORK family.
 */
const RULE_EXPRESSION_SERVICE_EMPLOYMENT: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_SERVICE_EMPLOYMENT',
  mechanismTypes: Object.freeze(['SERVICE_EMPLOYMENT' as CareerMechanismType]),
  expressionType: 'SERVICE_WORK',
  precedence: 100
});

/**
 * Rule: FOREIGN_WORK → FOREIGN_WORK_EXPRESSION
 * Primary 1:1 mapping within FOREIGN family.
 */
const RULE_EXPRESSION_FOREIGN_WORK: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_FOREIGN_WORK',
  mechanismTypes: Object.freeze(['FOREIGN_WORK' as CareerMechanismType]),
  expressionType: 'FOREIGN_WORK_EXPRESSION',
  precedence: 100
});

/**
 * Rule: INSTITUTIONAL_WORK → INSTITUTIONAL_WORK_EXPRESSION
 * Primary 1:1 mapping within INSTITUTIONAL family.
 */
const RULE_EXPRESSION_INSTITUTIONAL_WORK: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_INSTITUTIONAL_WORK',
  mechanismTypes: Object.freeze(['INSTITUTIONAL_WORK' as CareerMechanismType]),
  expressionType: 'INSTITUTIONAL_WORK_EXPRESSION',
  precedence: 100
});

/**
 * Rule: ISOLATED_ENVIRONMENT → ISOLATED_WORK_EXPRESSION
 * Primary 1:1 mapping within INSTITUTIONAL family.
 */
const RULE_EXPRESSION_ISOLATED_ENVIRONMENT: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_ISOLATED_ENVIRONMENT',
  mechanismTypes: Object.freeze(['ISOLATED_ENVIRONMENT' as CareerMechanismType]),
  expressionType: 'ISOLATED_WORK_EXPRESSION',
  precedence: 100
});

/**
 * Rule: BANKING_FINANCE → FINANCIAL_WORK
 * Primary 1:1 mapping from BUSINESS family to WORK family.
 */
const RULE_EXPRESSION_BANKING_FINANCE: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_BANKING_FINANCE',
  mechanismTypes: Object.freeze(['BANKING_FINANCE' as CareerMechanismType]),
  expressionType: 'FINANCIAL_WORK',
  precedence: 100
});

/**
 * Rule: INSURANCE → INSURANCE_WORK
 * Primary 1:1 mapping from BUSINESS family to WORK family.
 */
const RULE_EXPRESSION_INSURANCE: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_INSURANCE',
  mechanismTypes: Object.freeze(['INSURANCE' as CareerMechanismType]),
  expressionType: 'INSURANCE_WORK',
  precedence: 100
});

/**
 * Rule: TAXATION → TAXATION_WORK
 * Primary 1:1 mapping from BUSINESS family to WORK family.
 */
const RULE_EXPRESSION_TAXATION: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_TAXATION',
  mechanismTypes: Object.freeze(['TAXATION' as CareerMechanismType]),
  expressionType: 'TAXATION_WORK',
  precedence: 100
});

/**
 * Rule: COMPLIANCE → COMPLIANCE_WORK
 * Primary 1:1 mapping from BUSINESS family to WORK family.
 */
const RULE_EXPRESSION_COMPLIANCE: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_COMPLIANCE',
  mechanismTypes: Object.freeze(['COMPLIANCE' as CareerMechanismType]),
  expressionType: 'COMPLIANCE_WORK',
  precedence: 100
});

/**
 * Rule: CRISIS_MANAGEMENT → CRISIS_MANAGEMENT_WORK
 * Primary 1:1 mapping from BUSINESS family to WORK family.
 */
const RULE_EXPRESSION_CRISIS_MANAGEMENT: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_CRISIS_MANAGEMENT',
  mechanismTypes: Object.freeze(['CRISIS_MANAGEMENT' as CareerMechanismType]),
  expressionType: 'CRISIS_MANAGEMENT_WORK',
  precedence: 100
});

/**
 * Rule: REMOTE_WORK → REMOTE_WORK_EXPRESSION
 * Primary 1:1 mapping within FOREIGN family.
 */
const RULE_EXPRESSION_REMOTE_WORK: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_REMOTE_WORK',
  mechanismTypes: Object.freeze(['REMOTE_WORK' as CareerMechanismType]),
  expressionType: 'REMOTE_WORK_EXPRESSION',
  precedence: 100
});

/**
 * Rule: RESEARCH + SPECIALIZED_KNOWLEDGE → ANALYTICAL_SPECIALIZED_WORK
 * Composite rule from spec §23.
 * Requires both RESEARCH and SPECIALIZED_KNOWLEDGE mechanism types.
 * Higher precedence (200) to take priority over individual RESEARCH mapping.
 */
const RULE_EXPRESSION_ANALYTICAL_SPECIALIZED: CareerExpressionRule = Object.freeze({
  ruleId: 'RULE_EXPRESSION_ANALYTICAL_SPECIALIZED',
  mechanismTypes: Object.freeze(['RESEARCH' as CareerMechanismType, 'SPECIALIZED_KNOWLEDGE' as CareerMechanismType]),
  expressionType: 'ANALYTICAL_SPECIALIZED_WORK',
  requiredContext: Object.freeze({
    composite: true,
    minMechanismCount: 2
  }),
  precedence: 200
});

/**
 * Frozen registry of career expression rules.
 * Per spec §23: primary 1:1 mappings and explicit composite rules only.
 *
 * Rules are ordered by precedence (highest first) for deterministic matching.
 */
export const CAREER_EXPRESSION_RULES: Readonly<
  ReadonlyArray<CareerExpressionRule>
> = Object.freeze([
  // Composite rules (higher precedence)
  RULE_EXPRESSION_ANALYTICAL_SPECIALIZED,
  // Primary 1:1 mappings (standard precedence)
  RULE_EXPRESSION_RESEARCH,
  RULE_EXPRESSION_COMMUNICATION,
  RULE_EXPRESSION_AUTHORITY,
  RULE_EXPRESSION_LEADERSHIP,
  RULE_EXPRESSION_TEACHING,
  RULE_EXPRESSION_WRITING,
  RULE_EXPRESSION_INNOVATION,
  RULE_EXPRESSION_SERVICE_EMPLOYMENT,
  RULE_EXPRESSION_FOREIGN_WORK,
  RULE_EXPRESSION_INSTITUTIONAL_WORK,
  RULE_EXPRESSION_ISOLATED_ENVIRONMENT,
  RULE_EXPRESSION_BANKING_FINANCE,
  RULE_EXPRESSION_INSURANCE,
  RULE_EXPRESSION_TAXATION,
  RULE_EXPRESSION_COMPLIANCE,
  RULE_EXPRESSION_CRISIS_MANAGEMENT,
  RULE_EXPRESSION_REMOTE_WORK
]);
