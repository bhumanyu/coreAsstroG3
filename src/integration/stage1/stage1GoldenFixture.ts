import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import {
  interpretWealthV2,
  buildWealthConclusionData,
  resolveOverallWealthStatus,
  evaluateWealthDimension,
  evaluateAccumulationDasha,
  evaluateGainsDasha,
  evaluateFortuneDasha,
  evaluateSpeculationDasha,
  resolveWealthConclusionStrength,
  buildWealthNatalStatement,
  buildWealthDashaStatement,
  buildWealthTransitStatement,
  buildD2Statement,
  buildWealthConclusion,
  calculateDomainStrength,
  calculateVargaStrength,
  evaluateD2Relationship,
  evaluateDashaEffect,
  evaluateTransitEffect,
  calculateWealthDataCompleteness
} from '../../domain/wealth/WealthDomainInterpreterV2';
import {
  createDomainEvidence,
  buildDomainInterpretation,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createVargaConfirmation,
  createDomainConclusion,
  calculateEvidenceConfidence,
  detectDomainConflicts
} from '../../domain/interpretation';
import type { DomainInterpretation } from '../../domain/interpretation/DomainInterpretation';
import { linkWealthEvidence } from '../../domain/wealth/wealthEvidenceLinker';
import { deriveWealthManifestations } from '../../domain/wealth/wealthManifestations';
import { linkCareerEvidence } from '../../domain/career/careerEvidenceLinker';
import { deriveCareerManifestations } from '../../domain/career/careerManifestations';
import {
  buildCareerConclusion,
  buildCareerNatalStatement,
  buildCareerDashaStatement,
  buildCareerTransitStatement,
  buildD10Statement,
  evaluateCareerTimingActivation,
  evaluateD10Relationship,
  evaluateDashaEffect as evaluateCareerDashaEffect,
  evaluateTransitEffect as evaluateCareerTransitEffect,
  calculateCareerDataCompleteness,
  buildCareerConclusionData
} from '../../domain/career/CareerDomainInterpreterV2';
import type {
  Stage1GoldenExpectation,
  Stage1IntegrationInput
} from './stage1IntegrationTypes';

export const STAGE1_GOLDEN_HOROSCOPE = Object.freeze(
  calculateHoroscope(CANONICAL_BIRTH_DETAILS)
);

export const STAGE1_GOLDEN_CAREER = Object.freeze(
  interpretCareerV2(STAGE1_GOLDEN_HOROSCOPE)
);

export const STAGE1_GOLDEN_WEALTH = Object.freeze(
  interpretWealthV2(STAGE1_GOLDEN_HOROSCOPE)
);

export const STAGE1_GOLDEN_INPUT: Stage1IntegrationInput = Object.freeze({
  horoscope: STAGE1_GOLDEN_HOROSCOPE,
  task: 'CHART_SYNTHESIS',
  requestId: 'stage1-golden-request-001'
});

export const STAGE1_GOLDEN_EXPECTATION: Stage1GoldenExpectation = Object.freeze({
  career: Object.freeze({
    natalStatus: STAGE1_GOLDEN_CAREER.natalPromise.strength,
    dashaEffect: STAGE1_GOLDEN_CAREER.dashaActivation.effect,
    transitEffect: STAGE1_GOLDEN_CAREER.transitTrigger.effect,
    d10Relationship:
      STAGE1_GOLDEN_CAREER.vargaConfirmations.find((v) => v.varga === 'D10')
        ?.relationship ?? 'UNAVAILABLE',
    supportingEvidenceRequired:
      STAGE1_GOLDEN_CAREER.conclusion.supportingEvidenceIds.length > 0
  }),
  wealth: Object.freeze({
    overallStatus:
      STAGE1_GOLDEN_WEALTH.conclusionData?.overallStatus ??
      STAGE1_GOLDEN_WEALTH.natalPromise.strength,
    accumulationStatus:
      STAGE1_GOLDEN_WEALTH.conclusionData?.accumulationStatus ??
      'UNAVAILABLE',
    gainsStatus:
      STAGE1_GOLDEN_WEALTH.conclusionData?.gainsStatus ?? 'UNAVAILABLE',
    fortuneStatus:
      STAGE1_GOLDEN_WEALTH.conclusionData?.fortuneStatus ?? 'UNAVAILABLE',
    speculationStatus:
      STAGE1_GOLDEN_WEALTH.conclusionData?.speculationStatus ??
      'UNAVAILABLE',
    dashaEffect: STAGE1_GOLDEN_WEALTH.dashaActivation.effect,
    transitEffect: STAGE1_GOLDEN_WEALTH.transitTrigger.effect,
    d2Relationship:
      STAGE1_GOLDEN_WEALTH.vargaConfirmations.find((v) => v.varga === 'D2')
        ?.relationship ?? 'UNAVAILABLE'
  })
});

