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
  EvidenceStrength
} from '../interpretation';
import type { CareerEvidenceClassification } from './careerTypes';
import { resolveRelatedCareerPromiseEvidenceIds } from './careerEvidenceLinker';

export function buildCareerEvidence(
  rawEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): readonly DomainEvidence[] {
  return Object.freeze(
    rawEvidence.map((item) => {
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
