import type { CareerExpressionType } from '../careerExpression/careerExpressionTypes';
import type { CareerMechanismType } from '../careerMechanism/careerMechanismTypes';
import type {
  CareerProfessionDomain,
  CareerProfessionFamily,
  CareerProfessionBasis
} from './careerProfessionTypes';

/**
 * P2-10A Career Profession Rules
 *
 * This module defines the rules that map career expression types and mechanism types
 * to profession domains and families. Per spec §4: rules are frozen descriptors that
 * specify the conditions for emitting profession candidates.
 *
 * Rules are frozen descriptors that specify:
 * - ruleId: Unique identifier for the rule
 * - domain: The profession domain produced by this rule
 * - family: The profession family produced by this rule
 * - basis: What establishes this candidate (EXPRESSION, MECHANISM, etc.)
 * - requiredExpressionTypes: Expression types that trigger this rule (optional)
 * - requiredMechanismTypes: Mechanism types that trigger this rule (optional)
 * - precedence: Rule precedence for conflict resolution (higher = higher priority)
 *
 * RULE SEMANTICS:
 * - At least one of requiredExpressionTypes or requiredMechanismTypes must be specified.
 * - If both are specified, ALL must be present for the rule to match (AND semantics).
 * - Composite rules with multiple mechanism types require ALL to be present (every check).
 * - STRONG source-linkage contract for mechanism composites: required mechanisms must be
 *   referenced together by at least one expression in the pattern, indicating they share
 *   a deterministic source relationship (e.g., participate in a common qualifying expression).
 *   Mechanisms that merely co-occur in the same pattern without shared linkage are rejected.
 * - Rules never map a planet directly to a job title.
 * - Rules never let D10/Dasha/timing create candidates.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 */

/**
 * Career profession rule descriptor.
 * Per spec §4: rule descriptor for expression/mechanism → profession mapping.
 */
export interface CareerProfessionRule {
  readonly ruleId: string;
  readonly domain: CareerProfessionDomain;
  readonly family: CareerProfessionFamily;
  readonly basis: CareerProfessionBasis;
  readonly requiredExpressionTypes?: readonly CareerExpressionType[];
  readonly requiredMechanismTypes?: readonly CareerMechanismType[];
  readonly precedence: number;
}

/**
 * Rule: AUTHORITY_EXPRESSION → LEADERSHIP / EXECUTIVE_MANAGEMENT
 * Authority expression maps to leadership domain with executive management family.
 */
