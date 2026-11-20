import type { ProductCareerPatternQualification } from '../../product/analysis/productAnalysisTypes';

export type PatternQualificationReason =
  | {
      readonly category: 'FULLY_ASSESSED_WEAK_PARTICIPANT';
      readonly planet: ProductCareerPatternQualification['participants'][number]['planet'];
      readonly condition: 'WEAK' | 'AFFLICTED';
    }
  | { readonly category: 'NEUTRAL_CAREER_RELEVANCE' }
  | { readonly category: 'STRUCTURAL_EVIDENCE'; readonly explanation: string }
  | { readonly category: 'INSUFFICIENT_INPUTS' };

export function selectPatternQualificationReasons(
  pattern: ProductCareerPatternQualification
): readonly PatternQualificationReason[] {
  const reasons: PatternQualificationReason[] = [];

  if (pattern.status === 'UNQUALIFIED') {
    for (const participant of pattern.participants) {
      const condition = participant.sourceCondition ?? participant.condition;
      if (
        participant.conditionAssessment === 'FULL' &&
        (condition === 'WEAK' || condition === 'AFFLICTED')
      ) {
        reasons.push({
          category: 'FULLY_ASSESSED_WEAK_PARTICIPANT',
          planet: participant.planet,
          condition
        });
      }
    }

    if (pattern.dimensions?.careerRelevance === 'NEUTRAL') {
      reasons.push({ category: 'NEUTRAL_CAREER_RELEVANCE' });
    }

    for (const evidence of pattern.policyEvidence ?? []) {
      if (evidence.dimension === 'structuralStrength') {
        reasons.push({ category: 'STRUCTURAL_EVIDENCE', explanation: evidence.explanation });
      }
    }
  }

  if (pattern.status === 'INSUFFICIENT_DATA' && pattern.decisionBlockingReasons.length > 0) {
    reasons.push({ category: 'INSUFFICIENT_INPUTS' });
  }

  return reasons;
}
