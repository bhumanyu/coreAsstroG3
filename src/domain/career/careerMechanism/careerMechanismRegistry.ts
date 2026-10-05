import type {
  CareerMechanismType,
  CareerMechanismDefinition,
  CareerMechanismFamily
} from './careerMechanismTypes';

/**
 * P2-07C Career Mechanism Registry
 *
 * This module provides the canonical registry of all career mechanism definitions.
 * Per spec §18: CareerMechanismRegistry interface and DefaultCareerMechanismRegistry.
 *
 * Registry ≠ resolver — this is a static lookup table for mechanism metadata,
 * not a mechanism resolution engine (that's P2-07D).
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 */

/**
 * Canonical mechanism definitions.
 * Per spec §18: hand-written definition for EVERY enum member (no generated descriptions).
 *
 * These are static metadata definitions only — they do NOT contain logic for
 * detecting or resolving mechanisms from astrological data.
 *
 * Each definition is individually frozen to ensure immutability.
 */
export const CAREER_MECHANISM_DEFINITIONS: Readonly<
  Record<CareerMechanismType, CareerMechanismDefinition>
> = Object.freeze({
  // Expression family
  AGENCY: Object.freeze({
    type: 'AGENCY',
    family: 'EXPRESSION',
    description: 'The capacity to act independently and make autonomous choices in career matters.'
  }),
  SELF_DIRECTION: Object.freeze({
    type: 'SELF_DIRECTION',
    family: 'EXPRESSION',
    description: 'The ability to guide one\'s own career path and make independent decisions.'
  }),
  INITIATIVE: Object.freeze({
    type: 'INITIATIVE',
    family: 'EXPRESSION',
    description: 'The tendency to take proactive action and start new projects or ventures.'
  }),
  VISIBILITY: Object.freeze({
    type: 'VISIBILITY',
    family: 'EXPRESSION',
    description: 'The degree to which one\'s work and contributions are recognized and seen by others.'
  }),
  STATUS: Object.freeze({
    type: 'STATUS',
    family: 'EXPRESSION',
    description: 'The level of social or professional standing and recognition in one\'s field.'
  }),
  AUTHORITY: Object.freeze({
    type: 'AUTHORITY',
    family: 'EXPRESSION',
    description: 'The legitimate power to make decisions and direct others in professional contexts.'
  }),
  LEADERSHIP: Object.freeze({
    type: 'LEADERSHIP',
    family: 'EXPRESSION',
    description: 'The capacity to guide, inspire, and coordinate the efforts of others toward shared goals.'
  }),
  STRATEGY: Object.freeze({
    type: 'STRATEGY',
    family: 'EXPRESSION',
    description: 'The ability to plan and execute long-term approaches to career advancement.'
  }),
  ADVISORY: Object.freeze({
    type: 'ADVISORY',
    family: 'EXPRESSION',
    description: 'The role of providing expert guidance and recommendations to others in professional matters.'
  }),
  TEACHING: Object.freeze({
    type: 'TEACHING',
    family: 'EXPRESSION',
    description: 'The activity of transmitting knowledge and skills to others through instruction.'
  }),
  INNOVATION: Object.freeze({
    type: 'INNOVATION',
    family: 'EXPRESSION',
    description: 'The creation and implementation of new ideas, methods, or approaches in one\'s work.'
  }),
  DECISION_MAKING: Object.freeze({
    type: 'DECISION_MAKING',
    family: 'EXPRESSION',
    description: 'The process of making important choices and judgments in professional contexts.'
  }),
  COMMUNICATION: Object.freeze({
    type: 'COMMUNICATION',
    family: 'EXPRESSION',
    description: 'The exchange of information and ideas with others in professional settings.'
  }),
  WRITING: Object.freeze({
    type: 'WRITING',
    family: 'EXPRESSION',
    description: 'The creation of written content for professional purposes, including documentation and publication.'
  }),
  PUBLIC_INTERFACE: Object.freeze({
    type: 'PUBLIC_INTERFACE',
    family: 'EXPRESSION',
    description: 'The aspect of work that involves presenting to or interacting with public audiences.'
  }),
  CLIENT_INTERACTION: Object.freeze({
    type: 'CLIENT_INTERACTION',
    family: 'EXPRESSION',
    description: 'Direct engagement with clients or customers to understand needs and deliver value.'
  }),
  CONTRACTUAL_INTERACTION: Object.freeze({
    type: 'CONTRACTUAL_INTERACTION',
    family: 'EXPRESSION',
    description: 'Work structured through formal agreements and contractual relationships.'
  }),
  PARTNERSHIP: Object.freeze({
    type: 'PARTNERSHIP',
    family: 'EXPRESSION',
    description: 'Collaborative professional relationships with shared responsibility and mutual benefit.'
  }),
  COMMERCIAL_INTERACTION: Object.freeze({
    type: 'COMMERCIAL_INTERACTION',
    family: 'EXPRESSION',
    description: 'Engagement in market-based transactions and commercial activities.'
  }),
  ENTREPRENEURIAL_EFFORT: Object.freeze({
    type: 'ENTREPRENEURIAL_EFFORT',
    family: 'EXPRESSION',
    description: 'The initiative to create and build new ventures or business opportunities.'
  }),

  // Execution family
  EXECUTION: Object.freeze({
    type: 'EXECUTION',
    family: 'EXECUTION',
    description: 'The practical implementation of plans and the completion of work tasks.'
  }),
  HANDS_ON_CAPABILITY: Object.freeze({
    type: 'HANDS_ON_CAPABILITY',
    family: 'EXECUTION',
    description: 'The ability to perform practical, tangible work requiring manual or technical skill.'
  }),
  COURAGE: Object.freeze({
    type: 'COURAGE',
    family: 'EXECUTION',
    description: 'The willingness to face challenges and take calculated risks in pursuit of career goals.'
  }),
  SELF_EFFORT: Object.freeze({
    type: 'SELF_EFFORT',
    family: 'EXECUTION',
    description: 'Personal exertion and initiative applied to achieve career objectives.'
  }),
  SKILL_DEVELOPMENT: Object.freeze({
    type: 'SKILL_DEVELOPMENT',
    family: 'EXECUTION',
    description: 'The ongoing process of acquiring and refining professional capabilities.'
  }),
  SERVICE_EMPLOYMENT: Object.freeze({
    type: 'SERVICE_EMPLOYMENT',
    family: 'EXECUTION',
    description: 'Work performed in service to others, typically within an employment relationship.'
  }),
  COMPETITION: Object.freeze({
    type: 'COMPETITION',
    family: 'EXECUTION',
    description: 'Engagement in competitive contexts where advancement requires outperforming others.'
  }),
  PROFESSIONALIZATION: Object.freeze({
    type: 'PROFESSIONALIZATION',
    family: 'EXECUTION',
    description: 'The process of establishing and maintaining professional standards and credentials.'
  }),
  PROFESSIONAL_GAINS: Object.freeze({
    type: 'PROFESSIONAL_GAINS',
    family: 'EXECUTION',
    description: 'The acquisition of financial rewards, recognition, or other benefits from professional work.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  CREATIVE_INTELLECTUAL: Object.freeze({
    type: 'CREATIVE_INTELLECTUAL',
    family: 'EXECUTION',
    description: 'Work that combines creative expression with intellectual analysis and insight.'
  }),
  DHARMA_DRIVEN_PROFESSION: Object.freeze({
    type: 'DHARMA_DRIVEN_PROFESSION',
    family: 'EXECUTION',
    description: 'Career work aligned with one\'s deeper purpose and dharma or righteous duty.'
  }),
  AUTHORITY_LEADERSHIP: Object.freeze({
    type: 'AUTHORITY_LEADERSHIP',
    family: 'EXECUTION',
    description: 'The combination of legitimate authority and leadership capacity in directing others.'
  }),
  STABILITY: Object.freeze({
    type: 'STABILITY',
    family: 'EXECUTION',
    description: 'The quality of having a consistent and reliable career foundation.'
  }),
  WORK_ENVIRONMENT: Object.freeze({
    type: 'WORK_ENVIRONMENT',
    family: 'EXECUTION',
    description: 'The physical and social context in which work is performed.'
  }),
  ADMINISTRATIVE_FOUNDATION: Object.freeze({
    type: 'ADMINISTRATIVE_FOUNDATION',
    family: 'EXECUTION',
    description: 'The structural and organizational systems that support work operations.'
  }),
  EXPENDITURE: Object.freeze({
    type: 'EXPENDITURE',
    family: 'EXECUTION',
    description: 'The use of resources, including financial and energetic investment, in career activities.'
  }),

  // Knowledge family
  INTELLIGENCE: Object.freeze({
    type: 'INTELLIGENCE',
    family: 'KNOWLEDGE',
    description: 'The capacity for understanding, learning, and applying complex information.'
  }),
  SPECIALIZED_KNOWLEDGE: Object.freeze({
    type: 'SPECIALIZED_KNOWLEDGE',
    family: 'KNOWLEDGE',
    description: 'Deep expertise in a specific domain or technical area.'
  }),
  RESEARCH: Object.freeze({
    type: 'RESEARCH',
    family: 'KNOWLEDGE',
    description: 'The systematic investigation and study of subjects to discover new information.'
  }),
  INVESTIGATION: Object.freeze({
    type: 'INVESTIGATION',
    family: 'KNOWLEDGE',
    description: 'The process of examining facts, situations, or problems to uncover the truth.'
  }),
  TRANSFORMATION: Object.freeze({
    type: 'TRANSFORMATION',
    family: 'KNOWLEDGE',
    description: 'Fundamental change in form, nature, or function, often involving deep personal or professional shifts.'
    // @review P2-07D: Also exists as a family label - deliberate classification or inconsistency to resolve?
  }),

  // Communication family (already defined in Expression, but included for completeness)
  // Note: Teaching, Communication, Writing, Public_Interface, Client_Interaction,
  // Contractual_Interaction, Partnership, Commercial_Interaction are shared with Expression

  // Business family
  BUSINESS: Object.freeze({
    type: 'BUSINESS',
    family: 'BUSINESS',
    description: 'Commercial or entrepreneurial activity focused on value creation and exchange.'
  }),
  CONSULTING: Object.freeze({
    type: 'CONSULTING',
    family: 'BUSINESS',
    description: 'Providing expert advice and solutions to clients in a professional capacity.'
  }),
  BANKING_FINANCE: Object.freeze({
    type: 'BANKING_FINANCE',
    family: 'BUSINESS',
    description: 'Work involving financial services, banking, money management, or capital allocation.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  INSURANCE: Object.freeze({
    type: 'INSURANCE',
    family: 'BUSINESS',
    description: 'The business of risk management through protection policies and financial safeguards.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  TAXATION: Object.freeze({
    type: 'TAXATION',
    family: 'BUSINESS',
    description: 'Work related to tax assessment, compliance, planning, or administration.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  COMPLIANCE: Object.freeze({
    type: 'COMPLIANCE',
    family: 'BUSINESS',
    description: 'Ensuring adherence to regulations, standards, and legal requirements in professional operations.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  RISK: Object.freeze({
    type: 'RISK',
    family: 'BUSINESS',
    description: 'The identification, assessment, and management of uncertainty and potential negative outcomes.'
    // @review P2-07D: Also appears in Transformation family - intentional overlap or dedup needed?
  }),
  CRISIS: Object.freeze({
    type: 'CRISIS',
    family: 'BUSINESS',
    description: 'Work involving emergency situations, urgent problems, or critical turning points.'
    // @review P2-07D: Also appears in Transformation family - intentional overlap or dedup needed?
  }),
  CRISIS_MANAGEMENT: Object.freeze({
    type: 'CRISIS_MANAGEMENT',
    family: 'BUSINESS',
    description: 'The strategic handling of crises to minimize damage and enable recovery.'
    // @review P2-07D: Also appears in Transformation family - intentional overlap or dedup needed?
  }),

  // Institutional family
  INSTITUTIONAL_BASE: Object.freeze({
    type: 'INSTITUTIONAL_BASE',
    family: 'INSTITUTIONAL',
    description: 'A foundation within established organizations, systems, or formal structures.'
  }),
  INSTITUTIONAL_SERVICE: Object.freeze({
    type: 'INSTITUTIONAL_SERVICE',
    family: 'INSTITUTIONAL',
    description: 'Work performed within or for established institutions and formal organizations.'
  }),
  INSTITUTIONAL_WORK: Object.freeze({
    type: 'INSTITUTIONAL_WORK',
    family: 'INSTITUTIONAL',
    description: 'Career activities embedded within institutional or organizational frameworks.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  ISOLATED_ENVIRONMENT: Object.freeze({
    type: 'ISOLATED_ENVIRONMENT',
    family: 'INSTITUTIONAL',
    description: 'Work performed in isolated environments with limited interaction with others.'
  }),

  // Transformation family (already defined in Knowledge, but included for completeness)
  // Note: Transformation, Research, Investigation, Risk, Crisis, Crisis_Management are shared

  // Foreign family
  FOREIGN: Object.freeze({
    type: 'FOREIGN',
    family: 'FOREIGN',
    description: 'Involvement with people, places, or systems outside one\'s native or usual context.'
  }),
  FOREIGN_WORK: Object.freeze({
    type: 'FOREIGN_WORK',
    family: 'FOREIGN',
    description: 'Career activity performed in foreign locations or involving cross-border operations.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  }),
  REMOTE_WORK: Object.freeze({
    type: 'REMOTE_WORK',
    family: 'FOREIGN',
    description: 'Work performed from a distance, outside the traditional office environment.'
    // @review P2-07D: Borderline-domain type - decide if mechanism, domain, or outcome
  })
});

/**
 * Career mechanism registry interface.
 * Per spec §18: provides lookup operations for mechanism definitions.
 */
export interface CareerMechanismRegistry {
  /**
   * Gets the definition for a mechanism type.
   * Throws if the mechanism type is unknown.
   */
  get(type: CareerMechanismType): CareerMechanismDefinition;

  /**
   * Checks if a mechanism type exists in the registry.
   */
  has(type: CareerMechanismType): boolean;

  /**
   * Returns all mechanism definitions as a frozen array.
   */
  all(): readonly CareerMechanismDefinition[];

  /**
   * Returns all mechanism types belonging to a specific family.
   */
  getByFamily(family: CareerMechanismFamily): readonly CareerMechanismDefinition[];
}

/**
 * Default career mechanism registry implementation.
 * Per spec §18: provides the canonical registry operations.
 */
export class DefaultCareerMechanismRegistry implements CareerMechanismRegistry {
  /**
   * Gets the definition for a mechanism type.
   * Throws if the mechanism type is unknown.
   */
  get(type: CareerMechanismType): CareerMechanismDefinition {
    const definition = CAREER_MECHANISM_DEFINITIONS[type];
    if (!definition) {
      throw new Error(`Unknown career mechanism type: ${type}`);
    }
    return definition;
  }

  /**
   * Checks if a mechanism type exists in the registry.
   */
  has(type: CareerMechanismType): boolean {
    return type in CAREER_MECHANISM_DEFINITIONS;
  }

  /**
   * Returns all mechanism definitions as a frozen array.
   */
  all(): readonly CareerMechanismDefinition[] {
    return Object.freeze(Object.values(CAREER_MECHANISM_DEFINITIONS));
  }

  /**
   * Returns all mechanism types belonging to a specific family.
   */
  getByFamily(family: CareerMechanismFamily): readonly CareerMechanismDefinition[] {
    return Object.values(CAREER_MECHANISM_DEFINITIONS).filter(
      (def) => def.family === family
    );
  }
}

/**
 * Default registry instance.
 * Exported for use across the Career domain.
 */
export const defaultCareerMechanismRegistry = Object.freeze(
  new DefaultCareerMechanismRegistry()
);
