import type { ProductCareerPatternQualification } from '../../product/analysis/productAnalysisTypes';

export type PatternQualificationReason =
  | {
      readonly category: 'FULLY_ASSESSED_WEAK_PARTICIPANT';
      readonly planet: ProductCareerPatternQualification['participants'][number]['planet'];
      readonly condition: 'WEAK' | 'AFFLICTED';
    }
  | { readonly category: 'NEUTRAL_CAREER_RELEVANCE' }
  | { readonly category: 'NO_ESTABLISHING_RELATIONSHIPS' }
  | { readonly category: 'INSUFFICIENT_INPUTS' };

export function selectPatternQualificationReasons(
  pattern: ProductCareerPatternQualification
): readonly PatternQualificationReason[] {
  const reasons: PatternQualificationReason[] = pattern.participants.flatMap(participant => {
    const condition = participant.sourceCondition ?? participant.condition;
    return participant.conditionAssessment === 'FULL' &&
      (condition === 'WEAK' || condition === 'AFFLICTED')
      ? [{ category: 'FULLY_ASSESSED_WEAK_PARTICIPANT', planet: participant.planet, condition }]
      : [];
  });

  if (pattern.dimensions?.careerRelevance === 'NEUTRAL') {
    reasons.push({ category: 'NEUTRAL_CAREER_RELEVANCE' });
  }
  if (pattern.policyEvidence?.some(
    evidence => evidence.dimension === 'structuralStrength' && evidence.relationshipIds.length === 0
  )) {
    reasons.push({ category: 'NO_ESTABLISHING_RELATIONSHIPS' });
  }
  if (pattern.status === 'INSUFFICIENT_DATA' && pattern.decisionBlockingReasons.length > 0) {
    reasons.push({ category: 'INSUFFICIENT_INPUTS' });
  }

  return reasons;
}
