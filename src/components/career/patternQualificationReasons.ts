import type { ProductCareerPatternQualification } from '../../product/analysis/productAnalysisTypes';

export type PatternQualificationReasonCategory =
  | 'NO_ESTABLISHING_RELATIONSHIPS'
  | 'REQUIRED_STRUCTURAL_RELATIONSHIP_MISSING'
  | 'FULLY_ASSESSED_WEAK_PARTICIPANT'
  | 'NEUTRAL_CAREER_RELEVANCE'
  | 'MISSING_INPUT'
  | 'METHODOLOGY_NOT_FROZEN'
  | 'INSUFFICIENT_STRUCTURAL_EVIDENCE'
  | 'INSUFFICIENT_INPUTS'
  | 'STRUCTURAL_EVIDENCE'
  | 'UNKNOWN';

export interface PatternQualificationReason {
  readonly category: PatternQualificationReasonCategory;
  readonly role: 'DECISIVE' | 'CONTRIBUTING';
  readonly detail?: string;
  readonly condition?: 'WEAK' | 'AFFLICTED';
}

const categoryByDecisionCode: Readonly<Record<string, PatternQualificationReasonCategory>> = {
  NO_ESTABLISHING_RELATIONSHIPS: 'NO_ESTABLISHING_RELATIONSHIPS',
  REQUIRED_STRUCTURAL_RELATIONSHIP_MISSING: 'REQUIRED_STRUCTURAL_RELATIONSHIP_MISSING',
  FULLY_ASSESSED_WEAK_PARTICIPANT: 'FULLY_ASSESSED_WEAK_PARTICIPANT',
  NEUTRAL_CAREER_RELEVANCE: 'NEUTRAL_CAREER_RELEVANCE',
  MISSING_INPUT: 'MISSING_INPUT',
  METHODOLOGY_NOT_FROZEN: 'METHODOLOGY_NOT_FROZEN',
  INSUFFICIENT_STRUCTURAL_EVIDENCE: 'INSUFFICIENT_STRUCTURAL_EVIDENCE',
  INSUFFICIENT_INPUTS: 'INSUFFICIENT_INPUTS'
};

function deduplicateReasons(reasons: readonly PatternQualificationReason[]): readonly PatternQualificationReason[] {
  const seen = new Set<string>();
  return reasons.filter(reason => {
    const key = JSON.stringify([reason.category, reason.detail]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function selectPatternQualificationReasons(
  pattern: ProductCareerPatternQualification
): readonly PatternQualificationReason[] {
  if (pattern.decisionReasonCodes !== undefined) {
    const seen = new Set<string>();
    return pattern.decisionReasonCodes.flatMap(reason => {
      const key = JSON.stringify([reason.code, reason.detail]);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        category: categoryByDecisionCode[reason.code] ?? 'UNKNOWN',
        role: reason.role,
        detail: reason.detail
      }];
    });
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
          category: 'FULLY_ASSESSED_WEAK_PARTICIPANT',
          role: 'DECISIVE',
          detail: participant.planet,
          condition
        });
      }
    }

    if (pattern.dimensions?.careerRelevance === 'NEUTRAL') {
      reasons.push({ category: 'NEUTRAL_CAREER_RELEVANCE', role: 'DECISIVE' });
    }

    for (const evidence of pattern.policyEvidence ?? []) {
      if (evidence.dimension === 'structuralStrength' && evidence.disposition === 'ADVERSE') {
        reasons.push({
          category: 'STRUCTURAL_EVIDENCE',
          role: 'DECISIVE',
          detail: evidence.explanation
        });
      }
    }
  }

  if (pattern.status === 'INSUFFICIENT_DATA' && pattern.decisionBlockingReasons.length > 0) {
    reasons.push({ category: 'INSUFFICIENT_INPUTS', role: 'DECISIVE' });
  }

  return deduplicateReasons(reasons);
}
