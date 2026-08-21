import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import {
  buildDomainInterpretation,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createVargaConfirmation,
  createDomainConclusion,
  calculateEvidenceConfidence,
  detectDomainConflicts
} from '../interpretation';
import type { DomainInterpretation } from '../interpretation/DomainInterpretation';
import {
  classifyCareerEvidence,
  linkCareerEvidence,
  deriveCareerManifestations,
  evaluateCareerTimingActivation,
  evaluateDashaEffect,
  evaluateTransitEffect,
  evaluateD10Relationship,
  resolveCareerConclusionStrength,
  resolveCurrentActivation,
  resolveCurrentPressure,
  buildCareerHeadline,
  buildCareerConclusionData,
  calculateDomainStrength,
  calculateVargaStrength,
  buildCareerNatalStatement,
  buildCareerDashaStatement,
  buildCareerTransitStatement,
  buildD10Statement,
  buildCareerConclusion,
  calculateCareerDataCompleteness
} from './CareerDomainInterpreterV2';

export const GOLDEN_CAREER_EVIDENCE: readonly DomainEvidence[] = Object.freeze([
  createDomainEvidence({
    id: 'GOLDEN_CAREER_10H_STRONG',
    sourceType: 'HOUSE',
    domain: 'CAREER',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '10th house is exceptionally strong with auspicious kendra lordship and directional strength',
    polarity: 'SUPPORTING',
    strength: 'VERY_STRONG',
    priority: 95,
    ruleId: 'CAREER_10H_STRONG_001',
    relatedEvidenceIds: []
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_10L_STRONG',
    sourceType: 'LORDSHIP',
    domain: 'CAREER',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '10th lord Sun is exalted in 10th house establishing prominent leadership potential',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    ruleId: 'CAREER_10L_DIGNITY_001',
    relatedEvidenceIds: []
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_6H_SERVICE',
    sourceType: 'HOUSE',
    domain: 'CAREER',
    role: 'SECONDARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '6th house indicates strong daily service capacity, competition mastery, and structured employment',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 70,
    ruleId: 'CAREER_6H_SERVICE_001',
    relatedEvidenceIds: []
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_11H_GAINS',
    sourceType: 'HOUSE',
    domain: 'CAREER',
    role: 'SECONDARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '11th house supports strong professional gains, income stream from career, and extensive networks',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 70,
    ruleId: 'CAREER_11H_GAINS_001',
    relatedEvidenceIds: []
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_MERCURY_TECH',
    sourceType: 'PLANET',
    domain: 'CAREER',
    role: 'MODIFIER',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: 'Mercury with high Shadbala connects to career house conferring analytical intellect and specialized technical mastery',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 60,
    ruleId: 'CAREER_MERCURY_RELEVANCE_001',
    relatedEvidenceIds: []
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_D10_CONFIRMS',
    sourceType: 'VARGA',
    domain: 'CAREER',
    role: 'CONFIRMATION',
    phase: 'VARGA_CONFIRMATION',
    source: 'D10',
    statement: 'D10 Dasamsa confirms and elevates professional execution, career status, and institutional leadership',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 50,
    ruleId: 'CAREER_D10_CONFIRMATION_001',
    relatedEvidenceIds: ['GOLDEN_CAREER_10H_STRONG', 'GOLDEN_CAREER_10L_STRONG']
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_DASHA_MD_ACTIVATES',
    sourceType: 'DASHA',
    domain: 'CAREER',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Active MAHADASHA period lord Sun activates natal 10th house career promise with full authority',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 30,
    ruleId: 'CAREER_DASHA_TIMING_001:MAHADASHA:SUN',
    relatedEvidenceIds: ['GOLDEN_CAREER_10H_STRONG', 'GOLDEN_CAREER_10L_STRONG'],
    timing: { period: 'MD' }
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_DASHA_AD_SUPPORT',
    sourceType: 'DASHA',
    domain: 'CAREER',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Active ANTARDASHA period lord Mars brings executive drive and expansion to career ventures',
    polarity: 'SUPPORTING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'CAREER_DASHA_TIMING_001:ANTARDASHA:MARS',
    relatedEvidenceIds: ['GOLDEN_CAREER_10H_STRONG'],
    timing: { period: 'AD' }
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_DASHA_AD_CHALLENGE',
    sourceType: 'DASHA',
    domain: 'CAREER',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Concurrent ANTARDASHA sub-period introduces sudden role reorganization or temporary friction',
    polarity: 'CHALLENGING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'CAREER_DASHA_TIMING_001:ANTARDASHA:RAHU',
    relatedEvidenceIds: ['GOLDEN_CAREER_10H_STRONG'],
    timing: { period: 'AD' }
  }),
  createDomainEvidence({
    id: 'GOLDEN_CAREER_TRANSIT_CHALLENGE',
    sourceType: 'TRANSIT',
    domain: 'CAREER',
    role: 'TIMING',
    phase: 'TRANSIT_TRIGGER',
    source: 'TRANSIT',
    statement: 'Saturn transiting 10th house brings heavy workload, added professional responsibility, and restructuring pressure',
    polarity: 'CHALLENGING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'CAREER_TRANSIT_SATURN',
    relatedEvidenceIds: ['GOLDEN_CAREER_10H_STRONG']
  })
]);

