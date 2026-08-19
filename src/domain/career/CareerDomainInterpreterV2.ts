import type { Horoscope } from '../../types';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import {
  CareerEvidenceFamily,
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
  calculateEvidenceConfidence,
  detectDomainConflicts
} from '../interpretation';
import type {
  DomainEvidence,
  DomainInterpretation,
  DomainStrength,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect,
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
  const rawEvidence = legacyCareer.evidence;
  const evidence = buildCareerEvidence(rawEvidence);

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalSupporting = supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');

  const conflicts = detectDomainConflicts('CAREER', evidence);
  const hasVargaConflict = conflicts.some((c) => c.tier === 'PRIMARY_VS_VARGA');
  const hasPrimaryChallenge = conflicts.some((c) => c.tier === 'PRIMARY_VS_PRIMARY');

  const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
  const natalConfidence = calculateEvidenceConfidence(
    evidence.filter((item) => item.phase === 'NATAL_PROMISE'),
    {
      hasPrimaryChallenge,
      hasVargaConflict: false
    }
  );

  const natalPromise = createNatalPromise({
    domain: 'CAREER',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildCareerNatalStatement(
      supportingEvidence,
      challengingEvidence,
      legacyCareer.conclusion.summary
    ),
    evidenceIds: evidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id),
    supportingEvidenceIds: natalSupporting.map((item) => item.id),
    challengingEvidenceIds: natalChallenging.map((item) => item.id)
  });

  const dashaEvidence = evidence.filter(
    (item) => item.phase === 'DASHA_ACTIVATION'
  );
  const dashaSupporting = dashaEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const dashaChallenging = dashaEvidence.filter((item) => item.polarity === 'CHALLENGING');

  const rawDashaPromiseLinks = dashaEvidence.flatMap((item) => item.relatedEvidenceIds);
  const dashaPromiseEvidenceIds = Array.from(new Set(rawDashaPromiseLinks));
  const dashaEffect = evaluateDashaEffect(dashaEvidence, dashaPromiseEvidenceIds);

  const dashaActivation = createDashaActivation({
    domain: 'CAREER',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildCareerDashaStatement(dashaEvidence),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaPromiseEvidenceIds
  });

  const transitEvidence = evidence.filter(
    (item) => item.phase === 'TRANSIT_TRIGGER'
  );
  const transitSupporting = transitEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const transitChallenging = transitEvidence.filter((item) => item.polarity === 'CHALLENGING');

  const rawTransitPromiseLinks = transitEvidence.flatMap((item) => item.relatedEvidenceIds);
  const transitPromiseEvidenceIds = Array.from(new Set(rawTransitPromiseLinks));
  const transitEffect = evaluateTransitEffect(transitEvidence, transitPromiseEvidenceIds);

  const transitTrigger = createTransitTrigger({
    domain: 'CAREER',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(transitSupporting, transitChallenging),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildCareerTransitStatement(transitEvidence),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitPromiseEvidenceIds
  });

  const d10Evidence = evidence.filter((item) => item.source === 'D10');
  const d10Relationship = evaluateD10Relationship(rawEvidence, legacyCareer.metadata?.vargaConfirmationStatus);

  const vargaConfirmations: readonly VargaConfirmation[] = [
    createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: d10Relationship,
      strength: calculateVargaStrength(evidence, 'D10'),
      confidence: calculateEvidenceConfidence(d10Evidence),
      statement: buildD10Statement(d10Evidence, d10Relationship),
      evidenceIds: d10Evidence.map((item) => item.id)
    })
  ];

  const manifestations = buildCareerManifestations(rawEvidence, evidence);

  // Conclusion strength logic with D10 downgrade handling and hierarchy preservation
  const conclusionStrength = resolveCareerConclusionStrength(
    natalStrength,
    d10Relationship,
    conflicts
  );

  const conclusion = createDomainConclusion({
    domain: 'CAREER',
    strength: conclusionStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      hasVargaConflict,
      hasPrimaryChallenge
    }),
    statement: buildCareerConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      vargaConfirmations,
      legacyCareer.conclusion.summary,
      d10Relationship
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
    conflicts,
    conclusion
  });
}

export function buildCareerEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly DomainEvidence[] {
  return rawEvidence.map((item) => {
    const role = mapCareerRole(item);
    const relatedEvidenceIds = resolveRelatedCareerPromiseEvidenceIds(item, rawEvidence);

    return createDomainEvidence({
      id: item.id,
      domain: 'CAREER',
      role,
      phase: mapCareerPhase(item),
      source: mapCareerSource(item),
      statement: item.statement,
      polarity: mapCareerPolarity(item.effect),
      strength: mapCareerStrength(item.strength),
      priority: mapCareerPriority(item.priority),
      ruleId: item.ruleId,
      relatedEvidenceIds
    });
  });
}

