import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { createDomainManifestation } from '../interpretation';
import type {
  DomainEvidence,
  DomainManifestation
} from '../interpretation';

export const CAREER_LEADERSHIP_FAMILIES = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.TENTH_HOUSE,
  CareerEvidenceFamily.TENTH_LORD,
  CareerEvidenceFamily.SUN,
  CareerEvidenceFamily.JUPITER,
  CareerEvidenceFamily.YOGA
]);

export const CAREER_EMPLOYMENT_FAMILIES = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.SIXTH_HOUSE,
  CareerEvidenceFamily.SIXTH_LORD,
  CareerEvidenceFamily.SATURN
]);

export const CAREER_TECHNICAL_FAMILIES = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.MERCURY,
  CareerEvidenceFamily.MARS
]);

export const CAREER_ENTREPRENEURSHIP_FAMILIES = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.ELEVENTH_HOUSE,
  CareerEvidenceFamily.ELEVENTH_LORD
]);

export const CAREER_LEADERSHIP_RULES = new Set<string>([
  'CAREER_HOUSE_PROMISE_10H_001',
  'CAREER_LORD_PROMISE_10L_001',
  'CAREER_SUN_KARAKA_001',
  'CAREER_JUPITER_KARAKA_001',
  'CAREER_YOGA_CONFIRMATION_001',
  'CAREER_10H_STRONG_001',
  'CAREER_10L_DIGNITY_001'
]);

export const CAREER_EMPLOYMENT_RULES = new Set<string>([
  'CAREER_HOUSE_PROMISE_6H_001',
  'CAREER_LORD_PROMISE_6L_001',
  'CAREER_SATURN_KARAKA_001',
  'CAREER_6H_10H_LINK_001',
  'CAREER_6H_SERVICE_001'
]);

export const CAREER_TECHNICAL_RULES = new Set<string>([
  'CAREER_MERCURY_KARAKA_001',
  'CAREER_MARS_KARAKA_001',
  'CAREER_MERCURY_RELEVANCE_001',
  'CAREER_MARS_RELEVANCE_001'
]);

export const CAREER_ENTREPRENEURSHIP_RULES = new Set<string>([
  'CAREER_HOUSE_PROMISE_11H_001',
  'CAREER_LORD_PROMISE_11L_001',
  'CAREER_10H_11H_LINK_001',
  'CAREER_11H_GAINS_001'
]);

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

  const rawById = new Map<string, ThemeInterpretationEvidence<CareerEvidenceFamily>>();
  if (rawEvidence) {
    for (const item of rawEvidence) {
      rawById.set(item.id, item);
    }
  }

  const getSupportingEvidence = (
    families: ReadonlySet<CareerEvidenceFamily>,
    ruleSet: ReadonlySet<string>,
    allowPrimaryFallback = false
  ): DomainEvidence[] => {
    return evidence.filter((item) => {
      // Must be SUPPORTING
      if (item.polarity !== 'SUPPORTING') {
        return false;
      }

      const raw = rawById.get(item.id);
      if (raw) {
        if (raw.effect !== 'SUPPORT') {
          return false;
        }
        if (families.has(raw.evidenceFamily)) {
          return true;
        }
        const baseRawRule = raw.ruleId.split(':')[0];
        if (ruleSet.has(raw.ruleId) || ruleSet.has(baseRawRule)) {
          return true;
        }
      }

      if (item.ruleId) {
        const baseRule = item.ruleId.split(':')[0];
        if (ruleSet.has(item.ruleId) || ruleSet.has(baseRule)) {
          return true;
        }
      }

      if (allowPrimaryFallback && item.role === 'PRIMARY' && item.source === 'D1') {
        return true;
      }

      return false;
    });
  };

  // 1. LEADERSHIP & AUTHORITY
  const leadershipEvidence = getSupportingEvidence(
    CAREER_LEADERSHIP_FAMILIES,
    CAREER_LEADERSHIP_RULES,
    true
  );
  const leadershipConfidence = calculateManifestationConfidence(leadershipEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'LEADERSHIP',
      confidence: leadershipConfidence,
      statement: leadershipEvidence.length > 0
        ? 'Executive authority, organizational visibility, and public leadership are strongly indicated.'
        : 'Moderate potential for leadership roles depending on timing activation.',
      evidenceIds: leadershipEvidence.map((e) => e.id)
    })
  );

  // 2. EMPLOYMENT & SERVICE
  const employmentEvidence = getSupportingEvidence(
    CAREER_EMPLOYMENT_FAMILIES,
    CAREER_EMPLOYMENT_RULES
  );
  const employmentConfidence = calculateManifestationConfidence(employmentEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'EMPLOYMENT',
      confidence: employmentConfidence,
      statement: employmentEvidence.length > 0
        ? 'Structured professional employment, institutional service, and problem-solving career pathways are supported.'
        : 'Standard employment tracks operate as secondary avenues.',
      evidenceIds: employmentEvidence.map((e) => e.id)
    })
  );

  // 3. TECHNICAL & SPECIALIZATION
  const technicalEvidence = getSupportingEvidence(
    CAREER_TECHNICAL_FAMILIES,
    CAREER_TECHNICAL_RULES
  );
  const technicalConfidence = calculateManifestationConfidence(technicalEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'TECHNICAL_SPECIALIZATION',
      confidence: technicalConfidence,
      statement: technicalEvidence.length > 0
        ? 'Analytical precision, technical problem-solving, or specialized domain mastery are supported.'
        : 'General professional domain application without exclusive technical focus.',
      evidenceIds: technicalEvidence.map((e) => e.id)
    })
  );

  // 4. INDEPENDENT WORK / ENTREPRENEURSHIP
  const entrepreneurshipEvidence = getSupportingEvidence(
    CAREER_ENTREPRENEURSHIP_FAMILIES,
    CAREER_ENTREPRENEURSHIP_RULES
  );
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
