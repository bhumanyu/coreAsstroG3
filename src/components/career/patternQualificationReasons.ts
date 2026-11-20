import type { ProductCareerPatternQualification } from '../../product/analysis/productAnalysisTypes';

export interface PatternQualificationReason {
  readonly code: string;
  readonly role: 'DECISIVE' | 'CONTRIBUTING';
  readonly detail?: string;
  readonly condition?: 'WEAK' | 'AFFLICTED';
}

export function selectPatternQualificationReasons(
  pattern: ProductCareerPatternQualification
): readonly PatternQualificationReason[] {
  if (pattern.decisionReasonCodes !== undefined) {
    return pattern.decisionReasonCodes.map(reason => ({ ...reason }));
  }

  const reasons: PatternQualificationReason[] = [];

  if (pattern.status === 'UNQUALIFIED') {
    for (const participant of pattern.participants) {
      const condition = participant.sourceCondition ?? participant.condition;
      if (
        participant.conditionAssessment === 'FULL' &&
        (condition === 'WEAK' || condition === 'AFFLICTED')
      ) {
        reasons.push({
          code: 'FULLY_ASSESSED_WEAK_PARTICIPANT',
          role: 'DECISIVE',
          detail: participant.planet,
          condition
        });
      }
    }

    if (pattern.dimensions?.careerRelevance === 'NEUTRAL') {
      reasons.push({ code: 'NEUTRAL_CAREER_RELEVANCE', role: 'DECISIVE' });
    }

    for (const evidence of pattern.policyEvidence ?? []) {
      if (evidence.dimension === 'structuralStrength' && evidence.disposition === 'ADVERSE') {
        reasons.push({
          code: 'STRUCTURAL_EVIDENCE',
          role: 'DECISIVE',
          detail: evidence.explanation
        });
      }
    }
  }

  if (pattern.status === 'INSUFFICIENT_DATA' && pattern.decisionBlockingReasons.length > 0) {
    reasons.push({ code: 'INSUFFICIENT_INPUTS', role: 'DECISIVE' });
  }

  return reasons;
}
