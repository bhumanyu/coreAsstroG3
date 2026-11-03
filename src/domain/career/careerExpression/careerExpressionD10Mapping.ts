import type { CareerExpressionType } from './careerExpressionTypes';
import type { CareerManifestationMode } from '../careerTypes';

/**
 * Canonical C8 expression-type to legacy C10 manifestation-mode bridge.
 *
 * This mapping is shared by D10 qualification and profession candidate qualification.
 * Many-to-one mappings are intentional and remain MODE-granularity mappings.
 */
const C8_TO_C10_EXPRESSION_MAPPING: Readonly<Record<CareerExpressionType, CareerManifestationMode>> = Object.freeze({
  AUTHORITY_EXPRESSION: 'AUTHORITY',
  LEADERSHIP_EXPRESSION: 'LEADERSHIP',
  TEACHING_EXPRESSION: 'MANAGEMENT',
  RESEARCH_WORK: 'TECHNICAL_SPECIALIZATION',
  COMMUNICATION_WORK: 'INDEPENDENT_WORK',
  WRITING_WORK: 'INDEPENDENT_WORK',
  INNOVATION_WORK: 'TECHNICAL_SPECIALIZATION',
  SERVICE_WORK: 'SERVICE_EMPLOYMENT',
  ANALYTICAL_SPECIALIZED_WORK: 'TECHNICAL_SPECIALIZATION',
  FINANCIAL_WORK: 'ENTREPRENEURSHIP',
  INSURANCE_WORK: 'ENTREPRENEURSHIP',
  TAXATION_WORK: 'ENTREPRENEURSHIP',
  COMPLIANCE_WORK: 'SERVICE_EMPLOYMENT',
  CRISIS_MANAGEMENT_WORK: 'SERVICE_EMPLOYMENT',
  INSTITUTIONAL_WORK_EXPRESSION: 'PUBLIC_INSTITUTIONAL',
  ISOLATED_WORK_EXPRESSION: 'SERVICE_EMPLOYMENT',
  FOREIGN_WORK_EXPRESSION: 'INDEPENDENT_WORK',
  REMOTE_WORK_EXPRESSION: 'INDEPENDENT_WORK'
} as const);

export type CareerExpressionToD10ModeResolution =
  | { readonly status: 'RESOLVED'; readonly c10Mode: CareerManifestationMode }
  | { readonly status: 'UNMAPPED'; readonly diagnostic: string }
  | { readonly status: 'AMBIGUOUS'; readonly diagnostic: string };

/**
 * Resolve the legacy C10 mode for a canonical C8 expression type.
 * Legacy-only C10 modes are not reverse-inferred from unsupported C8 types.
 */
export function resolveCareerD10ModeFromExpressionType(
  expressionType: CareerExpressionType
): CareerExpressionToD10ModeResolution {
  const c10Mode = C8_TO_C10_EXPRESSION_MAPPING[expressionType];
  if (c10Mode) {
    return Object.freeze({ status: 'RESOLVED', c10Mode });
  }
  return Object.freeze({
    status: 'UNMAPPED',
    diagnostic: `C8 expression type "${expressionType}" has no C10 mapping entry`
  });
}
