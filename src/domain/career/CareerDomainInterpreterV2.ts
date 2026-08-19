import type { Horoscope } from '../../types';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import {
  CareerEvidenceFamily,
  type CareerEvidence,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import {
  buildDomainInterpretation,
  createDomainEvidence,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createVargaConfirmation,
  createDomainConclusion,
  createDomainManifestation,
  calculateEvidenceConfidence
} from '../interpretation';
import type {
  DomainEvidence,
  DomainInterpretation,
  DomainStrength,
  EvidencePhase,
  EvidencePolarity,
  EvidenceSource,
  EvidenceStrength,
  ManifestationMode,
  DomainManifestation,
  NatalPromise,
  DashaActivation,
  TransitTrigger,
  VargaConfirmation
} from '../interpretation';

export function interpretCareerV2(
  horoscope: Horoscope
): DomainInterpretation {
  const legacyCareer = interpretCareerTheme(horoscope);
  const evidence = buildCareerEvidence(legacyCareer.evidence);

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: calculateDomainStrength(
      supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE'),
      challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE')
    ),
    confidence: calculateEvidenceConfidence(
      supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE')
    ),
    statement: buildCareerNatalStatement(
      supportingEvidence,
      challengingEvidence,
      legacyCareer.conclusion.summary
    ),
    evidenceIds: evidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id),
    supportingEvidenceIds: supportingEvidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id),
    challengingEvidenceIds: challengingEvidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id)
  });

  const dashaEvidence = evidence.filter(
    (item) => item.phase === 'DASHA_ACTIVATION'
  );
  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: dashaEvidence.length > 0,
    strength: calculateDomainStrength(
      dashaEvidence.filter((item) => item.polarity === 'SUPPORTING'),
      dashaEvidence.filter((item) => item.polarity === 'CHALLENGING')
    ),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildCareerDashaStatement(dashaEvidence),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaEvidence.flatMap(
      (item) => item.relatedEvidenceIds
    )
  });

  const transitEvidence = evidence.filter(
    (item) => item.phase === 'TRANSIT_TRIGGER'
  );
  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: transitEvidence.length > 0,
    strength: calculateDomainStrength(
      transitEvidence.filter((item) => item.polarity === 'SUPPORTING'),
      transitEvidence.filter((item) => item.polarity === 'CHALLENGING')
    ),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildCareerTransitStatement(transitEvidence),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitEvidence.flatMap(
      (item) => item.relatedEvidenceIds
    )
  });

  const d10Evidence = evidence.filter((item) => item.source === 'D10');
  const vargaConfirmations: readonly VargaConfirmation[] = [
    createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      confirmed: d10Evidence.some((item) => item.polarity === 'SUPPORTING'),
      strength: calculateVargaStrength(evidence, 'D10'),
      confidence: calculateEvidenceConfidence(d10Evidence),
      statement: buildD10Statement(d10Evidence),
      evidenceIds: d10Evidence.map((item) => item.id)
    })
  ];

  const manifestations = buildCareerManifestations(evidence);

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: natalPromise.strength,
    confidence: calculateEvidenceConfidence(evidence),
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      manifestations,
      legacyCareer.conclusion.summary
    ),
    primaryEvidenceIds: evidence
      .filter((item) => item.priority >= 90)
      .map((item) => item.id),
    supportingEvidenceIds: supportingEvidence.map((item) => item.id),
    challengingEvidenceIds: challengingEvidence.map((item) => item.id),
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
    conclusion
  });
}

export function buildCareerEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly DomainEvidence[] {
  return rawEvidence.map((item) =>
    createDomainEvidence({
      id: item.id,
      domain: 'CAREER',
      phase: mapCareerPhase(item),
      source: mapCareerSource(item),
      statement: item.statement,
      polarity: mapCareerPolarity(item.effect),
      strength: mapCareerStrength(item.strength),
      priority: mapCareerPriority(item.priority),
      ruleId: item.ruleId,
      relatedEvidenceIds: []
    })
  );
}

