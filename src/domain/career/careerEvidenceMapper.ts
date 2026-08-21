import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
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
import type { CareerEvidenceClassification } from './careerTypes';
import { resolveRelatedCareerPromiseEvidenceIds } from './careerEvidenceLinker';

export function mapCareerSourceType(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidenceSourceType {
  if (isCareerTransitEvidence(item)) {
    return 'TRANSIT';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === CareerEvidenceFamily.D10
  ) {
    return 'VARGA';
  }
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
    Boolean(item.timingEvidence)
  ) {
    return 'DASHA';
  }

  switch (item.evidenceFamily) {
    case CareerEvidenceFamily.TENTH_HOUSE:
    case CareerEvidenceFamily.SIXTH_HOUSE:
    case CareerEvidenceFamily.SECOND_HOUSE:
    case CareerEvidenceFamily.ELEVENTH_HOUSE:
      return 'HOUSE';

    case CareerEvidenceFamily.TENTH_LORD:
    case CareerEvidenceFamily.SIXTH_LORD:
    case CareerEvidenceFamily.SECOND_LORD:
    case CareerEvidenceFamily.ELEVENTH_LORD:
      return 'LORDSHIP';

    case CareerEvidenceFamily.SUN:
    case CareerEvidenceFamily.SATURN:
    case CareerEvidenceFamily.MERCURY:
    case CareerEvidenceFamily.MARS:
    case CareerEvidenceFamily.JUPITER:
      return 'PLANET';

    case CareerEvidenceFamily.PLANETARY_STRENGTH:
      return 'STRENGTH';

    case CareerEvidenceFamily.ASPECT:
      return 'ASPECT';

    case CareerEvidenceFamily.YOGA:
      return 'YOGA';

    case CareerEvidenceFamily.FUNCTIONAL_ROLE:
      // Functional benefic/malefic role determination maps to OTHER
      return 'OTHER';

    default:
      return 'OTHER';
  }
}

export function mapCareerDashaPeriod(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): 'MD' | 'AD' | 'PD' | undefined {
  const level = item.timingEvidence?.dashaLevel;
  if (level === 'MAHADASHA') return 'MD';
  if (level === 'ANTARDASHA') return 'AD';
  if (level === 'PRATYANTARDASHA') return 'PD';
  return undefined;
}

export function buildCareerEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly DomainEvidence[] {
  return Object.freeze(
    rawEvidence.map((item) => {
      const role = mapCareerRole(item);
      const relatedEvidenceIds = resolveRelatedCareerPromiseEvidenceIds(item, rawEvidence);
      const period = mapCareerDashaPeriod(item);
      const periodKey = item.timingEvidence?.planet
        ? String(item.timingEvidence.planet)
        : (item.transitEvidence?.planet ? String(item.transitEvidence.planet) : undefined);
      const timing = period
        ? { period, level: period, ...(periodKey ? { periodKey } : {}) }
        : (item.transitEvidence?.planet
          ? { period: 'MD' as const, ...(periodKey ? { periodKey } : {}) }
          : undefined);

      return createDomainEvidence({
        id: item.id,
        sourceType: mapCareerSourceType(item),
        domain: 'CAREER',
        role,
        phase: mapCareerPhase(item),
        source: mapCareerSource(item),
        statement: item.statement,
        polarity: mapCareerPolarity(item.effect),
        strength: mapCareerStrength(item.strength),
        priority: mapCareerPriority(item.priority),
        ruleId: item.ruleId,
        relatedEvidenceIds,
        timing
      });
    })
  );
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
    item.dimension === 'TIMING' ||
    Boolean(item.timingEvidence)
  ) {
    return 'TIMING';
  }
  if (
    item.dimension === 'MODIFIER' ||
    item.evidenceFamily === CareerEvidenceFamily.ASPECT ||
    item.evidenceFamily === CareerEvidenceFamily.PLANETARY_STRENGTH ||
    item.evidenceFamily === CareerEvidenceFamily.FUNCTIONAL_ROLE
  ) {
    return 'MODIFIER';
  }
  if (
    item.priority === 'SECONDARY' ||
    item.evidenceFamily === CareerEvidenceFamily.SIXTH_HOUSE ||
    item.evidenceFamily === CareerEvidenceFamily.SIXTH_LORD ||
    item.evidenceFamily === CareerEvidenceFamily.SECOND_HOUSE ||
    item.evidenceFamily === CareerEvidenceFamily.SECOND_LORD ||
    item.evidenceFamily === CareerEvidenceFamily.ELEVENTH_HOUSE ||
    item.evidenceFamily === CareerEvidenceFamily.ELEVENTH_LORD
  ) {
    return 'SECONDARY';
  }
  return 'SECONDARY';
}

export function isCareerTransitEvidence(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): boolean {
  return (
    item.ruleId.startsWith('CAREER_TRANSIT_') ||
    item.ruleId.includes('TRANSIT') ||
    item.id.includes('TRANSIT') ||
    Boolean(item.transitEvidence) ||
    (item.evidenceFamily as string) === 'TRANSIT'
  );
}

export function mapCareerPhase(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidencePhase {
  if (isCareerTransitEvidence(item)) {
    return 'TRANSIT_TRIGGER';
  }
  if (
    item.vargaEvidence ||
    item.evidenceFamily === CareerEvidenceFamily.D10 ||
    item.dimension === 'CONFIRMATION'
  ) {
    return 'VARGA_CONFIRMATION';
  }
  if (
    item.evidenceFamily === CareerEvidenceFamily.DASHA ||
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

export function mapCareerSource(
  item: ThemeInterpretationEvidence<CareerEvidenceFamily>
): EvidenceSource {
  if (
    item.vargaEvidence?.varga === 'D10' ||
    item.evidenceFamily === CareerEvidenceFamily.D10
  ) {
    return 'D10';
  }
  if (item.evidenceFamily === CareerEvidenceFamily.DASHA || Boolean(item.timingEvidence)) {
    return 'DASHA';
  }
  if (isCareerTransitEvidence(item)) {
    return 'TRANSIT';
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

export function classifyCareerEvidence(
  evidence: readonly DomainEvidence[]
): CareerEvidenceClassification {
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