/**
 * Constructs a deterministic Wealth scenario where Accumulation and Gains are STRONGLY_SUPPORTED,
 * Fortune is SUPPORTED, D2 CONFIRMS, but Speculation (5th house) is CHALLENGED.
 * Proves speculation dimension separation survives through AI projection and UI ViewModel.
 */
export function buildSpeculationChallengedWealthInterpretation(): DomainInterpretation {
  const rawEvidence = [
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_2H_STRONG',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house is strong with exalted benefic aspects',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'WEALTH_HOUSE_PROMISE_2H_001',
      dimension: 'ACCUMULATION',
      evidenceFamily: 'SECOND_HOUSE'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_2L_STRONG',
      sourceType: 'LORDSHIP',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd lord is well-placed in auspicious Kendra',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'WEALTH_LORD_PROMISE_2L_001',
      dimension: 'ACCUMULATION',
      evidenceFamily: 'SECOND_LORD'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_11H_GAINS',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '11th house supports continuous revenue and business profits',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 90,
      ruleId: 'WEALTH_HOUSE_PROMISE_11H_001',
      dimension: 'GAINS',
      evidenceFamily: 'ELEVENTH_HOUSE'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_11L_STRONG',
      sourceType: 'LORDSHIP',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '11th lord is fortified, ensuring robust recurring inflows',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'WEALTH_LORD_PROMISE_11L_001',
      dimension: 'GAINS',
      evidenceFamily: 'ELEVENTH_LORD'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_9H_FORTUNE',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '9th house indicates general luck and prosperity',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'WEALTH_HOUSE_PROMISE_9H_001',
      dimension: 'FORTUNE',
      evidenceFamily: 'NINTH_HOUSE'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_5H_CHALLENGED',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '5th house afflicted by malefics causing severe volatility in speculative trading',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'WEALTH_HOUSE_PROMISE_5H_001',
      dimension: 'SPECULATION',
      evidenceFamily: 'FIFTH_HOUSE'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_D2_CONFIRMS',
      sourceType: 'VARGA',
      domain: 'WEALTH',
      role: 'CONFIRMATION',
      phase: 'VARGA_CONFIRMATION',
      source: 'D2',
      statement: 'D2 Hora confirms liquid asset stability and accumulation capacity',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 50,
      ruleId: 'WEALTH_D2_CONFIRMATION_001',
      relatedEvidenceIds: ['SCENARIO_WEALTH_2H_STRONG', 'SCENARIO_WEALTH_2L_STRONG'],
      evidenceFamily: 'D2'
    }),
    createDomainEvidence({
      id: 'SCENARIO_WEALTH_DASHA_MD_ACTIVATES',
      sourceType: 'DASHA',
      domain: 'WEALTH',
      role: 'TIMING',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: 'Mahadasha activates 2nd house accumulation',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 30,
      ruleId: 'WEALTH_DASHA_TIMING_001',
      relatedEvidenceIds: ['SCENARIO_WEALTH_2H_STRONG'],
      timing: { period: 'MD' },
      evidenceFamily: 'DASHA'
    })
  ];

  const evidence = linkWealthEvidence(rawEvidence);
  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalChallenging = natalEvidence.filter((e) => e.polarity === 'CHALLENGING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const conflicts = detectDomainConflicts('WEALTH', evidence);
  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const dataCompleteness = calculateWealthDataCompleteness(evidence);

  const natalConfidence = calculateEvidenceConfidence(natalEvidence, {
    dataCompleteness: 'COMPLETE',
    hasPrimaryChallenge: false,
    hasVargaConflict: false
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

  const dimensions = Object.freeze([
    evaluateWealthDimension('ACCUMULATION', evidence, accumulationDasha),
    evaluateWealthDimension('GAINS', evidence, gainsDasha),
    evaluateWealthDimension('FORTUNE', evidence, fortuneDasha),
    evaluateWealthDimension('SPECULATION', evidence, speculationDasha)
  ]);

  const overallStatus = resolveOverallWealthStatus(dimensions);

  const transitEvidence = evidence.filter(
    (e) => e.phase === 'TRANSIT_TRIGGER' || e.source === 'TRANSIT'
  );
  const transitTrigger = createTransitTrigger({
    domain: 'WEALTH',
    active: false,
    effect: 'NO_MATERIAL_TRIGGER',
    strength: 'UNDETERMINED',
    confidence: 'LOW',
    statement: buildWealthTransitStatement(transitEvidence, 'NO_MATERIAL_TRIGGER'),
    evidenceIds: [],
    triggeredPromiseEvidenceIds: []
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
    confidence: calculateEvidenceConfidence(evidence),
    statement: buildWealthConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      'Structured accumulation and gains are supported while speculation is vulnerable.',
      { vargaConfirmations, conclusionData }
    ),
    primaryEvidenceIds: evidence
      .filter((e) => e.role === 'PRIMARY')
      .map((e) => e.id),
    supportingEvidenceIds: evidence
      .filter((e) => e.polarity === 'SUPPORTING')
      .map((e) => e.id),
    challengingEvidenceIds: evidence
      .filter((e) => e.polarity === 'CHALLENGING')
      .map((e) => e.id),
    unresolvedQuestions: []
  });

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
    dataCompleteness,
    conclusionData
  });
}

