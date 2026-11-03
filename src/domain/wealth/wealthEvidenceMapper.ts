import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import {
  createDomainEvidence,
  validateDomainEvidenceRootLinks
} from '../interpretation';
import type {
  DomainEvidence,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength,
  EvidenceSourceType
} from '../interpretation';
import type {
  WealthDimension,
  WealthEvidenceClassification
} from './wealthTypes';
import { resolveRelatedWealthPromiseEvidenceIds } from './wealthEvidenceLinker';
import { createCareerWealthEvidence } from '../careerWealth/provenance/careerWealthEvidence';
import { Planet } from '../../types';
import type { WealthEvidenceProducerRecord } from './wealthEvidenceProducer';

export function mapWealthSourceType(
  item: WealthEvidenceProducerRecord
): EvidenceSourceType {
  if (isWealthTransitEvidence(item)) {
    return 'TRANSIT';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === WealthEvidenceFamily.D2
  ) {
    return 'VARGA';
  }
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    Boolean(item.timingEvidence)
  ) {
    return 'DASHA';
  }

  switch (item.evidenceFamily) {
    case WealthEvidenceFamily.SECOND_HOUSE:
    case WealthEvidenceFamily.FIFTH_HOUSE:
    case WealthEvidenceFamily.NINTH_HOUSE:
    case WealthEvidenceFamily.ELEVENTH_HOUSE:
    case WealthEvidenceFamily.SECOND_LORD:
    case WealthEvidenceFamily.FIFTH_LORD:
    case WealthEvidenceFamily.NINTH_LORD:
    case WealthEvidenceFamily.ELEVENTH_LORD:
      return 'STRUCTURAL';

    case WealthEvidenceFamily.JUPITER:
    case WealthEvidenceFamily.VENUS:
    case WealthEvidenceFamily.MERCURY:
    case WealthEvidenceFamily.FUNCTIONAL_ROLE:
      return 'PLANET';

    case WealthEvidenceFamily.PLANETARY_STRENGTH:
      return 'STRENGTH';

    case WealthEvidenceFamily.ASPECT:
      return 'ASPECT';

    case WealthEvidenceFamily.YOGA:
      return 'YOGA';

    default:
      return 'OTHER';
  }
}

export function mapWealthDashaPeriod(
  item: WealthEvidenceProducerRecord
): 'MD' | 'AD' | 'PD' | undefined {
  const level = item.timingEvidence?.dashaLevel;
  if (level === 'MAHADASHA') return 'MD';
  if (level === 'ANTARDASHA') return 'AD';
  if (level === 'PRATYANTARDASHA') return 'PD';
  return undefined;
}

export function mapWealthDimension(
  item: WealthEvidenceProducerRecord
): WealthDimension | undefined {
  switch (item.evidenceFamily) {
    case WealthEvidenceFamily.SECOND_HOUSE:
    case WealthEvidenceFamily.SECOND_LORD:
      return 'ACCUMULATION';

    case WealthEvidenceFamily.ELEVENTH_HOUSE:
    case WealthEvidenceFamily.ELEVENTH_LORD:
      return 'GAINS';

    case WealthEvidenceFamily.NINTH_HOUSE:
    case WealthEvidenceFamily.NINTH_LORD:
    case WealthEvidenceFamily.JUPITER:
      return 'FORTUNE';

    case WealthEvidenceFamily.FIFTH_HOUSE:
    case WealthEvidenceFamily.FIFTH_LORD:
      return 'SPECULATION';

    default:
      return undefined;
  }
}

export function isWealthTransitEvidence(
  item: WealthEvidenceProducerRecord
): boolean {
  return (
    Boolean(item.transitEvidence) ||
    item.evidenceFamily === WealthEvidenceFamily.TRANSIT ||
    item.ruleId.startsWith('WEALTH_TRANSIT_') ||
    item.ruleId.includes('TRANSIT') ||
    item.id.includes('TRANSIT')
  );
}

/**
 * Resolves a deterministic, order-independent subjectKey for wealth evidence items.
 * Guaranteed never to rely on positional array indexes or raw planet ordering.
 */
export function resolveWealthSubjectKey(
  item: WealthEvidenceProducerRecord
): string {
  // Karaka rules: derive from the ruleId's karaka planet
  if (item.ruleId === 'WEALTH_VENUS_KARAKA_001' || item.ruleId.includes('VENUS_KARAKA')) {
    return 'VENUS_KARAKA';
  }
  if (item.ruleId.includes('KARAKA')) {
    if (item.ruleId.includes('JUPITER')) return 'JUPITER_KARAKA';
    if (item.ruleId.includes('MERCURY')) return 'MERCURY_KARAKA';
    if (item.ruleId.includes('MOON')) return 'MOON_KARAKA';
    if (item.ruleId.includes('SUN')) return 'SUN_KARAKA';
    if (item.ruleId.includes('MARS')) return 'MARS_KARAKA';
    if (item.ruleId.includes('SATURN')) return 'SATURN_KARAKA';
    if (item.ruleId.includes('VENUS')) return 'VENUS_KARAKA';
    return 'KARAKA';
  }
  // Relationship / link rules
  if (item.ruleId.includes('LINK')) {
    return 'LINK';
  }
  // Rules where the actual set of planets is the identity: sorted join ensures array order invariance
  if (item.planets && item.planets.length > 0) {
    return [...item.planets].map((p) => String(p)).sort().join('_');
  }
  // Fallback to sorted houses if present
  if (item.houses && item.houses.length > 0) {
    return [...item.houses].map((h) => `H${h}`).sort().join('_');
  }
  // Default to ruleId or fallback token
  return item.ruleId || 'VENUS_KARAKA';
}