export function mapCareerPhase(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidencePhase {
  if (
    item.vargaEvidence ||
    item.evidenceFamily === CareerEvidenceFamily.D10 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'VARGA_CONFIRMATION';
  }
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
    item.dimension === 'TIMING'
  ) {
    return 'DASHA_ACTIVATION';
  }
  if (item.dimension === 'MODIFIER') {
    return 'MODIFIER';
  }
  return 'NATAL_PROMISE';
}

export function mapCareerSource(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidenceSource {
  if (
    item.vargaEvidence?.varga === 'D10' ||
    item.evidenceFamily === CareerEvidenceFamily.D10
  ) {
    return 'D10';
  }
  if (item.evidenceFamily === CareerEvidenceFamily.DASHA) {
    return 'DASHA';
  }
  return 'D1';
}

export function mapCareerPolarity(
  effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL'
): EvidencePolarity {
  switch (effect) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'NEUTRAL':
      return 'NEUTRAL';
  }
}

export function mapCareerStrength(
  strength: 'WEAK' | 'MODERATE' | 'STRONG'
): EvidenceStrength {
  switch (strength) {
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
  }
}

export function mapCareerPriority(
  priority: 'PRIMARY' | 'SECONDARY' | 'CONFIRMATORY' | 'TIMING'
): number {
  switch (priority) {
    case 'PRIMARY':
      return 90;
    case 'SECONDARY':
      return 70;
    case 'CONFIRMATORY':
      return 50;
    case 'TIMING':
      return 30;
  }
}

export function calculateDomainStrength(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[]
): DomainStrength {
  if (supporting.length === 0 && challenging.length === 0) {
    return 'UNDETERMINED';
  }

  const hasStrongSupport = supporting.some(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );
  const hasStrongChallenge = challenging.some(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );

  if (supporting.length > 0 && challenging.length > 0) {
    if (hasStrongSupport && !hasStrongChallenge && supporting.length >= 3) {
      return 'STRONG';
    }
    return 'MIXED';
  }

  if (supporting.length > 0 && challenging.length === 0) {
    if (hasStrongSupport && supporting.length >= 2) {
      return 'VERY_STRONG';
    }
    return 'STRONG';
  }

  if (challenging.length > 0 && supporting.length === 0) {
    if (hasStrongChallenge) {
      return 'VERY_WEAK';
    }
    return 'WEAK';
  }

  return 'MODERATE';
}

export function calculateVargaStrength(
  evidence: readonly DomainEvidence[],
  varga: EvidenceSource
): DomainStrength {
  const vargaEvidence = evidence.filter((e) => e.source === varga);
  const supporting = vargaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = vargaEvidence.filter((e) => e.polarity === 'CHALLENGING');

  return calculateDomainStrength(supporting, challenging);
}

export function buildCareerNatalStatement(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[],
  legacySummary?: string
): string {
  const natalSupporting = supporting.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challenging.filter((e) => e.phase === 'NATAL_PROMISE');

  if (natalSupporting.length > 0 && natalChallenging.length === 0) {
    return `Natal career promise is strongly indicated with ${natalSupporting.length} supporting structural factors.`;
  }
  if (natalSupporting.length > 0 && natalChallenging.length > 0) {
    return `Natal career promise presents mixed structural indications with ${natalSupporting.length} supporting and ${natalChallenging.length} challenging factors.`;
  }
  if (natalChallenging.length > 0) {
    return `Natal career promise faces structural challenges.`;
  }
  return legacySummary || 'Natal career promise evaluation is complete.';
}

export function buildCareerDashaStatement(
  dashaEvidence: readonly DomainEvidence[]
): string {
  if (dashaEvidence.length === 0) {
    return 'No active career Dasha activation identified.';
  }
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return `Current Dasha period actively supports career manifestations.`;
  }
  return `Current Dasha period indicates mixed or challenging timing for career initiatives.`;
}

