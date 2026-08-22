import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import { createDomainEvidence } from '../interpretation';
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

export function mapWealthSourceType(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
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
      return 'HOUSE';

    case WealthEvidenceFamily.SECOND_LORD:
    case WealthEvidenceFamily.FIFTH_LORD:
    case WealthEvidenceFamily.NINTH_LORD:
    case WealthEvidenceFamily.ELEVENTH_LORD:
      return 'LORDSHIP';

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
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
): 'MD' | 'AD' | 'PD' | undefined {
  const level = item.timingEvidence?.dashaLevel;
  if (level === 'MAHADASHA') return 'MD';
  if (level === 'ANTARDASHA') return 'AD';
  if (level === 'PRATYANTARDASHA') return 'PD';
  return undefined;
}

export function mapWealthDimension(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
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
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
): boolean {
  return (
    Boolean(item.transitEvidence) ||
    item.evidenceFamily === WealthEvidenceFamily.TRANSIT ||
    item.ruleId.startsWith('WEALTH_TRANSIT_') ||
    item.ruleId.includes('TRANSIT') ||
    item.id.includes('TRANSIT')
  );
}

export function buildWealthEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly DomainEvidence[] {
  return Object.freeze(
    rawEvidence.map((item) => {
      const role = mapWealthRole(item);
      const relatedEvidenceIds = resolveRelatedWealthPromiseEvidenceIds(item, rawEvidence);
      const period = mapWealthDashaPeriod(item);
      const periodKey = item.timingEvidence?.planet
        ? String(item.timingEvidence.planet)
        : (item.transitEvidence?.planet ? String(item.transitEvidence.planet) : undefined);
      const timing = period
        ? { period, level: period, ...(periodKey ? { periodKey } : {}) }
        : (item.transitEvidence?.planet
          ? { period: 'MD' as const, ...(periodKey ? { periodKey } : {}) }
          : undefined);
      const dimension = mapWealthDimension(item);

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
        timing,
        evidenceFamily: item.evidenceFamily,
        dimension
      });
    })
  );
}

export function mapWealthRole(
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
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
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
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
  item: ThemeInterpretationEvidence<WealthEvidenceFamily>
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
