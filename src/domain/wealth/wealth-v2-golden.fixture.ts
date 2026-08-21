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
  linkWealthEvidence,
  deriveWealthManifestations,
  evaluateD2Relationship,
  evaluateDashaEffect,
  evaluateTransitEffect,
  evaluateAccumulationDasha,
  evaluateGainsDasha,
  evaluateFortuneDasha,
  evaluateSpeculationDasha,
  evaluateWealthDimension,
  resolveOverallWealthStatus,
  resolveWealthConclusionStrength,
  buildWealthHeadline,
  buildWealthConclusionData,
  calculateDomainStrength,
  calculateVargaStrength,
  buildWealthNatalStatement,
  buildWealthDashaStatement,
  buildWealthTransitStatement,
  buildD2Statement,
  buildWealthConclusion,
  calculateWealthDataCompleteness
} from './WealthDomainInterpreterV2';
import type { WealthDimensionInterpretation } from './wealthTypes';

export const GOLDEN_WEALTH_EVIDENCE: readonly DomainEvidence[] = Object.freeze([
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_2H_STRONG',
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '2nd house is exceptionally strong with auspicious dhana yoga and benefic aspects',
    polarity: 'SUPPORTING',
    strength: 'VERY_STRONG',
    priority: 95,
    ruleId: 'WEALTH_HOUSE_PROMISE_2H_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'SECOND_HOUSE',
    dimension: 'ACCUMULATION'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_2L_STRONG',
    sourceType: 'LORDSHIP',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '2nd lord is exalted in auspicious quadrant conferring substantial asset accumulation capacity',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    ruleId: 'WEALTH_LORD_PROMISE_2L_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'SECOND_LORD',
    dimension: 'ACCUMULATION'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_11H_GAINS',
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '11th house supports strong recurring revenue, profit generation, and expansive network gains',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    ruleId: 'WEALTH_HOUSE_PROMISE_11H_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'ELEVENTH_HOUSE',
    dimension: 'GAINS'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_11L_STRONG',
    sourceType: 'LORDSHIP',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '11th lord is well-placed and fortified, ensuring continuous financial inflow and business profits',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    ruleId: 'WEALTH_LORD_PROMISE_11L_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'ELEVENTH_LORD',
    dimension: 'GAINS'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_9H_FORTUNE',
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '9th house promotes divine fortune, auspicious heritage, and long-term prosperity',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 90,
    ruleId: 'WEALTH_HOUSE_PROMISE_9H_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'NINTH_HOUSE',
    dimension: 'FORTUNE'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_5H_SPECULATION',
    sourceType: 'HOUSE',
    domain: 'WEALTH',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: '5th house shows moderate speculative acumen with prudent investment discretion required',
    polarity: 'SUPPORTING',
    strength: 'MODERATE',
    priority: 90,
    ruleId: 'WEALTH_HOUSE_PROMISE_5H_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'FIFTH_HOUSE',
    dimension: 'SPECULATION'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_JUPITER_KARAKA',
    sourceType: 'PLANET',
    domain: 'WEALTH',
    role: 'MODIFIER',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: 'Jupiter as wealth significator (Dhana-karaka) possesses high Shadbala and fortifies general prosperity',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 60,
    ruleId: 'WEALTH_JUPITER_KARAKA_001',
    relatedEvidenceIds: [],
    evidenceFamily: 'JUPITER',
    dimension: 'FORTUNE'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_D2_CONFIRMS',
    sourceType: 'VARGA',
    domain: 'WEALTH',
    role: 'CONFIRMATION',
    phase: 'VARGA_CONFIRMATION',
    source: 'D2',
    statement: 'D2 Hora confirms strong wealth retention, liquid wealth capability, and balanced asset accumulation',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 50,
    ruleId: 'WEALTH_D2_CONFIRMATION_001',
    relatedEvidenceIds: ['GOLDEN_WEALTH_2H_STRONG', 'GOLDEN_WEALTH_2L_STRONG'],
    evidenceFamily: 'D2'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_DASHA_MD_ACTIVATES',
    sourceType: 'DASHA',
    domain: 'WEALTH',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Active MAHADASHA period lord activates 2nd house wealth promise with strong financial returns',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 30,
    ruleId: 'WEALTH_DASHA_TIMING_001:MAHADASHA:SUN',
    relatedEvidenceIds: ['GOLDEN_WEALTH_2H_STRONG', 'GOLDEN_WEALTH_2L_STRONG'],
    timing: { period: 'MD' },
    evidenceFamily: 'DASHA'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_DASHA_AD_SUPPORT',
    sourceType: 'DASHA',
    domain: 'WEALTH',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Active ANTARDASHA period lord activates 11th house gains and business revenue expansion',
    polarity: 'SUPPORTING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'WEALTH_DASHA_TIMING_001:ANTARDASHA:JUPITER',
    relatedEvidenceIds: ['GOLDEN_WEALTH_11H_GAINS'],
    timing: { period: 'AD' },
    evidenceFamily: 'DASHA'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_DASHA_AD_CHALLENGE',
    sourceType: 'DASHA',
    domain: 'WEALTH',
    role: 'TIMING',
    phase: 'DASHA_ACTIVATION',
    source: 'DASHA',
    statement: 'Concurrent sub-period introduces sudden fluctuations in speculative investments',
    polarity: 'CHALLENGING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'WEALTH_DASHA_TIMING_001:ANTARDASHA:RAHU',
    relatedEvidenceIds: ['GOLDEN_WEALTH_5H_SPECULATION'],
    timing: { period: 'AD' },
    evidenceFamily: 'DASHA'
  }),
  createDomainEvidence({
    id: 'GOLDEN_WEALTH_TRANSIT_CHALLENGE',
    sourceType: 'TRANSIT',
    domain: 'WEALTH',
    role: 'TIMING',
    phase: 'TRANSIT_TRIGGER',
    source: 'TRANSIT',
    statement: 'Saturn transiting 2nd house creates temporary cash-flow pressure and emphasizes capital conservation',
    polarity: 'CHALLENGING',
    strength: 'MODERATE',
    priority: 30,
    ruleId: 'WEALTH_TRANSIT_SATURN',
    relatedEvidenceIds: ['GOLDEN_WEALTH_2H_STRONG'],
    evidenceFamily: 'TRANSIT'
  })
]);