export function buildCareerTransitStatement(
  transitEvidence: readonly DomainEvidence[]
): string {
  if (transitEvidence.length === 0) {
    return 'No material transit trigger identified.';
  }
  return `Transit triggers are currently influencing career timing.`;
}

export function buildD10Statement(
  d10Evidence: readonly DomainEvidence[]
): string {
  if (d10Evidence.length === 0) {
    return 'D10 divisional analysis unavailable or neutral.';
  }
  const supporting = d10Evidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return `D10 Dasamsa confirmation supports professional execution and status.`;
  }
  return `D10 Dasamsa reflects challenges in professional realization.`;
}

export function buildCareerManifestations(
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];

  const supportingStatements = evidence
    .filter((e) => e.polarity === 'SUPPORTING')
    .map((e) => e.statement.toLowerCase());

  const hasLeadership = supportingStatements.some(
    (s) => s.includes('leadership') || s.includes('sun') || s.includes('authority') || s.includes('10th')
  );
  const hasEmployment = supportingStatements.some(
    (s) => s.includes('service') || s.includes('6th') || s.includes('saturn') || s.includes('work')
  );
  const hasTechnical = supportingStatements.some(
    (s) => s.includes('mercury') || s.includes('mars') || s.includes('intellectual') || s.includes('skill')
  );
  const hasIndependent = supportingStatements.some(
    (s) => s.includes('entrepreneur') || s.includes('independent') || s.includes('3rd')
  );

  manifestations.push(
    createDomainManifestation({
      mode: 'LEADERSHIP',
      confidence: hasLeadership ? 'HIGH' : 'MODERATE',
      statement: hasLeadership
        ? 'Strong potential for leadership, executive authority, and organizational visibility.'
        : 'Moderate potential for leadership roles depending on timing.',
      evidenceIds: evidence
        .filter((e) => e.priority >= 70 && e.polarity === 'SUPPORTING')
        .map((e) => e.id)
    })
  );

  manifestations.push(
    createDomainManifestation({
      mode: 'EMPLOYMENT',
      confidence: hasEmployment ? 'HIGH' : 'MODERATE',
      statement: hasEmployment
        ? 'Structured professional employment and service career pathways are well supported.'
        : 'Standard employment tracks operate as secondary or supplementary avenues.',
      evidenceIds: evidence
        .filter((e) => e.priority >= 50 && e.polarity === 'SUPPORTING')
        .map((e) => e.id)
    })
  );

  manifestations.push(
    createDomainManifestation({
      mode: 'TECHNICAL_SPECIALIZATION',
      confidence: hasTechnical ? 'HIGH' : 'MODERATE',
      statement: hasTechnical
        ? 'High suitability for analytical, technical, or specialized domain mastery.'
        : 'General professional domain application without strict technical constraints.',
      evidenceIds: evidence
        .filter((e) => e.priority >= 50)
        .map((e) => e.id)
    })
  );

  if (hasIndependent) {
    manifestations.push(
      createDomainManifestation({
        mode: 'ENTREPRENEURSHIP',
        confidence: 'MODERATE',
        statement: 'Supportive planetary configurations for independent enterprise and self-directed ventures.',
        evidenceIds: evidence
          .filter((e) => e.polarity === 'SUPPORTING')
          .map((e) => e.id)
      })
    );
  }

  return Object.freeze(manifestations);
}

export function buildCareerConclusion(
  natalPromise: NatalPromise,
  dashaActivation: DashaActivation,
  transitTrigger: TransitTrigger,
  vargaConfirmations: readonly VargaConfirmation[],
  manifestations: readonly DomainManifestation[],
  legacySummary?: string
): string {
  const parts: string[] = [];

  if (legacySummary) {
    parts.push(legacySummary);
  } else {
    parts.push(natalPromise.statement);
  }

  if (dashaActivation.active) {
    parts.push(dashaActivation.statement);
  }

  const d10 = vargaConfirmations.find((v) => v.varga === 'D10');
  if (d10 && d10.confirmed) {
    parts.push(d10.statement);
  }

  return parts.join(' ');
}