export function buildGoldenCareerInterpretation(): DomainInterpretation {
  const evidence = linkCareerEvidence(GOLDEN_CAREER_EVIDENCE);

  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalChallenging = natalEvidence.filter((e) => e.polarity === 'CHALLENGING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const conflicts = detectDomainConflicts('CAREER', evidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const dataCompleteness = calculateCareerDataCompleteness(evidence);

  const natalConfidence = calculateEvidenceConfidence(natalEvidence, {
    dataCompleteness: 'COMPLETE',
    hasPrimaryChallenge,
    hasVargaConflict
  });

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildCareerNatalStatement(natalSupporting, natalChallenging),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((e) => e.id),
    challengingEvidenceIds: natalChallenging.map((e) => e.id)
  });

  const dashaEvidence = evidence.filter(
    (e) => e.phase === 'DASHA_ACTIVATION' || e.source === 'DASHA'
  );
  const dashaSupporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const dashaChallenging = dashaEvidence.filter((e) => e.polarity === 'CHALLENGING');
  const dashaPromiseLinks = Array.from(
    new Set(
      dashaEvidence.flatMap((e) =>
        e.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))
      )
    )
  );

  const dashaEffect = evaluateDashaEffect(dashaEvidence, dashaPromiseLinks);
  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildCareerDashaStatement(dashaEvidence, dashaEffect),
    evidenceIds: dashaEvidence.map((e) => e.id),
    activatedPromiseEvidenceIds: dashaPromiseLinks
  });

  const mdActivation = evaluateCareerTimingActivation('MD', dashaEvidence, natalPromiseEvidenceIds);
  const adActivation = evaluateCareerTimingActivation('AD', dashaEvidence, natalPromiseEvidenceIds);
  const pdActivation = evaluateCareerTimingActivation('PD', dashaEvidence, natalPromiseEvidenceIds);
  const timingActivations = [mdActivation, adActivation, pdActivation];

  const transitEvidence = evidence.filter(
    (e) => e.phase === 'TRANSIT_TRIGGER' || e.source === 'TRANSIT'
  );
  const transitPromiseLinks = Array.from(
    new Set(
      transitEvidence.flatMap((e) =>
        e.relatedEvidenceIds.filter((id) => natalPromiseEvidenceIds.includes(id))
      )
    )
  );

  const transitEffect = evaluateTransitEffect(transitEvidence, transitPromiseLinks);
  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(
      transitEvidence.filter((e) => e.polarity === 'SUPPORTING'),
      transitEvidence.filter((e) => e.polarity === 'CHALLENGING')
    ),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildCareerTransitStatement(transitEvidence, transitEffect),
    evidenceIds: transitEvidence.map((e) => e.id),
    triggeredPromiseEvidenceIds: transitPromiseLinks
  });

  const d10Evidence = evidence.filter((e) => e.source === 'D10');
  const d10Relationship = evaluateD10Relationship([], undefined, d10Evidence, natalPromiseEvidenceIds);
  const vargaConfirmations = [
    createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: d10Relationship,
      strength: calculateVargaStrength(evidence, 'D10'),
      confidence: calculateEvidenceConfidence(d10Evidence),
      statement: buildD10Statement(d10Evidence, d10Relationship),
      evidenceIds: d10Evidence.map((e) => e.id)
    })
  ];

  const manifestations = deriveCareerManifestations(evidence);
  const conclusionStrength = resolveCareerConclusionStrength(
    natalStrength,
    d10Relationship,
    conflicts
  );

  const supportingEvidence = evidence.filter((e) => e.polarity === 'SUPPORTING');
  const challengingEvidence = evidence.filter((e) => e.polarity === 'CHALLENGING');

  const conclusionData = buildCareerConclusionData(
    natalStrength,
    d10Relationship,
    timingActivations,
    transitTrigger,
    conflicts,
    manifestations,
    supportingEvidence.map((e) => e.id),
    challengingEvidence.map((e) => e.id)
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: conclusionStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      dataCompleteness: 'COMPLETE',
      hasPrimaryChallenge: false,
      hasVargaConflict: false
    }),
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      'Strong natal career promise with current period activation.',
      d10Relationship,
      {
        timingActivations,
        conflicts,
        manifestations,
        conclusionData
      }
    ),
    primaryEvidenceIds: evidence
      .filter((e) => e.role === 'PRIMARY')
      .map((e) => e.id),
    supportingEvidenceIds: supportingEvidence.map((e) => e.id),
    challengingEvidenceIds: challengingEvidence.map((e) => e.id),
    unresolvedQuestions: []
  });

  return buildDomainInterpretation({
    domain: 'CAREER',
    evidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations,
    conflicts,
    conclusion,
    timingActivations,
    dataCompleteness,
    conclusionData
  });
}