export const resolveSubjectKey = resolveWealthSubjectKey;

/** Strict semantic subject resolution for provenance-enabled wealth evidence. */
export function resolveRequiredWealthSubjectKey(
  item: WealthEvidenceProducerRecord
): string {
  if (!item.ruleId?.trim()) {
    throw new Error('Wealth evidence provenance requires a non-empty ruleId');
  }

  const ruleId = item.ruleId.trim();
  const supportedRuleIds = new Set(['WEALTH_VENUS_KARAKA_001']);
  if (!supportedRuleIds.has(ruleId)) {
    throw new Error(`Wealth evidence uses an unregistered provenance rule: ${ruleId}`);
  }

  if (item.planets) {
    const validPlanets = new Set(Object.values(Planet));
    const seen = new Set<Planet>();
    for (const planet of item.planets) {
      if (!validPlanets.has(planet) || seen.has(planet)) {
        throw new Error(`Wealth evidence contains invalid or duplicate planet subject: ${String(planet)}`);
      }
      seen.add(planet);
    }
    // Intentional contract widening: the registered rule ID, not descriptive planet metadata,
    // determines the subject. Planet metadata may therefore contain multiple related planets and
    // is not treated as identity; PR description should call out this Venus-karaka relaxation.
  }

  if (item.houses) {
    const seen = new Set<number>();
    for (const house of item.houses) {
      if (!Number.isInteger(house) || house < 1 || house > 12 || seen.has(house)) {
        throw new Error(`Wealth evidence contains invalid or duplicate house subject: ${String(house)}`);
      }
      seen.add(house);
    }
  }

  return 'VENUS_KARAKA';
}