const RULE_PROFESSION_AUTHORITY: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_AUTHORITY',
  domain: 'LEADERSHIP',
  family: 'EXECUTIVE_MANAGEMENT',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['AUTHORITY_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: LEADERSHIP_EXPRESSION → LEADERSHIP / EXECUTIVE_MANAGEMENT
 * Leadership expression maps to leadership domain with executive management family.
 */
const RULE_PROFESSION_LEADERSHIP: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_LEADERSHIP',
  domain: 'LEADERSHIP',
  family: 'EXECUTIVE_MANAGEMENT',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['LEADERSHIP_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: TEACHING_EXPRESSION → EDUCATION / ACADEMIC_TEACHING
 * Teaching expression maps to education domain with academic teaching family.
 */
const RULE_PROFESSION_TEACHING: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_TEACHING',
  domain: 'EDUCATION',
  family: 'ACADEMIC_TEACHING',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['TEACHING_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: RESEARCH_WORK → RESEARCH / ANALYTICAL_RESEARCH
 * Research work maps to research domain with analytical research family.
 */
const RULE_PROFESSION_RESEARCH: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_RESEARCH',
  domain: 'RESEARCH',
  family: 'ANALYTICAL_RESEARCH',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['RESEARCH_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: COMMUNICATION_WORK → COMMUNICATION / MEDIA_COMMUNICATION
 * Communication work maps to communication domain with media communication family.
 */
const RULE_PROFESSION_COMMUNICATION: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_COMMUNICATION',
  domain: 'COMMUNICATION',
  family: 'MEDIA_COMMUNICATION',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['COMMUNICATION_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: WRITING_WORK → COMMUNICATION / MEDIA_COMMUNICATION
 * Writing work maps to communication domain with media communication family.
 */
const RULE_PROFESSION_WRITING: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_WRITING',
  domain: 'COMMUNICATION',
  family: 'MEDIA_COMMUNICATION',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['WRITING_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: INNOVATION_WORK → TECHNOLOGY / TECHNICAL_LEADERSHIP
 * Innovation work maps to technology domain with technical leadership family.
 */
const RULE_PROFESSION_INNOVATION: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_INNOVATION',
  domain: 'TECHNOLOGY',
  family: 'TECHNICAL_LEADERSHIP',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['INNOVATION_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: SERVICE_WORK → SERVICE / PUBLIC_SERVICE
 * Service work maps to service domain with public service family.
 */
const RULE_PROFESSION_SERVICE: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_SERVICE',
  domain: 'SERVICE',
  family: 'PUBLIC_SERVICE',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['SERVICE_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: FINANCIAL_WORK → FINANCE / FINANCIAL_SERVICES
 * Financial work maps to finance domain with financial services family.
 */
const RULE_PROFESSION_FINANCIAL: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_FINANCIAL',
  domain: 'FINANCE',
  family: 'FINANCIAL_SERVICES',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['FINANCIAL_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: INSURANCE_WORK → FINANCE / FINANCIAL_SERVICES
 * Insurance work maps to finance domain with financial services family.
 */
const RULE_PROFESSION_INSURANCE: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_INSURANCE',
  domain: 'FINANCE',
  family: 'FINANCIAL_SERVICES',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['INSURANCE_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: TAXATION_WORK → FINANCE / FINANCIAL_SERVICES
 * Taxation work maps to finance domain with financial services family.
 */
const RULE_PROFESSION_TAXATION: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_TAXATION',
  domain: 'FINANCE',
  family: 'FINANCIAL_SERVICES',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['TAXATION_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: COMPLIANCE_WORK → FINANCE / FINANCIAL_SERVICES
 * Compliance work maps to finance domain with financial services family.
 */
const RULE_PROFESSION_COMPLIANCE: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_COMPLIANCE',
  domain: 'FINANCE',
  family: 'FINANCIAL_SERVICES',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['COMPLIANCE_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: CRISIS_MANAGEMENT_WORK → SERVICE / PUBLIC_SERVICE
 * Crisis management work maps to service domain with public service family.
 */
const RULE_PROFESSION_CRISIS_MANAGEMENT: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_CRISIS_MANAGEMENT',
  domain: 'SERVICE',
  family: 'PUBLIC_SERVICE',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['CRISIS_MANAGEMENT_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: INSTITUTIONAL_WORK_EXPRESSION → INSTITUTIONAL / GOVERNMENT_ADMINISTRATION
 * Institutional work expression maps to institutional domain with government administration family.
 */
const RULE_PROFESSION_INSTITUTIONAL: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_INSTITUTIONAL',
  domain: 'INSTITUTIONAL',
  family: 'GOVERNMENT_ADMINISTRATION',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['INSTITUTIONAL_WORK_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: ISOLATED_WORK_EXPRESSION → INSTITUTIONAL / GOVERNMENT_ADMINISTRATION
 * Isolated work expression maps to institutional domain with government administration family.
 */
const RULE_PROFESSION_ISOLATED: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_ISOLATED',
  domain: 'INSTITUTIONAL',
  family: 'GOVERNMENT_ADMINISTRATION',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['ISOLATED_WORK_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: FOREIGN_WORK_EXPRESSION → FOREIGN / INTERNATIONAL_BUSINESS
 * Foreign work expression maps to foreign domain with international business family.
 */
const RULE_PROFESSION_FOREIGN: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_FOREIGN',
  domain: 'FOREIGN',
  family: 'INTERNATIONAL_BUSINESS',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['FOREIGN_WORK_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: REMOTE_WORK_EXPRESSION → REMOTE / DISTRIBUTED_TEAMWORK
 * Remote work expression maps to remote domain with distributed teamwork family.
 */
const RULE_PROFESSION_REMOTE: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_REMOTE',
  domain: 'REMOTE',
  family: 'DISTRIBUTED_TEAMWORK',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['REMOTE_WORK_EXPRESSION' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: ANALYTICAL_SPECIALIZED_WORK → RESEARCH / ANALYTICAL_RESEARCH
 * Analytical specialized work maps to research domain with analytical research family.
 */
const RULE_PROFESSION_ANALYTICAL_SPECIALIZED: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_ANALYTICAL_SPECIALIZED',
  domain: 'RESEARCH',
  family: 'ANALYTICAL_RESEARCH',
  basis: 'EXPRESSION',
  requiredExpressionTypes: Object.freeze(['ANALYTICAL_SPECIALIZED_WORK' as const satisfies CareerExpressionType]),
  precedence: 100
});

/**
 * Rule: INNOVATION + AUTHORITY → TECHNOLOGY / TECHNICAL_LEADERSHIP
 * Composite rule requiring both INNOVATION and AUTHORITY mechanism types.
 * Higher precedence (200) to take priority over individual mappings.
 */
const RULE_PROFESSION_TECHNICAL_LEADERSHIP: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_TECHNICAL_LEADERSHIP',
  domain: 'TECHNOLOGY',
  family: 'TECHNICAL_LEADERSHIP',
  basis: 'MECHANISM',
  requiredMechanismTypes: Object.freeze([
    'INNOVATION' as const satisfies CareerMechanismType,
    'AUTHORITY' as const satisfies CareerMechanismType
  ]),
  precedence: 200
});

/**
 * Rule: RESEARCH + SPECIALIZED_KNOWLEDGE → RESEARCH / ANALYTICAL_RESEARCH
 * Composite rule requiring both RESEARCH and SPECIALIZED_KNOWLEDGE mechanism types.
 * Higher precedence (200) to take priority over individual mappings.
 */
const RULE_PROFESSION_ANALYTICAL_RESEARCH: CareerProfessionRule = Object.freeze({
  ruleId: 'RULE_PROFESSION_ANALYTICAL_RESEARCH',
  domain: 'RESEARCH',
  family: 'ANALYTICAL_RESEARCH',
  basis: 'MECHANISM',
  requiredMechanismTypes: Object.freeze([
    'RESEARCH' as const satisfies CareerMechanismType,
    'SPECIALIZED_KNOWLEDGE' as const satisfies CareerMechanismType
  ]),
  precedence: 200
});

/**
 * Frozen registry of career profession rules.
 * Per spec §4: frozen registry of expression/mechanism → profession mappings.
 *
 * Rules are ordered by precedence (highest first) for deterministic matching.
 * Composite rules (higher precedence) are evaluated before primary mappings.
 */
export const CAREER_PROFESSION_RULES: Readonly<
  ReadonlyArray<CareerProfessionRule>
> = Object.freeze([
  // Composite rules (higher precedence)
  RULE_PROFESSION_TECHNICAL_LEADERSHIP,
  RULE_PROFESSION_ANALYTICAL_RESEARCH,
  // Primary expression mappings (standard precedence)
  RULE_PROFESSION_AUTHORITY,
  RULE_PROFESSION_LEADERSHIP,
  RULE_PROFESSION_TEACHING,
  RULE_PROFESSION_RESEARCH,
  RULE_PROFESSION_COMMUNICATION,
  RULE_PROFESSION_WRITING,
  RULE_PROFESSION_INNOVATION,
  RULE_PROFESSION_SERVICE,
  RULE_PROFESSION_FINANCIAL,
  RULE_PROFESSION_INSURANCE,
  RULE_PROFESSION_TAXATION,
  RULE_PROFESSION_COMPLIANCE,
  RULE_PROFESSION_CRISIS_MANAGEMENT,
  RULE_PROFESSION_INSTITUTIONAL,
  RULE_PROFESSION_ISOLATED,
  RULE_PROFESSION_FOREIGN,
  RULE_PROFESSION_REMOTE,
  RULE_PROFESSION_ANALYTICAL_SPECIALIZED
]);
