import type { Horoscope } from '../../types';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import {
  WealthEvidenceFamily,
  type WealthEvidence,
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

export function interpretWealthV2(
  horoscope: Horoscope
): DomainInterpretation {
  const legacyWealth = interpretWealthTheme(horoscope);
  const evidence = buildWealthEvidence(legacyWealth.evidence);

  const supportingEvidence = evidence.filter(
    (item) => item.polarity === 'SUPPORTING'
  );
  const challengingEvidence = evidence.filter(
    (item) => item.polarity === 'CHALLENGING'
  );

  const natalPromise = createNatalPromise({
    domain: 'WEALTH',
    strength: calculateWealthNatalStrength(evidence),
    confidence: calculateEvidenceConfidence(
      evidence.filter((item) => item.phase === 'NATAL_PROMISE')
    ),
    statement: buildWealthNatalStatement(
      evidence,
      legacyWealth.conclusion.summary
    ),
    evidenceIds: evidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id),
    supportingEvidenceIds: evidence
      .filter(
        (item) =>
          item.phase === 'NATAL_PROMISE' &&
          item.polarity === 'SUPPORTING'
      )
      .map((item) => item.id),
    challengingEvidenceIds: evidence
      .filter(
        (item) =>
          item.phase === 'NATAL_PROMISE' &&
          item.polarity === 'CHALLENGING'
      )
      .map((item) => item.id)
  });

  const dashaEvidence = evidence.filter(
    (item) => item.phase === 'DASHA_ACTIVATION'
  );
  const dashaActivation = createDashaActivation({
    domain: 'WEALTH',
    active: dashaEvidence.length > 0,
    strength: calculateWealthActivationStrength(evidence),
    confidence: calculateEvidenceConfidence(dashaEvidence),
    statement: buildWealthDashaStatement(evidence),
    evidenceIds: dashaEvidence.map((item) => item.id),
    activatedPromiseEvidenceIds: dashaEvidence.flatMap(
      (item) => item.relatedEvidenceIds
    )
  });

  const transitEvidence = evidence.filter(
    (item) => item.phase === 'TRANSIT_TRIGGER'
  );
  const transitTrigger = createTransitTrigger({
    domain: 'WEALTH',
    active: transitEvidence.length > 0,
    strength: calculateWealthTransitStrength(evidence),
    confidence: calculateEvidenceConfidence(transitEvidence),
    statement: buildWealthTransitStatement(evidence),
    evidenceIds: transitEvidence.map((item) => item.id),
    triggeredPromiseEvidenceIds: transitEvidence.flatMap(
      (item) => item.relatedEvidenceIds
    )
  });

  const d2Evidence = evidence.filter((item) => item.source === 'D2');
  const vargaConfirmations: readonly VargaConfirmation[] = d2Evidence.length > 0
    ? [
        createVargaConfirmation({
          domain: 'WEALTH',
          varga: 'D2',
          confirmed: d2Evidence.some((item) => item.polarity === 'SUPPORTING'),
          strength: calculateDomainStrength(
            d2Evidence.filter((e) => e.polarity === 'SUPPORTING'),
            d2Evidence.filter((e) => e.polarity === 'CHALLENGING')
          ),
          confidence: calculateEvidenceConfidence(d2Evidence),
          statement: d2Evidence.some((item) => item.polarity === 'SUPPORTING')
            ? 'D2 Hora confirms liquid wealth potential.'
            : 'D2 Hora indicates financial caution.',
          evidenceIds: d2Evidence.map((item) => item.id)
        })
      ]
    : [];

  const manifestations = buildWealthManifestations(
    evidence,
    legacyWealth.subthemes
  );

  const conclusion = createDomainConclusion({
    domain: 'WEALTH',
    strength: natalPromise.strength,
    confidence: calculateEvidenceConfidence(evidence),
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
    conflicts: [],
    conclusion
  });
}

export function buildWealthEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly DomainEvidence[] {
  return rawEvidence.map((item) =>
    createDomainEvidence({
      id: item.id,
      domain: 'WEALTH',
      phase: mapWealthPhase(item),
      source: mapWealthSource(item),
      statement: item.statement,
      polarity: mapWealthPolarity(item.effect),
      strength: mapWealthStrength(item.strength),
      priority: mapWealthPriority(item.priority),
      ruleId: item.ruleId,
      relatedEvidenceIds: []
    })
  );
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

export function calculateWealthNatalStrength(
  evidence: readonly DomainEvidence[]
): DomainStrength {
  const natalEvidence = evidence.filter((e) => e.phase === 'NATAL_PROMISE');
  const supporting = natalEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = natalEvidence.filter((e) => e.polarity === 'CHALLENGING');
  return calculateDomainStrength(supporting, challenging);
}

export function calculateWealthActivationStrength(
  evidence: readonly DomainEvidence[]
): DomainStrength {
  const dashaEvidence = evidence.filter((e) => e.phase === 'DASHA_ACTIVATION');
  const supporting = dashaEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = dashaEvidence.filter((e) => e.polarity === 'CHALLENGING');
  return calculateDomainStrength(supporting, challenging);
}

export function calculateWealthTransitStrength(
  evidence: readonly DomainEvidence[]
): DomainStrength {
  const transitEvidence = evidence.filter((e) => e.phase === 'TRANSIT_TRIGGER');
  const supporting = transitEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = transitEvidence.filter((e) => e.polarity === 'CHALLENGING');
  return calculateDomainStrength(supporting, challenging);
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
  evidence: readonly DomainEvidence[],
  subthemes?: Readonly<Partial<Record<WealthSubthemeKey, WealthSubthemeSummary>>>
): readonly DomainManifestation[] {
  const modes: ManifestationMode[] = [
    'ACCUMULATION',
    'GAINS',
    'FORTUNE',
    'SPECULATION'
  ];

  return Object.freeze(
    modes.map((mode) => {
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

      // Gather evidence matching this manifestation mode
      const relevantEvidenceIds = evidence
        .filter((e) => {
          const stmt = e.statement.toLowerCase();
          if (mode === 'ACCUMULATION') return stmt.includes('2nd') || stmt.includes('accumulation') || stmt.includes('savings');
          if (mode === 'GAINS') return stmt.includes('11th') || stmt.includes('gain') || stmt.includes('income');
          if (mode === 'FORTUNE') return stmt.includes('9th') || stmt.includes('fortune') || stmt.includes('bhagya') || stmt.includes('jupiter');
          if (mode === 'SPECULATION') return stmt.includes('5th') || stmt.includes('speculat') || stmt.includes('investment');
          return false;
        })
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