/**
 * Constructs an incomplete Career scenario where D10, Dasha, and Transit are unavailable.
 */
export function buildIncompleteCareerInterpretation(): DomainInterpretation {
  const rawEvidence = [
    createDomainEvidence({
      id: 'CAREER_BASIC_10H',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is favorably placed in natal chart',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'CAREER_10H_STRONG_001'
    })
  ];

  const evidence = linkCareerEvidence(rawEvidence);
  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const natalStrength = calculateDomainStrength(natalSupporting, []);
  const dataCompleteness = calculateCareerDataCompleteness(evidence);

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: 'MODERATE',
    statement: buildCareerNatalStatement(natalSupporting, []),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((e) => e.id),
    challengingEvidenceIds: []
  });

  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: false,
    effect: 'INSUFFICIENT_DATA',
    strength: 'UNDETERMINED',
    confidence: 'LOW',
    statement: 'Dasha timing data unavailable.',
    evidenceIds: [],
    activatedPromiseEvidenceIds: []
  });

  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: false,
    effect: 'NO_MATERIAL_TRIGGER',
    strength: 'UNDETERMINED',
    confidence: 'LOW',
    statement: 'Transit timing data unavailable.',
    evidenceIds: [],
    triggeredPromiseEvidenceIds: []
  });

  const vargaConfirmations = [
    createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      confidence: 'LOW',
      statement: 'D10 divisional chart analysis unavailable.',
      evidenceIds: []
    })
  ];

  const manifestations = deriveCareerManifestations(evidence);
  const conclusionData = buildCareerConclusionData(
    natalStrength,
    'UNAVAILABLE',
    [],
    transitTrigger,
    [],
    manifestations,
    natalSupporting.map((e) => e.id),
    []
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: 'MODERATE',
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      'Natal career potential with unavailable divisional and timing verification.',
      'UNAVAILABLE',
      {
        timingActivations: [],
        conflicts: [],
        manifestations,
        conclusionData
      }
    ),
    primaryEvidenceIds: evidence.map((e) => e.id),
    supportingEvidenceIds: evidence.map((e) => e.id),
    challengingEvidenceIds: [],
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
    conflicts: [],
    conclusion,
    dataCompleteness,
    conclusionData
  });
}

/**
 * Constructs an incomplete Wealth scenario where D2, Dasha, and Transit are unavailable.
 */
