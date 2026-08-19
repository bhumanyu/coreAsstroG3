import type { Horoscope } from '../../types';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import {
  WealthEvidenceFamily,
  type WealthSubthemeKey,
  type WealthSubthemeSummary
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
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

export function interpretWealthV2(
  horoscope: Horoscope
): DomainInterpretation {
  const legacyWealth = interpretWealthTheme(horoscope);
  const rawEvidence = legacyWealth.evidence;
  const evidence = buildWealthEvidence(rawEvidence);

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalSupporting = supportingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challengingEvidence.filter((e) => e.phase === 'NATAL_PROMISE');

  const conflicts = detectDomainConflicts('WEALTH', evidence);
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
    domain: 'WEALTH',
    strength: natalStrength,
    confidence: natalConfidence,
    statement: buildWealthNatalStatement(
      evidence,
      legacyWealth.conclusion.summary
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
  const dashaEffect = evaluateDashaEffect(dashaEvidence);

  const rawDashaPromiseLinks = dashaEvidence.flatMap((item) => item.relatedEvidenceIds);
  const dashaPromiseEvidenceIds =
    rawDashaPromiseLinks.length > 0
      ? Array.from(new Set(rawDashaPromiseLinks))
      : dashaEvidence.length > 0 && natalPromise.evidenceIds.length > 0
        ? natalPromise.evidenceIds.slice(0, 2)
        : [];

  const dashaActivation = createDashaActivation({
    domain: 'WEALTH',
    active: dashaEvidence.length > 0,
    effect: dashaEffect,
    strength: calculateDomainStrength(dashaSupporting, dashaChallenging),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildWealthDashaStatement(evidence),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaPromiseEvidenceIds
  });

  const transitEvidence = evidence.filter(
    (item) => item.phase === 'TRANSIT_TRIGGER'
  );
  const transitSupporting = transitEvidence.filter((item) => item.polarity === 'SUPPORTING');
  const transitChallenging = transitEvidence.filter((item) => item.polarity === 'CHALLENGING');
  const transitEffect = evaluateTransitEffect(transitEvidence);

  const rawTransitPromiseLinks = transitEvidence.flatMap((item) => item.relatedEvidenceIds);
  const transitPromiseEvidenceIds =
    rawTransitPromiseLinks.length > 0
      ? Array.from(new Set(rawTransitPromiseLinks))
      : transitEvidence.length > 0 && natalPromise.evidenceIds.length > 0
        ? natalPromise.evidenceIds.slice(0, 2)
        : [];

  const transitTrigger = createTransitTrigger({
    domain: 'WEALTH',
    active: transitEvidence.length > 0,
    effect: transitEffect,
    strength: calculateDomainStrength(transitSupporting, transitChallenging),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildWealthTransitStatement(evidence),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitPromiseEvidenceIds
  });

  const d2Evidence = evidence.filter((item) => item.source === 'D2');
  const d2Relationship = evaluateD2Relationship(rawEvidence, legacyWealth.metadata?.vargaConfirmationStatus);

  const vargaConfirmations: readonly VargaConfirmation[] = d2Evidence.length > 0
    ? [
        createVargaConfirmation({
          domain: 'WEALTH',
          varga: 'D2',
          relationship: d2Relationship,
          strength: calculateDomainStrength(
            d2Evidence.filter((e) => e.polarity === 'SUPPORTING'),
            d2Evidence.filter((e) => e.polarity === 'CHALLENGING')
          ),
          confidence: calculateEvidenceConfidence(d2Evidence),
          statement: d2Relationship === 'CONFIRMS'
            ? 'D2 Hora confirms liquid wealth potential.'
            : 'D2 Hora indicates financial caution.',
          evidenceIds: d2Evidence.map((item) => item.id)
        })
      ]
    : [];

  const manifestations = buildWealthManifestations(
    rawEvidence,
    evidence,
    legacyWealth.subthemes
  );

  const conclusionStrength = resolveWealthConclusionStrength(
    natalStrength,
    d2Relationship,
    conflicts
  );

  const conclusion = createDomainConclusion({
    domain: 'WEALTH',
    strength: conclusionStrength,
    confidence: calculateEvidenceConfidence(evidence, {
      hasVargaConflict,
      hasPrimaryChallenge
    }),
    statement: buildWealthConclusion(
      natalPromise,
      dashaActivation,
      transitTrigger,
      legacyWealth.conclusion.summary
    ),
    primaryEvidenceIds: evidence
      .filter((item) => item.priority >= 90)
      .map((item) => item.id),
    supportingEvidenceIds: supportingEvidence.map((item) => item.id),
    challengingEvidenceIds: challengingEvidence.map((item) => item.id),
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
    conclusion
  });
}

export function buildWealthEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly DomainEvidence[] {
  return rawEvidence.map((item) => {
    const role = mapWealthRole(item);
    const relatedEvidenceIds = resolveRelatedWealthPromiseEvidenceIds(item, rawEvidence);

    return createDomainEvidence({
      id: item.id,
      domain: 'WEALTH',
      role,
      phase: mapWealthPhase(item),
      source: mapWealthSource(item),
      statement: item.statement,
      polarity: mapWealthPolarity(item.effect),
      strength: mapWealthStrength(item.strength),
      priority: mapWealthPriority(item.priority),
      ruleId: item.ruleId,
      relatedEvidenceIds
    });
  });
}

export function mapWealthRole(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
): EvidenceRole {
  if (item.priority === 'PRIMARY') {
    return 'PRIMARY';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === WealthEvidenceFamily.D2 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'CONFIRMATION';
  }
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    item.evidenceFamily === WealthEvidenceFamily.TRANSIT ||
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

export function resolveRelatedWealthPromiseEvidenceIds(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>,
  allRawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly string[] {
  const structuralItems = allRawEvidence.filter(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD ||
      e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
      e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD ||
      (e.priority === 'PRIMARY' && e.dimension !== 'TIMING' && !e.vargaEvidence)
  );

  if (structuralItems.length === 0) {
    return [];
  }

  // D2 Hora confirmation links to 2nd house / 2nd lord
  if (
    item.evidenceFamily === WealthEvidenceFamily.D2 ||
    (item.vargaEvidence as any)?.varga === 'D2'
  ) {
    const secondItems = structuralItems.filter(
      (e) =>
        e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
        e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD ||
        e.priority === 'PRIMARY'
    );
    return secondItems.length > 0
      ? secondItems.map((e) => e.id)
      : structuralItems.slice(0, 2).map((e) => e.id);
  }

  // Dasha or Transit timing
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    item.evidenceFamily === WealthEvidenceFamily.TRANSIT ||
    item.dimension === 'TIMING'
  ) {
    const timingHouses = item.timingEvidence?.houses ?? [];
    if (timingHouses.length > 0) {
      const houseMatches = structuralItems.filter(
        (e) =>
          (timingHouses.includes(2) &&
            (e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD)) ||
          (timingHouses.includes(11) &&
            (e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD)) ||
          (timingHouses.includes(9) &&
            (e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD)) ||
          (timingHouses.includes(5) &&
            (e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
              e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD))
      );
      if (houseMatches.length > 0) {
        return houseMatches.map((e) => e.id);
      }
    }

    return structuralItems
      .filter((e) => e.priority === 'PRIMARY')
      .map((e) => e.id);
  }

  return [];
}

export function mapWealthPhase(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
): EvidencePhase {
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    item.dimension === 'TIMING'
  ) {
    return 'DASHA_ACTIVATION';
  }
  if (item.evidenceFamily === WealthEvidenceFamily.TRANSIT) {
    return 'TRANSIT_TRIGGER';
  }
  if (
    item.evidenceFamily === WealthEvidenceFamily.D2 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'VARGA_CONFIRMATION';
  }
  if (item.dimension === 'MODIFIER') {
    return 'MODIFIER';
  }
  return 'NATAL_PROMISE';
}

export function mapWealthSource(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
): EvidenceSource {
  if (item.evidenceFamily === WealthEvidenceFamily.D2) {
    return 'D2';
  }
  if (item.evidenceFamily === WealthEvidenceFamily.DASHA) {
    return 'DASHA';
  }
  if (item.evidenceFamily === WealthEvidenceFamily.TRANSIT) {
    return 'TRANSIT';
  }
  return 'D1';
}

export function mapWealthPolarity(
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

export function mapWealthStrength(
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

export function mapWealthPriority(
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
  dashaEvidence: readonly DomainEvidence[]
): TimingActivationEffect {
  if (dashaEvidence.length === 0) {
    return 'DOES_NOT_ACTIVATE';
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
  transitEvidence: readonly DomainEvidence[]
): TransitTriggerEffect {
  if (transitEvidence.length === 0) {
    return 'NO_MATERIAL_TRIGGER';
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

export function evaluateD2Relationship(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[],
  legacyStatus?: string
): VargaRelationship {
  const d2Item = rawEvidence.find(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.D2 ||
      (e.vargaEvidence as any)?.varga === 'D2'
  );

  if (d2Item?.vargaEvidence?.relationship) {
    return d2Item.vargaEvidence.relationship as VargaRelationship;
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

  if (d2Item) {
    if (d2Item.effect === 'SUPPORT') {
      return 'CONFIRMS';
    }
    if (d2Item.effect === 'CHALLENGE') {
      return 'CONFLICTS';
    }
    return 'MODIFIES';
  }

  return 'UNAVAILABLE';
}

export function resolveWealthConclusionStrength(
  natalStrength: DomainStrength,
  d2Relationship: VargaRelationship,
  conflicts: readonly import('../interpretation').DomainConflict[]
): DomainStrength {
  if (d2Relationship === 'CONFLICTS') {
    if (natalStrength === 'VERY_STRONG') return 'STRONG';
    if (natalStrength === 'STRONG') return 'MODERATE';
    if (natalStrength === 'MODERATE') return 'MIXED';
  }

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

export function buildWealthNatalStatement(
  evidence: readonly DomainEvidence[],
  legacySummary?: string
): string {
  const natalSupporting = evidence.filter(
    (e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'SUPPORTING'
  );
  const natalChallenging = evidence.filter(
    (e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'CHALLENGING'
  );

  if (natalSupporting.length > 0 && natalChallenging.length === 0) {
    return `Natal wealth structure shows ${natalSupporting.length} positive financial indications.`;
  }
  if (natalSupporting.length > 0 && natalChallenging.length > 0) {
    return `Natal wealth structure presents mixed financial potential with ${natalSupporting.length} supporting and ${natalChallenging.length} challenging factors.`;
  }
  if (natalChallenging.length > 0) {
    return `Natal wealth indications suggest financial prudence and expenditure management.`;
  }
  return legacySummary || 'Natal wealth promise evaluation is complete.';
}

export function buildWealthDashaStatement(
  evidence: readonly DomainEvidence[]
): string {
  const dashaEvidence = evidence.filter((e) => e.phase === 'DASHA_ACTIVATION');
  if (dashaEvidence.length === 0) {
    return 'No active wealth Dasha activation identified.';
  }
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return 'Current Dasha period actively supports wealth generation and financial inflow.';
  }
  return 'Current Dasha period indicates financial consolidation or expenditure trends.';
}

export function buildWealthTransitStatement(
  evidence: readonly DomainEvidence[]
): string {
  const transitEvidence = evidence.filter((e) => e.phase === 'TRANSIT_TRIGGER');
  if (transitEvidence.length === 0) {
    return 'No material transit trigger identified.';
  }
  return 'Transit triggers are active for financial developments.';
}

export function buildWealthManifestations(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[],
  evidence: readonly DomainEvidence[],
  subthemes?: Readonly<Partial<Record<WealthSubthemeKey, WealthSubthemeSummary>>>
): readonly DomainManifestation[] {
  const modes: readonly { mode: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION'; families: readonly WealthEvidenceFamily[] }[] = [
    {
      mode: 'ACCUMULATION',
      families: [WealthEvidenceFamily.SECOND_HOUSE, WealthEvidenceFamily.SECOND_LORD, WealthEvidenceFamily.D2]
    },
    {
      mode: 'GAINS',
      families: [WealthEvidenceFamily.ELEVENTH_HOUSE, WealthEvidenceFamily.ELEVENTH_LORD]
    },
    {
      mode: 'FORTUNE',
      families: [WealthEvidenceFamily.NINTH_HOUSE, WealthEvidenceFamily.NINTH_LORD]
    },
    {
      mode: 'SPECULATION',
      families: [WealthEvidenceFamily.FIFTH_HOUSE, WealthEvidenceFamily.FIFTH_LORD]
    }
  ];

  return Object.freeze(
    modes.map(({ mode, families }) => {
      const subthemeKey = mode as WealthSubthemeKey;
      const subtheme = subthemes?.[subthemeKey];

      let statement: string;
      let confidence: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';

      if (subtheme) {
        statement = subtheme.summaryStatement;
        switch (subtheme.status) {
          case 'SUPPORT':
            confidence = 'HIGH';
            break;
          case 'CHALLENGE':
            confidence = 'MODERATE';
            break;
          case 'MIXED':
            confidence = 'MODERATE';
            break;
          default:
            confidence = 'LOW';
            break;
        }
      } else {
        switch (mode) {
          case 'ACCUMULATION':
            statement = 'Liquid assets, savings capacity, and family wealth resources.';
            confidence = 'MODERATE';
            break;
          case 'GAINS':
            statement = 'Income generation, business revenues, and social network gains.';
            confidence = 'MODERATE';
            break;
          case 'FORTUNE':
            statement = 'Long-term prosperity, luck, and hereditary or unearned fortune.';
            confidence = 'MODERATE';
            break;
          case 'SPECULATION':
            statement = 'Risk-taking, investments, intellectual assets, and market speculation.';
            confidence = 'MODERATE';
            break;
          default:
            statement = `${mode} financial manifestation track.`;
            confidence = 'LOW';
            break;
        }
      }

      // Gather evidence matching this manifestation mode by family
      const matchingRawIds = rawEvidence
        .filter((raw) => families.includes(raw.evidenceFamily))
        .map((raw) => raw.id);

      const relevantEvidenceIds = evidence
        .filter((e) => matchingRawIds.includes(e.id))
        .map((e) => e.id);

      return createDomainManifestation({
        mode,
        confidence,
        statement,
        evidenceIds: relevantEvidenceIds
      });
    })
  );
}

export function buildWealthConclusion(
  natalPromise: NatalPromise,
  dashaActivation: DashaActivation,
  transitTrigger: TransitTrigger,
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

  if (transitTrigger.active) {
    parts.push(transitTrigger.statement);
  }

  return parts.join(' ');
}