export function mapCareerRole(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidenceRole {
  if (item.priority === 'PRIMARY') {
    return 'PRIMARY';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === CareerEvidenceFamily.D10 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'CONFIRMATION';
  }
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
    item.dimension === 'TIMING'
  ) {
    return 'TIMING';
  }
  if (item.dimension === 'MODIFIER') {
    return 'MODIFIER';
  }
  if (item.priority === 'SECONDARY') {
    return 'SECONDARY';
  }
  return 'SECONDARY';
}

export function resolveRelatedCareerPromiseEvidenceIds(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>,
  allRawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly string[] {
  const structuralItems = allRawEvidence.filter(
    (e) =>
      e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.SECOND_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.SECOND_LORD ||
      e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
      e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD ||
      (e.priority === 'PRIMARY' && e.dimension !== 'TIMING' && !e.vargaEvidence)
  );

  if (structuralItems.length === 0) {
    return [];
  }

  // If item is D10 varga confirmation, link to 10th house / 10th lord structural items
  if (
    item.evidenceFamily === CareerEvidenceFamily.D10 ||
    item.vargaEvidence?.varga === 'D10'
  ) {
    const tenthItems = structuralItems.filter(
      (e) =>
        e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
        e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD ||
        e.priority === 'PRIMARY'
    );
    return tenthItems.length > 0
      ? tenthItems.map((e) => e.id)
      : structuralItems.slice(0, 2).map((e) => e.id);
  }

  // If item is Dasha timing, link to participating houses/planets
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
    item.dimension === 'TIMING'
  ) {
    const timingHouses = item.timingEvidence?.houses ?? [];
    if (timingHouses.length > 0) {
      const houseMatches = structuralItems.filter(
        (e) =>
          (timingHouses.includes(10) &&
            (e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD)) ||
          (timingHouses.includes(6) &&
            (e.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD)) ||
          (timingHouses.includes(2) &&
            (e.evidenceFamily === CareerEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.SECOND_LORD)) ||
          (timingHouses.includes(11) &&
            (e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD))
      );
      if (houseMatches.length > 0) {
        return houseMatches.map((e) => e.id);
      }
    }

    // Default dasha link to primary structural factors
    return structuralItems
      .filter((e) => e.priority === 'PRIMARY')
      .map((e) => e.id);
  }

  return [];
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

export function evaluateDashaEffect(
  dashaEvidence: readonly DomainEvidence[],
  activatedPromiseEvidenceIds?: readonly string[]
): TimingActivationEffect {
  if (dashaEvidence.length === 0) {
    return 'DOES_NOT_ACTIVATE';
  }
  const linkedPromiseIds = activatedPromiseEvidenceIds
    ? new Set(activatedPromiseEvidenceIds)
    : new Set(dashaEvidence.flatMap((e) => e.relatedEvidenceIds));

  if (linkedPromiseIds.size === 0) {
    return 'UNKNOWN';
  }

  const hasSupport = dashaEvidence.some((e) => e.polarity === 'SUPPORTING');
  const hasChallenge = dashaEvidence.some((e) => e.polarity === 'CHALLENGING');

  if (hasSupport && !hasChallenge) {
    return 'ACTIVATES';
  }
  if (hasSupport && hasChallenge) {
    return 'PARTIALLY_ACTIVATES';
  }
  if (hasChallenge && !hasSupport) {
    return 'CHALLENGES';
  }
  return 'ACTIVATES';
}

export function evaluateTransitEffect(
  transitEvidence: readonly DomainEvidence[],
  triggeredPromiseEvidenceIds?: readonly string[]
): TransitTriggerEffect {
  if (transitEvidence.length === 0) {
    return 'NO_MATERIAL_TRIGGER';
  }
  const linkedPromiseIds = triggeredPromiseEvidenceIds
    ? new Set(triggeredPromiseEvidenceIds)
    : new Set(transitEvidence.flatMap((e) => e.relatedEvidenceIds));

  if (linkedPromiseIds.size === 0) {
    return 'UNKNOWN';
  }

  const hasSupport = transitEvidence.some((e) => e.polarity === 'SUPPORTING');
  const hasChallenge = transitEvidence.some((e) => e.polarity === 'CHALLENGING');

  if (hasSupport && !hasChallenge) {
    return 'TRIGGER';
  }
  if (hasSupport && hasChallenge) {
    return 'MODIFIER';
  }
  if (hasChallenge && !hasSupport) {
    return 'CHALLENGE';
  }
  return 'TRIGGER';
}

export function evaluateD10Relationship(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[],
  legacyStatus?: string
): VargaRelationship {
  const d10Item = rawEvidence.find(
    (e) =>
      e.evidenceFamily === CareerEvidenceFamily.D10 ||
      e.vargaEvidence?.varga === 'D10'
  );

  if (d10Item?.vargaEvidence?.relationship) {
    return d10Item.vargaEvidence.relationship as VargaRelationship;
  }

  if (legacyStatus === 'CONFIRMED') {
    return 'CONFIRMS';
  }
  if (legacyStatus === 'CONFLICTED') {
    return 'CONFLICTS';
  }
  if (legacyStatus === 'NOT_APPLICABLE') {
    return 'UNAVAILABLE';
  }

  if (d10Item) {
    if (d10Item.effect === 'SUPPORT') {
      return 'CONFIRMS';
    }
    if (d10Item.effect === 'CHALLENGE') {
      return 'CONFLICTS';
    }
    return 'MODIFIES';
  }

  return 'UNAVAILABLE';
}

export function resolveCareerConclusionStrength(
  natalStrength: DomainStrength,
  d10Relationship: VargaRelationship,
  conflicts: readonly import('../interpretation').DomainConflict[]
): DomainStrength {
  // If D10 conflicts, apply downgrade
  if (d10Relationship === 'CONFLICTS') {
    if (natalStrength === 'VERY_STRONG') {
      return 'STRONG';
    }
    if (natalStrength === 'STRONG') {
      return 'MODERATE';
    }
    if (natalStrength === 'MODERATE') {
      return 'MIXED';
    }
  }

  // Hierarchy rule: If only transit conflict exists and natal promise is strong, do NOT collapse to generic MIXED
  const hasOnlyTransitConflict =
    conflicts.length > 0 &&
    conflicts.every((c) => c.tier === 'PRIMARY_VS_TRANSIT' || c.tier === 'PRIMARY_VS_TIMING');
  if (hasOnlyTransitConflict && (natalStrength === 'STRONG' || natalStrength === 'VERY_STRONG')) {
    return natalStrength;
  }

  return natalStrength;
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
  d10Evidence: readonly DomainEvidence[],
  relationship: VargaRelationship
): string {
  if (relationship === 'UNAVAILABLE' || d10Evidence.length === 0) {
    return 'D10 divisional analysis unavailable or neutral.';
  }
  if (relationship === 'CONFIRMS') {
    return 'D10 Dasamsa confirms and elevates professional execution and status.';
  }
  if (relationship === 'CONFLICTS') {
    return 'D10 Dasamsa diverges from natal promise, indicating execution friction in career realization.';
  }
  if (relationship === 'MODIFIES') {
    return 'D10 Dasamsa modifies the career orientation toward specialized divisional roles.';
  }
  return 'D10 Dasamsa partially confirms career execution.';
}

export function buildCareerManifestations(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[],
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];

  // Deterministic manifestation mapping via CareerEvidenceFamily and ruleIds
  const hasLeadership = rawEvidence.some(
    (item) =>
      item.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE ||
      item.evidenceFamily === CareerEvidenceFamily.TENTH_LORD ||
      item.evidenceFamily === CareerEvidenceFamily.SUN ||
      item.evidenceFamily === CareerEvidenceFamily.JUPITER ||
      item.evidenceFamily === CareerEvidenceFamily.YOGA ||
      item.ruleId?.includes('10th') ||
      item.ruleId?.includes('sun') ||
      item.ruleId?.includes('raja_yoga')
  );

  const hasEmployment = rawEvidence.some(
    (item) =>
      item.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
      item.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD ||
      item.evidenceFamily === CareerEvidenceFamily.SATURN ||
      item.ruleId?.includes('6th') ||
      item.ruleId?.includes('saturn') ||
      item.ruleId?.includes('service')
  );

  const hasTechnical = rawEvidence.some(
    (item) =>
      item.evidenceFamily === CareerEvidenceFamily.MERCURY ||
      item.evidenceFamily === CareerEvidenceFamily.MARS ||
      item.ruleId?.includes('mercury') ||
      item.ruleId?.includes('mars') ||
      item.ruleId?.includes('analytical')
  );

  const hasIndependent = rawEvidence.some(
    (item) =>
      item.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
      item.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD ||
      item.ruleId?.includes('11th') ||
      item.ruleId?.includes('3rd') ||
      item.ruleId?.includes('entrepreneur')
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
  legacySummary?: string,
  d10Relationship?: VargaRelationship
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
  if (d10 && d10.relationship === 'CONFIRMS') {
    parts.push(d10.statement);
  } else if (d10 && d10.relationship === 'CONFLICTS') {
    parts.push(d10.statement);
  }

  return parts.join(' ');
}

