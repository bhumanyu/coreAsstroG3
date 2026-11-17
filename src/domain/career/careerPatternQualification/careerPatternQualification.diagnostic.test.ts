import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../../reasoning/reasoningTypes';
import type { CareerPlanetaryConditionFactor } from '../careerPlanetaryCondition';
import type { CareerGraphEdge } from '../careerGraph';
import { interpretCareerV2 } from '../CareerDomainInterpreterV2';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph';
import type {
  QualifiedCareerPattern
} from './careerPatternQualificationTypes';

const testMethodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};

function formatFactor(factor: CareerPlanetaryConditionFactor): string {
  return `${factor.type}:${factor.effect} — ${factor.statement}`;
}

function formatFactors(
  factors: readonly CareerPlanetaryConditionFactor[] | undefined
): string {
  if (!factors || factors.length === 0) {
    return '(none)';
  }
  return factors.map(formatFactor).join(' | ');
}

function printParticipant(qualified: QualifiedCareerPattern): void {
  console.log('  participants:');
  for (const participant of qualified.participants) {
    const source = participant.conditionSource;
    console.log(`    - planet: ${participant.planet}`);
    console.log(`      relevance: ${participant.relevance}`);
    console.log(`      condition: ${participant.condition}`);
    if (!source) {
      console.log('      conditionSource: MISSING — PROVENANCE GAP (C6 condition record not carried through)');
      continue;
    }
    console.log(`      conditionSource.assessment: ${source.assessment ?? '(unset)'}`);
    console.log(`      conditionSource.dignity: ${source.dignity}`);
    console.log(`      conditionSource.affliction: ${source.affliction}`);
    console.log(`      conditionSource.combustion: ${source.combustion}`);
    console.log(`      conditionSource.positiveFactors: ${formatFactors(source.positiveFactors)}`);
    console.log(`      conditionSource.negativeFactors: ${formatFactors(source.negativeFactors)}`);
    console.log(`      conditionSource.statement: ${source.statement}`);
  }
}

function printPolicyEvidence(qualified: QualifiedCareerPattern): void {
  console.log('  policyEvidence:');
  if (qualified.policyEvidence.length === 0) {
    console.log('    (none)');
    return;
  }
  for (const evidence of qualified.policyEvidence) {
    console.log(`    - dimension: ${evidence.dimension}`);
    console.log(`      sourceType: ${evidence.sourceType}`);
    console.log(`      sourceId: ${evidence.sourceId}`);
    console.log(`      relationshipIds: [${[...evidence.relationshipIds].join(', ')}]`);
    console.log(`      explanation: ${evidence.explanation}`);
  }
}

function printEstablishingRelationships(
  qualified: QualifiedCareerPattern,
  edgesByIdentityKey: ReadonlyMap<string, readonly { networkId: string; edge: CareerGraphEdge }[]>
): void {
  const establishingIds = qualified.sourcePattern.provenance.establishingRelationshipIds;
  console.log(`  establishingRelationshipIds (${establishingIds.length}):`);
  for (const relationshipId of establishingIds) {
    const matches = edgesByIdentityKey.get(relationshipId) ?? [];
    if (matches.length === 0) {
      console.log(`    - ${relationshipId} -> UNRESOLVED (no C4 edge with this identityKey)`);
      continue;
    }
    for (const { networkId, edge } of matches) {
      console.log(`    - ${relationshipId}`);
      console.log(`      resolved in network: ${networkId}`);
      console.log(`      edgeId: ${edge.edgeId}`);
      console.log(`      type: ${edge.type}`);
      console.log(`      sourceNodeId: ${edge.sourceNodeId}`);
      console.log(`      targetNodeId: ${edge.targetNodeId}`);
      console.log(`      edge.identityKey: ${edge.identityKey}`);
      console.log(`      edge.provenance.sourceIds: [${[...edge.provenance.sourceIds].join(', ')}]`);
      console.log(`      edge.provenance.ruleIds: [${[...edge.provenance.ruleIds].join(', ')}]`);
    }
  }
}

