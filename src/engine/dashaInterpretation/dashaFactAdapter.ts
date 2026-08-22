import {
  DashaInterpretationEvidence,
  DashaInterpretationEvidenceType
} from './dashaInterpretationTypes';
import {
  DashaReasoningEvidence,
  DashaReasoningBasis,
  DashaEvidenceEffect
} from './dashaReasoningTypes';

export function mapEvidenceTypeToReasoningBasis(
  type: DashaInterpretationEvidenceType
): DashaReasoningBasis {
  switch (type) {
    case 'DASHA_LORD':
    case 'HOUSE_PLACEMENT':
      return 'PLACEMENT';
    case 'HOUSE_OWNERSHIP':
      return 'OWNERSHIP';
    case 'FUNCTIONAL_ROLE':
      return 'FUNCTIONAL_ROLE';
    case 'FUNCTIONAL_NATURE':
      return 'FUNCTIONAL_NATURE';
    case 'DIGNITY':
      return 'DIGNITY';
    case 'STATE':
      return 'STATE';
    case 'STRENGTH':
      return 'STRENGTH';
    case 'ASPECT_CAST':
    case 'ASPECT_RECEIVED':
      return 'ASPECT';
    case 'YOGA':
      return 'YOGA';
    case 'HOUSE_DOMAIN':
      return 'HOUSE_DOMAIN';
    case 'PLANETARY_RELATIONSHIP':
    case 'SHARED_HOUSE':
      return 'COMBINATION';
    default:
      return 'PLACEMENT';
  }
}

export function createReasoningFactId(evidence: DashaInterpretationEvidence): string {
  const planetsStr = (evidence.planets || []).join(',');
  const housesStr = (evidence.houses || []).join(',');
  const ruleId = evidence.ruleId ? String(evidence.ruleId) : '';
  const effect = evidence.effect || 'NEUTRAL';
  return `DASHA_REASONING:FACT:${ruleId}:${planetsStr}:${housesStr}:${effect}`;
}

export function adaptInterpretationEvidenceToReasoningFact(
  evidence: DashaInterpretationEvidence
): DashaReasoningEvidence {
  const id = createReasoningFactId(evidence);
  const basis = mapEvidenceTypeToReasoningBasis(evidence.type);
  const planetsStr = (evidence.planets || []).join(',');
  const housesStr = (evidence.houses || []).join(',');
  const d04SourceId = `DASHA:${evidence.level}:${evidence.ruleId}:${planetsStr}:${housesStr}:${evidence.effect}`;

  return Object.freeze({
    id,
    level: 'FACT',
    basis,
    effect: evidence.effect as DashaEvidenceEffect,
    statement: evidence.statement,
    confidence: 1.0,
    sourceEvidenceIds: Object.freeze([evidence.ruleId, d04SourceId].filter(Boolean)),
    activatedHouses: Object.freeze([...(evidence.houses ?? [])])
  });
}

export function adaptInterpretationEvidenceListToReasoningFacts(
  evidenceList: readonly DashaInterpretationEvidence[]
): readonly DashaReasoningEvidence[] {
  return Object.freeze(evidenceList.map(adaptInterpretationEvidenceToReasoningFact));
}