export function buildIncompleteWealthInterpretation(): DomainInterpretation {
  const rawEvidence = [
    createDomainEvidence({
      id: 'WEALTH_BASIC_2H',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '2nd house is well aspected in natal chart',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'WEALTH_HOUSE_PROMISE_2H_001',
      dimension: 'ACCUMULATION'
    })
  ];

  const evidence = linkWealthEvidence(rawEvidence);
  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const natalStrength = calculateDomainStrength(natalSupporting, []);
  const dataCompleteness = calculateWealthDataCompleteness(evidence);

  const natalPromise = createNatalPromise({
    domain: 'WEALTH',
    strength: natalStrength,
    confidence: 'MODERATE',
    statement: buildWealthNatalStatement(natalSupporting, []),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((e) => e.id),
    challengingEvidenceIds: []
  });

  const dashaActivation = createDashaActivation({
    domain: 'WEALTH',
    active: false,
    effect: 'INSUFFICIENT_DATA',
    strength: 'UNDETERMINED',
    confidence: 'LOW',
    statement: 'Dasha timing data unavailable.',
    evidenceIds: [],
    activatedPromiseEvidenceIds: []
  });

  const transitTrigger = createTransitTrigger({
    domain: 'WEALTH',
    active: false,
    effect: 'NO_MATERIAL_TRIGGER',
    strength: 'UNDETERMINED',
    confidence: 'LOW',
    statement: 'Transit data unavailable.',
    evidenceIds: [],
    triggeredPromiseEvidenceIds: []
  });

  const vargaConfirmations = [
    createVargaConfirmation({
      domain: 'WEALTH',
      varga: 'D2',
      relationship: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      confidence: 'LOW',
      statement: 'D2 Hora divisional analysis unavailable.',
      evidenceIds: []
    })
  ];

  const dimensions = Object.freeze([
    evaluateWealthDimension('ACCUMULATION', evidence, 'INSUFFICIENT_DATA'),
    evaluateWealthDimension('GAINS', evidence, 'INSUFFICIENT_DATA'),
    evaluateWealthDimension('FORTUNE', evidence, 'INSUFFICIENT_DATA'),
    evaluateWealthDimension('SPECULATION', evidence, 'INSUFFICIENT_DATA')
  ]);

  const overallStatus = resolveOverallWealthStatus(dimensions);
  const manifestations = deriveWealthManifestations(evidence);

  const conclusionData = buildWealthConclusionData({
    overallStatus,
    dimensions,
    d2Relationship: 'UNAVAILABLE',
    manifestations,
    conflicts: [],
    evidence
  });

  const conclusion = createDomainConclusion({
    domain: 'WEALTH',
    strength: natalStrength,
    confidence: 'MODERATE',
    statement: buildWealthConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      'Natal wealth potential with unavailable divisional and timing verification.',
      { vargaConfirmations, conclusionData }
    ),
    primaryEvidenceIds: evidence.map((e) => e.id),
    supportingEvidenceIds: evidence.map((e) => e.id),
    challengingEvidenceIds: [],
    unresolvedQuestions: []
  });

  return buildDomainInterpretation({
    domain: 'WEALTH',
    evidence,
    natalPromise,
    dashaActivation,
    transitTrigger,
    vargaConfirmations,
    manifestations,
    conflicts: [],
    conclusion,
    dataCompleteness,
    conclusionData
  });
}

/**
 * Constructs a High Pressure Career scenario:
 * Natal STRONG + D10 CONFIRMS + Dasha ACTIVATES + Transit CHALLENGE.
 * Proves natal career promise stays VERY_STRONG / STRONG with current pressure HIGH / MODERATE.
 */