export function buildWealthEvidence(
  producerEvidence: readonly WealthEvidenceProducerRecord[]
): readonly DomainEvidence[] {
  const seenIds = new Set<string>();
  for (const item of producerEvidence) {
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate Wealth producer occurrence ID: ${item.id}`);
    }
    seenIds.add(item.id);
  }

  const mappedEvidence = producerEvidence.map((item) => {
      const role = mapWealthRole(item);
      const relatedEvidenceIds = resolveRelatedWealthPromiseEvidenceIds(item, producerEvidence);
      const period = mapWealthDashaPeriod(item);
      const planet = item.timingEvidence?.planet ?? item.transitEvidence?.planet ?? item.planets?.[0] ?? undefined;
      const house = item.houses?.[0] ?? undefined;
      const timing = period
        ? { period, level: period, ...(planet ? { planet } : {}) }
        : (item.transitEvidence?.planet
          ? { period: 'MD' as const, ...(planet ? { planet } : {}) }
          : undefined);
      const dimension = mapWealthDimension(item);

      // Identity policy: the producer's identityKey is authoritative and is never rewritten
      // by the mapper. Generic reasoning identity uses ruleId plus semantic selectors:
      // house-only facts use HOUSE_n, planet-only facts use the planet, and facts containing
      // both use planet + HOUSE_n. Producers should include HOUSE_n only when location is
      // identity-relevant. WEALTH_VENUS_KARAKA_001 is the registered exception: its key is
      // VENUS_KARAKA and deliberately excludes incidental placement metadata.
      //
      // Provenance path is deliberately registered only for WEALTH_VENUS_KARAKA_001.
      // All other Wealth rules continue through the legacy createDomainEvidence branch below.
      if (item.ruleId === 'WEALTH_VENUS_KARAKA_001') {
        const subjectKey = resolveRequiredWealthSubjectKey(item);
        const provenanceStrength =
          item.priority === 'PRIMARY'
            ? 'PRIMARY'
            : item.priority === 'SECONDARY'
              ? 'SECONDARY'
              : 'TERTIARY';
        return createCareerWealthEvidence({
          identity: {
            domain: 'WEALTH',
            axis: 'NATAL',
            source: 'D1',
            ruleId: item.ruleId,
            subjectKey,
            effect: item.effect,
            strength: provenanceStrength
          },
          occurrenceId: item.id,
          ...(item.identityKey ? { identityKey: item.identityKey } : {}),
          statement: item.statement,
          sourceType: mapWealthSourceType(item),
          role,
          phase: mapWealthPhase(item),
          priority: mapWealthPriority(item.priority),
          strength: mapWealthStrength(item.strength),
          planet,
          house,
          relatedEvidenceIds,
          rootEvidenceIds: item.rootEvidenceIds,
          timing,
          evidenceFamily: item.evidenceFamily,
          dimension
        });
      }

      return createDomainEvidence({
        id: item.id,
        sourceType: mapWealthSourceType(item),
        domain: 'WEALTH',
        role,
        phase: mapWealthPhase(item),
        source: mapWealthSource(item),
        statement: item.statement,
        polarity: mapWealthPolarity(item.effect),
        strength: mapWealthStrength(item.strength),
        priority: mapWealthPriority(item.priority),
        ruleId: item.ruleId,
        relatedEvidenceIds,
        rootEvidenceIds: item.rootEvidenceIds,
        timing,
        evidenceFamily: item.evidenceFamily,
        dimension,
        planet,
        house,
        ...(item.identityKey ? { identityKey: item.identityKey } : {})
      });
    });

  const rootLinkValidation = validateDomainEvidenceRootLinks(mappedEvidence);
  if (!rootLinkValidation.isValid) {
    const unresolved = rootLinkValidation.unresolved
      .map((item) => `${item.sourceOccurrenceId} -> ${item.rootIdentityKey} (${item.code})`)
      .join('; ');
    throw new Error(`Wealth evidence root-link validation failed: ${unresolved}`);
  }

  return Object.freeze(mappedEvidence);
}

export function mapWealthRole(
  item: WealthEvidenceProducerRecord
): EvidenceRole {
  switch (item.evidenceFamily) {
    case WealthEvidenceFamily.SECOND_HOUSE:
    case WealthEvidenceFamily.SECOND_LORD:
    case WealthEvidenceFamily.ELEVENTH_HOUSE:
    case WealthEvidenceFamily.ELEVENTH_LORD:
    case WealthEvidenceFamily.NINTH_HOUSE:
    case WealthEvidenceFamily.NINTH_LORD:
    case WealthEvidenceFamily.FIFTH_HOUSE:
    case WealthEvidenceFamily.FIFTH_LORD:
      return 'PRIMARY';

    case WealthEvidenceFamily.JUPITER:
    case WealthEvidenceFamily.VENUS:
    case WealthEvidenceFamily.MERCURY:
    case WealthEvidenceFamily.YOGA:
    case WealthEvidenceFamily.FUNCTIONAL_ROLE:
    case WealthEvidenceFamily.PLANETARY_STRENGTH:
    case WealthEvidenceFamily.ASPECT:
      return 'MODIFIER';

    case WealthEvidenceFamily.D2:
      return 'CONFIRMATION';

    case WealthEvidenceFamily.DASHA:
    case WealthEvidenceFamily.TRANSIT:
      return 'TIMING';

    default:
      break;
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
    item.dimension === 'TIMING' ||
    Boolean(item.timingEvidence) ||
    Boolean(item.transitEvidence)
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

export function mapWealthPhase(
  item: WealthEvidenceProducerRecord
): EvidencePhase {
  if (isWealthTransitEvidence(item)) {
    return 'TRANSIT_TRIGGER';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === WealthEvidenceFamily.D2 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'VARGA_CONFIRMATION';
  }
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    item.dimension === 'TIMING' ||
    Boolean(item.timingEvidence)
  ) {
    return 'DASHA_ACTIVATION';
  }
  if (item.dimension === 'MODIFIER') {
    return 'MODIFIER';
  }
  return 'NATAL_PROMISE';
}

export function mapWealthSource(
  item: WealthEvidenceProducerRecord
): EvidenceSource {
  if (
    item.vargaEvidence?.varga === 'D2' ||
    item.evidenceFamily === WealthEvidenceFamily.D2
  ) {
    return 'D2';
  }
  if (
    item.evidenceFamily === WealthEvidenceFamily.DASHA ||
    Boolean(item.timingEvidence)
  ) {
    return 'DASHA';
  }
  if (isWealthTransitEvidence(item)) {
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

export function classifyWealthEvidence(
  evidence: readonly DomainEvidence[]
): WealthEvidenceClassification {
  const primary: DomainEvidence[] = [];
  const supporting: DomainEvidence[] = [];
  const challenging: DomainEvidence[] = [];
  const modifiers: DomainEvidence[] = [];

  for (const item of evidence) {
    switch (item.role) {
      case 'PRIMARY':
        primary.push(item);
        break;
      case 'SECONDARY':
        supporting.push(item);
        break;
      case 'MODIFIER':
        modifiers.push(item);
        break;
      case 'CONFIRMATION':
      case 'TIMING':
        break;
    }

    if (item.polarity === 'CHALLENGING') {
      challenging.push(item);
    }
  }

  return {
    primary: Object.freeze(primary),
    supporting: Object.freeze(supporting),
    challenging: Object.freeze(challenging),
    modifiers: Object.freeze(modifiers)
  };
}
