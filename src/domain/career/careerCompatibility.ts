import type { Horoscope } from '../../types';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import type {
  DomainEvidence,
  VargaRelationship
} from '../interpretation';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import {
  buildCareerStructuralReasoning,
  type CareerStructuralReasoning
} from './careerStructuralReasoningIntegration';
import { buildCareerEvidence } from './careerEvidenceMapper';
import { linkCareerEvidence } from './careerEvidenceLinker';

/**
 * Compatibility-only adapter. Canonical Career reasoning must use canonical D10 inputs and
 * must not pass theme evidence or legacy status through this helper.
 */
export function evaluateD10Relationship(
  rawEvidence?: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[],
  legacyStatus?: string,
  d10Evidence?: readonly DomainEvidence[],
  natalPromiseEvidenceIds?: readonly string[]
): VargaRelationship {
  if (d10Evidence && d10Evidence.length === 0 && (!rawEvidence || rawEvidence.length === 0)) {
    return 'UNAVAILABLE';
  }

  if (d10Evidence && d10Evidence.length > 0) {
    const linkedD10 =
      natalPromiseEvidenceIds && natalPromiseEvidenceIds.length > 0
        ? d10Evidence.filter((evidence) =>
            (evidence.relatedEvidenceIds ?? []).some((id) => natalPromiseEvidenceIds.includes(id))
          )
        : d10Evidence;

    if (linkedD10.length > 0) {
      const hasSupport = linkedD10.some((evidence) => evidence.polarity === 'SUPPORTING');
      const hasChallenge = linkedD10.some((evidence) => evidence.polarity === 'CHALLENGING');
      if (hasSupport && !hasChallenge) return 'CONFIRMS';
      if (hasSupport && hasChallenge) return 'MODIFIES';
      if (hasChallenge && !hasSupport) return 'CONFLICTS';
    }
  }

  const d10Item = rawEvidence?.find(
    (evidence) =>
      evidence.evidenceFamily === CareerEvidenceFamily.D10 ||
      evidence.vargaEvidence?.varga === 'D10'
  );
  if (d10Item?.vargaEvidence?.relationship) {
    return d10Item.vargaEvidence.relationship as VargaRelationship;
  }
  if (legacyStatus === 'CONFIRMED' || legacyStatus === 'CONFIRMS') return 'CONFIRMS';
  if (legacyStatus === 'CONFLICTED' || legacyStatus === 'CONFLICTS') return 'CONFLICTS';
  if (legacyStatus === 'NOT_APPLICABLE' || legacyStatus === 'UNAVAILABLE') return 'UNAVAILABLE';

  if (d10Item?.effect === 'SUPPORT') return 'CONFIRMS';
  if (d10Item?.effect === 'CHALLENGE') return 'CONFLICTS';
  if (d10Item) return 'MODIFIES';
  return 'UNAVAILABLE';
}

/**
 * Opt-in comparison helper for legacy structural evidence. It does not participate in
 * interpretCareerV2 or alter its DomainInterpretation.
 */
export function compareLegacyAndCanonicalStructuralReasoning(
  horoscope: Horoscope,
  options: DomainReasoningOptions,
  enableComparison = false
): {
  enabled: boolean;
  canonicalStructural: CareerStructuralReasoning;
  legacyEvidence: readonly DomainEvidence[];
  comparisonNotes: string[];
} {
  if (!enableComparison) {
    return {
      enabled: false,
      canonicalStructural: {
        direction: 'UNAVAILABLE',
        strength: 'UNDETERMINED',
        primarySupport: 0,
        primaryChallenge: 0,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Comparison disabled'
      },
      legacyEvidence: [],
      comparisonNotes: ['Comparison disabled by default']
    };
  }

  const canonicalStructural = buildCareerStructuralReasoning({ horoscope });
  const themeInterpretation = interpretCareerTheme({
    horoscope,
    dashaInterpretation: options.temporalState.dashaInterpretation
  });
  const mappedLegacyEvidence = linkCareerEvidence(
    buildCareerEvidence(themeInterpretation.evidence)
  );
  const legacyStructuralEvidence = mappedLegacyEvidence.filter(
    (evidence) =>
      evidence.source === 'D1' &&
      (
        evidence.evidenceFamily === 'TENTH_HOUSE' ||
        evidence.evidenceFamily === 'TENTH_LORD' ||
        evidence.evidenceFamily === 'SIXTH_HOUSE' ||
        evidence.evidenceFamily === 'SIXTH_LORD' ||
        evidence.evidenceFamily === 'SECOND_HOUSE' ||
        evidence.evidenceFamily === 'SECOND_LORD' ||
        evidence.evidenceFamily === 'ELEVENTH_HOUSE' ||
        evidence.evidenceFamily === 'ELEVENTH_LORD'
      )
  );

  return {
    enabled: true,
    canonicalStructural,
    legacyEvidence: legacyStructuralEvidence,
    comparisonNotes: [
      `Canonical C4 evidence count: ${canonicalStructural.evidence.length}`,
      `Legacy structural evidence count: ${legacyStructuralEvidence.length}`,
      `Canonical direction: ${canonicalStructural.direction}`,
      `Canonical strength: ${canonicalStructural.strength}`
    ]
  };
}