export function buildHighPressureCareerInterpretation(): DomainInterpretation {
  const rawEvidence = [
    createDomainEvidence({
      id: 'CAREER_HP_10H',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is exalted in Kendra',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95,
      ruleId: 'CAREER_10H_STRONG_001'
    }),
    createDomainEvidence({
      id: 'CAREER_HP_10L',
      sourceType: 'LORDSHIP',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th lord is fortified with benefic aspects',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 90,
      ruleId: 'CAREER_10L_STRONG_001'
    }),
    createDomainEvidence({
      id: 'CAREER_HP_D10',
      sourceType: 'VARGA',
      domain: 'CAREER',
      role: 'CONFIRMATION',
      phase: 'VARGA_CONFIRMATION',
      source: 'D10',
      statement: 'D10 Dasamsa confirms strong executive leadership capacity',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 50,
      ruleId: 'CAREER_D10_CONFIRMS_001',
      relatedEvidenceIds: ['CAREER_HP_10H', 'CAREER_HP_10L']
    }),
    createDomainEvidence({
      id: 'CAREER_HP_DASHA',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: 'Active Mahadasha activates 10th house executive authority',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 30,
      ruleId: 'CAREER_DASHA_ACTIVATES_001',
      relatedEvidenceIds: ['CAREER_HP_10H'],
      timing: { period: 'MD' }
    }),
    createDomainEvidence({
      id: 'CAREER_HP_TRANSIT_CHALLENGE',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Saturn transit over 10th house introduces acute operational friction and heavy workload',
      polarity: 'CHALLENGING',
      strength: 'STRONG',
      priority: 30,
      ruleId: 'CAREER_TRANSIT_SATURN_001',
      relatedEvidenceIds: ['CAREER_HP_10H']
    })
  ];

  const evidence = linkCareerEvidence(rawEvidence);
  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalSupporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const natalPromiseEvidenceIds = natalEvidence.map((e) => e.id);

  const conflicts = detectDomainConflicts('CAREER', evidence);
  const natalStrength = calculateDomainStrength(natalSupporting, []);
  const dataCompleteness = calculateCareerDataCompleteness(evidence);

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: 'VERY_HIGH',
    statement: buildCareerNatalStatement(natalSupporting, []),
    evidenceIds: natalPromiseEvidenceIds,
    supportingEvidenceIds: natalSupporting.map((e) => e.id),
    challengingEvidenceIds: []
  });

  const dashaEvidence = evidence.filter(
    (e) => e.phase === 'DASHA_ACTIVATION' || e.source === 'DASHA'
  );
  const dashaSupporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const dashaPromiseLinks = ['CAREER_HP_10H'];
  const dashaEffect = evaluateCareerDashaEffect(dashaEvidence, dashaPromiseLinks);

  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: true,
    effect: dashaEffect,
    strength: 'STRONG',
    confidence: 'HIGH',
    statement: buildCareerDashaStatement(dashaEvidence, dashaEffect),
    evidenceIds: dashaEvidence.map((e) => e.id),
    activatedPromiseEvidenceIds: dashaPromiseLinks
  });

  const timingActivations = [
    evaluateCareerTimingActivation('MD', dashaEvidence, natalPromiseEvidenceIds)
  ];

  const transitEvidence = evidence.filter(
    (e) => e.phase === 'TRANSIT_TRIGGER' || e.source === 'TRANSIT'
  );
  const transitPromiseLinks = ['CAREER_HP_10H'];
  const transitEffect = evaluateCareerTransitEffect(transitEvidence, transitPromiseLinks);

  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: true,
    effect: transitEffect,
    strength: 'STRONG',
    confidence: 'HIGH',
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
      strength: 'STRONG',
      confidence: 'HIGH',
      statement: buildD10Statement(d10Evidence, d10Relationship),
      evidenceIds: d10Evidence.map((e) => e.id)
    })
  ];

  const manifestations = deriveCareerManifestations(evidence);
  const conclusionData = buildCareerConclusionData(
    natalStrength,
    d10Relationship,
    timingActivations,
    transitTrigger,
    conflicts,
    manifestations,
    natalSupporting.map((e) => e.id),
    []
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: 'VERY_STRONG',
    confidence: 'VERY_HIGH',
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      'Executive career foundation remains robust under current transit friction.',
      d10Relationship,
      {
        timingActivations,
        conflicts,
        manifestations,
        conclusionData
      }
    ),
    primaryEvidenceIds: evidence.filter((e) => e.role === 'PRIMARY').map((e) => e.id),
    supportingEvidenceIds: evidence.filter((e) => e.polarity === 'SUPPORTING').map((e) => e.id),
    challengingEvidenceIds: evidence.filter((e) => e.polarity === 'CHALLENGING').map((e) => e.id),
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
