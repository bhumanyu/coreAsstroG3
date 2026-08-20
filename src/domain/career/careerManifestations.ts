import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { createDomainManifestation } from '../interpretation';
import type {
  DomainEvidence,
  DomainManifestation,
  ConfidenceLevel
} from '../interpretation';

export function calculateManifestationConfidence(
  evidence: readonly DomainEvidence[]
): 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW' {
  if (evidence.length === 0) {
    return 'LOW';
  }

  const primary = evidence.filter((e) => e.role === 'PRIMARY');
  const strong = evidence.filter(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );
  const supporting = evidence.filter((e) => e.polarity === 'SUPPORTING');

  if (primary.length >= 2 && strong.length >= 2) {
    return 'VERY_HIGH';
  }

  if ((primary.length >= 1 && strong.length >= 1) || (primary.length >= 2 && supporting.length >= 2)) {
    return 'HIGH';
  }

  if (primary.length >= 1 || strong.length >= 1 || supporting.length >= 2) {
    return 'MODERATE';
  }

  return 'LOW';
}

export function deriveCareerManifestations(
  evidence: readonly DomainEvidence[],
  rawEvidence?: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];

  // Helper to get evidence IDs that exist in `evidence`
  const getMatchingEvidence = (predicate: (item: DomainEvidence) => boolean): DomainEvidence[] => {
    return evidence.filter(predicate);
  };

  // 1. LEADERSHIP & AUTHORITY
  const leadershipEvidence = getMatchingEvidence((item) => {
    const rule = item.ruleId || '';
    return (
      rule.includes('10H') ||
      rule.includes('10L') ||
      rule.includes('SUN') ||
      rule.includes('JUPITER') ||
      rule.includes('YOGA') ||
      rule.includes('raja_yoga') ||
      item.role === 'PRIMARY'
    );
  });

  const leadershipConfidence = calculateManifestationConfidence(leadershipEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'LEADERSHIP',
      confidence: leadershipConfidence,
      statement: leadershipEvidence.some((e) => e.polarity === 'SUPPORTING')
        ? 'Executive authority, organizational visibility, and public leadership are strongly indicated.'
        : 'Moderate potential for leadership roles depending on timing activation.',
      evidenceIds: leadershipEvidence.map((e) => e.id)
    })
  );

  // 2. EMPLOYMENT & SERVICE
  const employmentEvidence = getMatchingEvidence((item) => {
    const rule = item.ruleId || '';
    return (
      rule.includes('6H') ||
      rule.includes('6L') ||
      rule.includes('SERVICE') ||
      (rule.includes('SATURN') && rule.includes('CAREER'))
    );
  });

  const employmentConfidence = calculateManifestationConfidence(employmentEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'EMPLOYMENT',
      confidence: employmentConfidence,
      statement: employmentEvidence.some((e) => e.polarity === 'SUPPORTING')
        ? 'Structured professional employment, institutional service, and problem-solving career pathways are supported.'
        : 'Standard employment tracks operate as secondary avenues.',
      evidenceIds: employmentEvidence.map((e) => e.id)
    })
  );

  // 3. TECHNICAL & SPECIALIZATION
  const technicalEvidence = getMatchingEvidence((item) => {
    const rule = item.ruleId || '';
    return (
      rule.includes('MERCURY') ||
      rule.includes('MARS') ||
      rule.includes('analytical') ||
      rule.includes('technical') ||
      rule.includes('trade')
    );
  });

  const technicalConfidence = calculateManifestationConfidence(technicalEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'TECHNICAL_SPECIALIZATION',
      confidence: technicalConfidence,
      statement: technicalEvidence.some((e) => e.polarity === 'SUPPORTING')
        ? 'Analytical precision, technical problem-solving, or specialized domain mastery are supported.'
        : 'General professional domain application without exclusive technical focus.',
      evidenceIds: technicalEvidence.map((e) => e.id)
    })
  );

  // 4. INDEPENDENT WORK / ENTREPRENEURSHIP
  const entrepreneurshipEvidence = getMatchingEvidence((item) => {
    const rule = item.ruleId || '';
    return (
      rule.includes('11H') ||
      rule.includes('11L') ||
      rule.includes('GAINS') ||
      rule.includes('entrepreneur') ||
      rule.includes('3H')
    );
  });

  if (entrepreneurshipEvidence.length > 0) {
    const entrepreneurshipConfidence = calculateManifestationConfidence(entrepreneurshipEvidence);
    manifestations.push(
      createDomainManifestation({
        mode: 'ENTREPRENEURSHIP',
        confidence: entrepreneurshipConfidence,
        statement: 'Supportive planetary configurations for independent enterprise, networked ventures, and commercial initiative.',
        evidenceIds: entrepreneurshipEvidence.map((e) => e.id)
      })
    );
  }

  return Object.freeze(manifestations);
}

export function buildCareerManifestations(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[],
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  return deriveCareerManifestations(evidence, rawEvidence);
}