export function buildGoldenWealthInterpretation(): DomainInterpretation {
  const evidence = linkWealthEvidence(GOLDEN_WEALTH_EVIDENCE);

  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalChallenging = natalEvidence.filter((e) => e.polarity === 'CHALLENGING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const conflicts = detectDomainConflicts('WEALTH', evidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const dataCompleteness = calculateWealthDataCompleteness(evidence);

  const natalConfidence = calculateEvidenceConfidence(natalEvidence, {
    dataCompleteness: 'COMPLETE',
    hasPrimaryChallenge,
    hasVargaConflict
  });

  const natalPromise = createNatalPromise({
    domain: 'WEALTH',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildWealthNatalStatement(natalSupporting, natalChallenging),
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
    domain: 'WEALTH',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildWealthDashaStatement(dashaEvidence, dashaEffect),
    evidenceIds: dashaEvidence.map((e) => e.id),
    activatedPromiseEvidenceIds: dashaPromiseLinks
  });

  const accumulationDasha = evaluateAccumulationDasha(dashaEvidence, evidence);
  const gainsDasha = evaluateGainsDasha(dashaEvidence, evidence);
  const fortuneDasha = evaluateFortuneDasha(dashaEvidence, evidence);
  const speculationDasha = evaluateSpeculationDasha(dashaEvidence, evidence);

  const dimensions: readonly WealthDimensionInterpretation[] = Object.freeze([
    evaluateWealthDimension('ACCUMULATION', evidence, accumulationDasha),
    evaluateWealthDimension('GAINS', evidence, gainsDasha),
    evaluateWealthDimension('FORTUNE', evidence, fortuneDasha),
    evaluateWealthDimension('SPECULATION', evidence, speculationDasha)
  ]);

  const overallStatus = resolveOverallWealthStatus(dimensions);

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
    domain: 'WEALTH',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(
      transitEvidence.filter((e) => e.polarity === 'SUPPORTING'),
      transitEvidence.filter((e) => e.polarity === 'CHALLENGING')
    ),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildWealthTransitStatement(transitEvidence, transitEffect),
    evidenceIds: transitEvidence.map((e) => e.id),
    triggeredPromiseEvidenceIds: transitPromiseLinks
  });

  const d2Evidence = evidence.filter((e) => e.source === 'D2');
  const d2Relationship = evaluateD2Relationship(natalEvidence, d2Evidence, natalPromiseEvidenceIds);
  const vargaConfirmations = [
    createVargaConfirmation({
      domain: 'WEALTH',
      varga: 'D2',
      relationship: d2Relationship,
      strength: calculateVargaStrength(evidence, 'D2'),
      confidence: calculateEvidenceConfidence(d2Evidence),
      statement: buildD2Statement(d2Evidence, d2Relationship),
      evidenceIds: d2Evidence.map((e) => e.id)
    })
  ];

  const manifestations = deriveWealthManifestations(evidence);
  const conclusionStrength = resolveWealthConclusionStrength(
    natalStrength,
    d2Relationship,
    conflicts
  );

  const supportingEvidence = evidence.filter((e) => e.polarity === 'SUPPORTING');
  const challengingEvidence = evidence.filter((e) => e.polarity === 'CHALLENGING');

  const conclusionData = buildWealthConclusionData({
    overallStatus,
    dimensions,
    d2Relationship,
    manifestations,
    conflicts,
    evidence
  });

  const conclusion = createDomainConclusion({
    domain: 'WEALTH',
    strength: conclusionStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      dataCompleteness: 'COMPLETE',
      hasPrimaryChallenge: false,
      hasVargaConflict: false
    }),
    statement: buildWealthConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      'Strong natal wealth promise with current period activation.',
      {
        vargaConfirmations,
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

  const timingActivations = Object.freeze([
    {
      dimension: 'ACCUMULATION' as const,
      effect: accumulationDasha
    },
    {
      dimension: 'GAINS' as const,
      effect: gainsDasha
    },
    {
      dimension: 'FORTUNE' as const,
      effect: fortuneDasha
    },
    {
      dimension: 'SPECULATION' as const,
      effect: speculationDasha
    }
  ]);

  return buildDomainInterpretation({
    domain: 'WEALTH',
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