function printQualifiedPattern(
  qualified: QualifiedCareerPattern,
  edgesByIdentityKey: ReadonlyMap<string, readonly { networkId: string; edge: CareerGraphEdge }[]>
): void {
  console.log(`\n===== QUALIFIED PATTERN: ${qualified.patternId} =====`);
  console.log(`identityKey: ${qualified.identityKey}`);
  console.log(`classification: ${qualified.classification}`);
  console.log(`family: ${qualified.family}`);
  console.log(`level: ${qualified.level}`);
  console.log(`name: ${qualified.name}`);
  console.log(`planets: [${qualified.planets.join(', ')}]`);
  console.log(`houses: [${[...qualified.houses].sort((a, b) => a - b).join(', ')}]`);
  console.log(`networkIds: [${qualified.networkIds.join(', ')}]`);
  console.log(`status: ${qualified.status}`);
  console.log(`dimensions:`);
  console.log(`  structuralStrength: ${qualified.dimensions.structuralStrength}`);
  console.log(`  planetaryCondition: ${qualified.dimensions.planetaryCondition}`);
  console.log(`  careerRelevance: ${qualified.dimensions.careerRelevance}`);
  console.log(`  coherence: ${qualified.dimensions.coherence}`);
  console.log(`  activationPotential: ${qualified.dimensions.activationPotential}`);
  console.log(`  divisionalConfirmation: ${qualified.dimensions.divisionalConfirmation}`);
  console.log(`decisionBlockingReasons: ${JSON.stringify(qualified.decisionBlockingReasons)}`);
  console.log(`deferredDimensions: [${qualified.deferredDimensions.join(', ')}]`);
  console.log(`ruleId: ${qualified.ruleId}`);
  console.log(`explanation: ${qualified.explanation}`);
  console.log(`statement: ${qualified.statement}`);
  console.log(`provenance: ${JSON.stringify(qualified.provenance)}`);
  printParticipant(qualified);
  printPolicyEvidence(qualified);
  printEstablishingRelationships(qualified, edgesByIdentityKey);
}

describe('Career Pattern Qualification — canonical live-chart diagnostic', () => {
  it('prints the complete QualifiedCareerPattern for every detected pattern', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ methodology: testMethodology });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);
    const options: DomainReasoningOptions = { context, temporalState };

    const result = interpretCareerV2(horoscope, options);
    const foundation = result.conclusionData?.canonicalCareerFoundation;
    expect(foundation).toBeDefined();

    // Rebuild the C4 network chain exactly as canonicalCareerFoundationBuilder does,
    // so establishingRelationshipIds can be resolved to concrete CareerGraphEdge records.
    const structural = buildCareerStructuralReasoning({ horoscope });
    const facts = buildCareerGraphFactsFromStructural(structural);
    const graph = buildCareerAstroGraph({ facts });
    const networks = detectCareerHouseNetworks({ graph }).networks;

    const edgesByIdentityKey = new Map<
      string,
      { networkId: string; edge: CareerGraphEdge }[]
    >();
    for (const network of networks) {
      for (const edge of network.relationships) {
        const entries = edgesByIdentityKey.get(edge.identityKey) ?? [];
        entries.push({ networkId: network.networkId, edge });
        edgesByIdentityKey.set(edge.identityKey, entries);
      }
    }

    const qualifications = foundation!.patternQualifications;
    console.log(`\n##### PATTERN QUALIFICATIONS: ${qualifications.length} detected #####`);

    const conditionSourceGaps: string[] = [];
    for (const patternQualification of qualifications) {
      const qualified = patternQualification.qualifiedPattern;
      printQualifiedPattern(qualified, edgesByIdentityKey);
      for (const participant of qualified.participants) {
        if (!participant.conditionSource) {
          conditionSourceGaps.push(`${qualified.patternId}:${participant.planet}`);
        }
      }
    }

    if (conditionSourceGaps.length > 0) {
      console.log('\n##### PROVENANCE GAPS: missing conditionSource #####');
      for (const gap of conditionSourceGaps) {
        console.log(`  - ${gap}`);
      }
    } else {
      console.log('\n##### PROVENANCE: all participants carry conditionSource #####');
    }

    expect(conditionSourceGaps).toEqual([]);
  });
});