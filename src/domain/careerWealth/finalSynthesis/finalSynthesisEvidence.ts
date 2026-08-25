import type { FinalSynthesisEvidence } from './careerWealthFinalSynthesisTypes';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { CareerDashaFactor } from '../../career/careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingFactor, WealthTimingFactor } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerManifestationFactor } from '../../career/manifestation/careerManifestationSynthesisTypes';
import type { WealthManifestationFactor } from '../../wealth/manifestation/wealthManifestationTypes';

export function mapDomainEvidenceToFinalEvidence(
  evidence: readonly DomainEvidence[],
  source: 'NATAL' | 'D10' | 'D2'
): readonly FinalSynthesisEvidence[] {
  return evidence.map((e) => ({
    id: e.id,
    source,
    direction: e.polarity === 'SUPPORTING' ? 'SUPPORT' : e.polarity === 'CHALLENGING' ? 'CHALLENGE' : 'NEUTRAL',
    statement: e.statement,
    evidenceIds: Object.freeze([e.id]),
    priority: source === 'NATAL' ? 'PRIMARY' : 'SECONDARY'
  }));
}

export function mapCareerDashaFactorToFinalEvidence(
  factor: CareerDashaFactor
): FinalSynthesisEvidence {
  return {
    id: factor.id,
    source: 'DASHA',
    direction: factor.direction,
    statement: factor.statement,
    evidenceIds: factor.evidenceIds ? Object.freeze([...factor.evidenceIds]) : Object.freeze([factor.id]),
    priority: 'SECONDARY'
  };
}

export function mapTimingFactorToFinalEvidence(
  factor: CareerTimingFactor | WealthTimingFactor
): FinalSynthesisEvidence {
  const evidenceIds: string[] = [];
  if (factor.natalEvidenceIds) evidenceIds.push(...factor.natalEvidenceIds);
  if (factor.dashaEvidenceIds) evidenceIds.push(...factor.dashaEvidenceIds);
  if (evidenceIds.length === 0) evidenceIds.push(factor.id);

  return {
    id: factor.id,
    source: 'TRANSIT',
    direction: factor.direction,
    statement: factor.statement,
    evidenceIds: Object.freeze([...new Set(evidenceIds)]),
    priority: 'REFINEMENT'
  };
}

export function mapCareerManifestationFactorToFinalEvidence(
  factor: CareerManifestationFactor
): FinalSynthesisEvidence {
  const evidenceIds: string[] = [];
  if (factor.evidenceIds) evidenceIds.push(...factor.evidenceIds);
  if (factor.dashaEvidenceIds) evidenceIds.push(...factor.dashaEvidenceIds);
  if (factor.transitEvidenceIds) evidenceIds.push(...factor.transitEvidenceIds);
  if (evidenceIds.length === 0) evidenceIds.push(factor.id);

  return {
    id: factor.id,
    source: factor.source === 'D10' ? 'D10' : factor.source === 'DASHA' ? 'DASHA' : factor.source === 'TRANSIT' ? 'TRANSIT' : 'MANIFESTATION',
    direction: factor.direction,
    statement: factor.statement,
    evidenceIds: Object.freeze([...new Set(evidenceIds)]),
    priority: factor.source === 'NATAL' ? 'PRIMARY' : factor.source === 'TRANSIT' ? 'REFINEMENT' : 'SECONDARY'
  };
}

export function mapWealthManifestationFactorToFinalEvidence(
  factor: WealthManifestationFactor
): FinalSynthesisEvidence {
  const evidenceIds: string[] = [];
  if (factor.evidenceIds) evidenceIds.push(...factor.evidenceIds);
  if (factor.dashaEvidenceIds) evidenceIds.push(...factor.dashaEvidenceIds);
  if (factor.transitEvidenceIds) evidenceIds.push(...factor.transitEvidenceIds);
  if (evidenceIds.length === 0) evidenceIds.push(factor.id);

  return {
    id: factor.id,
    source: factor.source === 'D2' ? 'D2' : factor.source === 'DASHA' ? 'DASHA' : factor.source === 'TRANSIT' ? 'TRANSIT' : 'MANIFESTATION',
    direction: factor.direction,
    statement: factor.statement,
    evidenceIds: Object.freeze([...new Set(evidenceIds)]),
    priority: factor.source === 'NATAL' ? 'PRIMARY' : factor.source === 'TRANSIT' ? 'REFINEMENT' : 'SECONDARY'
  };
}

export function extractUniqueEvidenceIds(evidenceList: readonly FinalSynthesisEvidence[]): readonly string[] {
  const ids = new Set<string>();
  for (const item of evidenceList) {
    ids.add(item.id);
    for (const refId of item.evidenceIds) {
      ids.add(refId);
    }
  }
  return Object.freeze([...ids]);
}
