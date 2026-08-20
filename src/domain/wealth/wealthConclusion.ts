import type {
  DomainEvidence,
  DomainStrength,
  EvidenceSource,
  VargaRelationship,
  NatalPromise,
  DashaActivation,
  TransitTrigger,
  VargaConfirmation,
  DomainConflict,
  DomainManifestation,
  TimingActivationEffect,
  TransitTriggerEffect
} from '../interpretation';
import type {
  WealthDimension,
  WealthDimensionStatus,
  WealthDimensionInterpretation,
  WealthConclusionData,
  WealthManifestationMode
} from './wealthTypes';

export function resolveWealthConclusionStrength(
  natalStrength: DomainStrength,
  d2Relationship: VargaRelationship,
  conflicts: readonly DomainConflict[]
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

export function calculateVargaStrength(
  evidence: readonly DomainEvidence[],
  varga: EvidenceSource
): DomainStrength {
  const vargaEvidence = evidence.filter((e) => e.source === varga);
  const supporting = vargaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = vargaEvidence.filter((e) => e.polarity === 'CHALLENGING');

  return calculateDomainStrength(supporting, challenging);
}

export function buildWealthHeadline(
  conclusion: {
    readonly overallStatus: WealthDimensionStatus;
    readonly accumulationStatus: WealthDimensionStatus;
    readonly gainsStatus: WealthDimensionStatus;
    readonly fortuneStatus?: WealthDimensionStatus;
    readonly speculationStatus: WealthDimensionStatus;
  }
): string {
  if (
    conclusion.accumulationStatus === 'STRONGLY_SUPPORTED' &&
    conclusion.gainsStatus === 'STRONGLY_SUPPORTED'
  ) {
    return 'Wealth potential is strongly supported through accumulation and gains.';
  }

  if (conclusion.speculationStatus === 'CHALLENGED') {
    return 'Wealth is better supported through structured accumulation and gains than through speculation.';
  }

  if (conclusion.overallStatus === 'STRONGLY_SUPPORTED') {
    return 'Wealth potential is strongly supported across primary financial dimensions.';
  }

  if (conclusion.overallStatus === 'SUPPORTED') {
    return 'Wealth potential is supported with stable accumulation and growth indications.';
  }

  if (conclusion.overallStatus === 'CHALLENGED') {
    return 'Wealth indications require disciplined financial management and consolidation.';
  }

  return 'Wealth indicators are mixed across the major dimensions.';
}

export function buildWealthConclusionData(params: {
  readonly overallStatus: WealthDimensionStatus;
  readonly dimensions: readonly WealthDimensionInterpretation[];
  readonly d2Relationship: VargaRelationship;
  readonly manifestations: readonly DomainManifestation[];
  readonly conflicts: readonly DomainConflict[];
  readonly evidence: readonly DomainEvidence[];
}): WealthConclusionData {
  const {
    overallStatus,
    dimensions,
    d2Relationship,
    manifestations,
    evidence
  } = params;

  const getDim = (dimName: WealthDimension): WealthDimensionInterpretation | undefined =>
    dimensions.find((d) => d.dimension === dimName);

  const accumulation = getDim('ACCUMULATION');
  const gains = getDim('GAINS');
  const fortune = getDim('FORTUNE');
  const speculation = getDim('SPECULATION');

  const accumulationStatus = accumulation?.status ?? 'INSUFFICIENT_DATA';
  const gainsStatus = gains?.status ?? 'INSUFFICIENT_DATA';
  const fortuneStatus = fortune?.status ?? 'INSUFFICIENT_DATA';
  const speculationStatus = speculation?.status ?? 'INSUFFICIENT_DATA';

  const accumulationDashaEffect = accumulation?.dashaEffect ?? 'DOES_NOT_ACTIVATE';
  const gainsDashaEffect = gains?.dashaEffect ?? 'DOES_NOT_ACTIVATE';
  const fortuneDashaEffect = fortune?.dashaEffect ?? 'DOES_NOT_ACTIVATE';
  const speculationDashaEffect = speculation?.dashaEffect ?? 'DOES_NOT_ACTIVATE';

  const supporting = evidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = evidence.filter((e) => e.polarity === 'CHALLENGING');

  const mainStrengths: string[] = [];
  if (accumulationStatus === 'STRONGLY_SUPPORTED' || accumulationStatus === 'SUPPORTED') {
    mainStrengths.push('Solid accumulation and liquid savings capacity');
  }
  if (gainsStatus === 'STRONGLY_SUPPORTED' || gainsStatus === 'SUPPORTED') {
    mainStrengths.push('Strong revenue and income generation channels');
  }
  if (fortuneStatus === 'STRONGLY_SUPPORTED' || fortuneStatus === 'SUPPORTED') {
    mainStrengths.push('Auspicious fortune and long-term prosperity support');
  }

  const mainChallenges: string[] = [];
  if (speculationStatus === 'CHALLENGED') {
    mainChallenges.push('Speculative indicators show weakness; avoid high-risk trading');
  }
  if (accumulationStatus === 'CHALLENGED') {
    mainChallenges.push('Accumulation requires strict expenditure control');
  }
  if (d2Relationship === 'CONFLICTS') {
    mainChallenges.push('D2 Hora indicates execution friction in asset retention');
  }

  const highManifestations = manifestations
    .filter((m) => m.confidence === 'VERY_HIGH' || m.confidence === 'HIGH')
    .map((m) => m.mode as WealthManifestationMode);

  const dominantManifestations = highManifestations.length > 0
    ? highManifestations
    : manifestations.length > 0
    ? [manifestations[0].mode as WealthManifestationMode]
    : [];

  const headline = buildWealthHeadline({
    overallStatus,
    accumulationStatus,
    gainsStatus,
    fortuneStatus,
    speculationStatus
  });

  return Object.freeze({
    overallStatus,
    accumulationStatus,
    gainsStatus,
    fortuneStatus,
    speculationStatus,
    mainStrengths: Object.freeze(mainStrengths),
    mainChallenges: Object.freeze(mainChallenges),
    d2Relationship,
    accumulationDashaEffect,
    gainsDashaEffect,
    fortuneDashaEffect,
    speculationDashaEffect,
    dominantManifestations: Object.freeze(dominantManifestations),
    headline,
    supportingEvidenceIds: Object.freeze(supporting.map((e) => e.id)),
    challengingEvidenceIds: Object.freeze(challenging.map((e) => e.id))
  });
}

export function buildWealthNatalStatement(
  supporting: readonly DomainEvidence[],
  challenging: readonly DomainEvidence[],
  legacySummary?: string
): string {
  const natalSupporting = supporting.filter((e) => e.phase === 'NATAL_PROMISE');
  const natalChallenging = challenging.filter((e) => e.phase === 'NATAL_PROMISE');

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
  dashaEvidence: readonly DomainEvidence[],
  effect?: TimingActivationEffect
): string {
  if (dashaEvidence.length === 0 || effect === 'DOES_NOT_ACTIVATE') {
    return 'No active wealth Dasha activation identified.';
  }
  if (effect === 'UNKNOWN') {
    return 'Dasha activation could not be established from linked natal wealth evidence.';
  }
  if (effect === 'CHALLENGES') {
    return 'Current Dasha period indicates financial consolidation or expenditure trends.';
  }
  if (effect === 'PARTIALLY_ACTIVATES') {
    return 'Current Dasha period provides partial activation for financial initiatives alongside consolidation.';
  }
  if (effect === 'ACTIVATES') {
    return 'Current Dasha period actively supports wealth generation and financial inflow.';
  }
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  if (supporting.length > 0) {
    return 'Current Dasha period actively supports wealth generation and financial inflow.';
  }
  return 'Current Dasha period indicates financial consolidation or expenditure trends.';
}

export function buildWealthTransitStatement(
  transitEvidence: readonly DomainEvidence[],
  effect?: TransitTriggerEffect
): string {
  if (transitEvidence.length === 0 || effect === 'NO_MATERIAL_TRIGGER') {
    return 'No material transit trigger identified.';
  }
  if (effect === 'UNKNOWN') {
    return 'Transit influence could not be confirmed against linked natal wealth factors.';
  }
  if (effect === 'CHALLENGE') {
    return 'Current transit pressure may increase financial demands or expenditure.';
  }
  if (effect === 'MODIFIER') {
    return 'Current transits provide a modifying influence on financial timing.';
  }
  if (effect === 'TRIGGER') {
    return 'Transit triggers are active for financial developments.';
  }
  return 'Transit triggers are currently influencing wealth timing.';
}

export function buildD2Statement(
  d2Evidence: readonly DomainEvidence[],
  relationship: VargaRelationship
): string {
  if (relationship === 'UNAVAILABLE' || d2Evidence.length === 0) {
    return 'D2 Hora divisional analysis unavailable or neutral.';
  }
  if (relationship === 'CONFIRMS') {
    return 'D2 Hora confirms liquid wealth potential and resource accumulation.';
  }
  if (relationship === 'CONFLICTS') {
    return 'D2 Hora diverges from natal promise, indicating financial caution in asset preservation.';
  }
  if (relationship === 'MODIFIES') {
    return 'D2 Hora modifies the financial expression toward specialized asset structures.';
  }
  return 'D2 Hora partially confirms financial accumulation.';
}

export function buildWealthConclusion(
  natalPromise: NatalPromise,
  dashaActivation: DashaActivation,
  transitTrigger: TransitTrigger,
  legacySummary?: string,
  extra?: {
    readonly vargaConfirmations?: readonly VargaConfirmation[];
    readonly conclusionData?: WealthConclusionData;
  }
): string {
  const parts: string[] = [];

  if (extra?.conclusionData?.headline) {
    parts.push(extra.conclusionData.headline);
  }

  if (legacySummary) {
    parts.push(legacySummary);
  } else if (!extra?.conclusionData?.headline && natalPromise.statement) {
    parts.push(natalPromise.statement);
  }

  if (dashaActivation.active && dashaActivation.statement) {
    parts.push(dashaActivation.statement);
  }

  if (extra?.vargaConfirmations) {
    const d2 = extra.vargaConfirmations.find((v) => v.varga === 'D2');
    if (d2 && d2.statement && (d2.relationship === 'CONFIRMS' || d2.relationship === 'CONFLICTS' || d2.relationship === 'PARTIALLY_CONFIRMS')) {
      parts.push(d2.statement);
    }
  }

  if (transitTrigger.active && transitTrigger.statement) {
    parts.push(transitTrigger.statement);
  }

  return parts.join(' ') || legacySummary || 'Wealth domain interpretation complete.';
}
