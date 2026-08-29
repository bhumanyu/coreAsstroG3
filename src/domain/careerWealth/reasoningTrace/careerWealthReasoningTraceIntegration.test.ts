import { describe, expect, it } from 'vitest';
import { interpretCareerV2, buildCareerReasoningTraceGraph } from '../../career/CareerDomainInterpreterV2';
import { interpretWealthV2, buildWealthReasoningTraceGraph } from '../../wealth/WealthDomainInterpreterV2';
import { createDomainEvidence, type DomainEvidence } from '../../interpretation';
import type { ReasoningTraceGraph } from './reasoningTraceGraph';
import { validateReasoningTrace, validateEvidenceNodes } from './reasoningTraceValidator';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import type { CareerWealthFinalSynthesis } from '../finalSynthesis/careerWealthFinalSynthesisTypes';

describe('Career & Wealth ReasoningTraceGraph Integration (CW-06B)', () => {
  const dummyHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  it('populates valid reasoningTraceGraph on Career domain interpretation conclusionData with exact node requirements', () => {
    const interpretation = interpretCareerV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as {
      reasoningTraceGraph?: ReasoningTraceGraph;
      careerFinalSynthesis?: CareerWealthFinalSynthesis;
    };

    expect(conclusionData).toBeDefined();
    const graph = conclusionData.reasoningTraceGraph!;
    expect(graph).toBeDefined();
    expect(graph.traceId).toBe('CW-TRACE-CAREER');

    // Structural validation
    expect(() => validateReasoningTrace(graph)).not.toThrow();
    expect(() => validateEvidenceNodes(graph, new Set(interpretation.evidence.map((e) => e.id)))).not.toThrow();

    // Verify existing reasoningTrace is untouched
    expect(interpretation.reasoningTrace).toBeUndefined();

    // Assert exact node presence for Career
    const natalNode = graph.nodes.find((n) => n.axis === 'NATAL' && n.subjectKey === 'NATAL_PROMISE');
    expect(natalNode).toBeDefined();

    const dashaNode = graph.nodes.find((n) => n.axis === 'DASHA' && n.subjectKey === 'DASHA_ACTIVATION');
    expect(dashaNode).toBeDefined();

    const timingNode = graph.nodes.find((n) => n.axis === 'TIMING' && n.subjectKey === 'TIMING_TRIGGER');
    expect(timingNode).toBeDefined();

    const divisionalNode = graph.nodes.find((n) => n.axis === 'DIVISIONAL' && n.subjectKey === 'D10_CONFIRMATION');
    expect(divisionalNode).toBeDefined();

    const manifestationNode = graph.nodes.find((n) => n.axis === 'MANIFESTATION' && n.subjectKey === 'CAREER_MANIFESTATION');
    expect(manifestationNode).toBeDefined();
    expect(manifestationNode?.type).toBe('MANIFESTATION');

    const finalNode = graph.nodes.find((n) => n.axis === 'FINAL' && n.subjectKey === 'FINAL_SYNTHESIS');
    expect(finalNode).toBeDefined();
    expect(finalNode?.type).toBe('SYNTHESIS');

    // Assert specific conclusion -> final synthesis edges match CW-05 synthesis
    const finalSynthesis = conclusionData.careerFinalSynthesis;
    if (finalSynthesis) {
      const edgesToFinal = graph.edges.filter((e) => e.toNodeId === finalNode?.nodeId);
      expect(edgesToFinal.length).toBeGreaterThan(0);

      const natalEdge = edgesToFinal.find((e) => e.fromNodeId === natalNode?.nodeId);
      if (finalSynthesis.promiseStatus === 'STRONG' || finalSynthesis.promiseStatus === 'VERY_STRONG' || finalSynthesis.promiseStatus === 'MODERATE') {
        expect(natalEdge?.type).toBe('SUPPORTS');
      }

      const dashaEdge = edgesToFinal.find((e) => e.fromNodeId === dashaNode?.nodeId);
      if (finalSynthesis.activationStatus === 'SUPPORT') {
        expect(dashaEdge?.type).toBe('ACTIVATES');
      } else if (finalSynthesis.activationStatus === 'CHALLENGE') {
        expect(dashaEdge?.type).toBe('CHALLENGES');
      } else if (finalSynthesis.activationStatus === 'MIXED') {
        expect(dashaEdge?.type).toBe('MODIFIES');
      }

      const divisionalEdge = edgesToFinal.find((e) => e.fromNodeId === divisionalNode?.nodeId);
      if (finalSynthesis.divisionalStatus === 'CONFIRMS' || finalSynthesis.divisionalStatus === 'PARTIALLY_CONFIRMS') {
        expect(divisionalEdge?.type).toBe('CONFIRMS');
      } else if (finalSynthesis.divisionalStatus === 'UNAVAILABLE' || finalSynthesis.divisionalStatus === 'MODIFIES') {
        expect(divisionalEdge).toBeUndefined();
      }
    }
  });

  it('populates valid reasoningTraceGraph on Wealth domain interpretation conclusionData with exact node requirements', () => {
    const interpretation = interpretWealthV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as {
      reasoningTraceGraph?: ReasoningTraceGraph;
      wealthFinalSynthesis?: CareerWealthFinalSynthesis;
    };

    expect(conclusionData).toBeDefined();
    const graph = conclusionData.reasoningTraceGraph!;
    expect(graph).toBeDefined();
    expect(graph.traceId).toBe('CW-TRACE-WEALTH');

    // Structural validation
    expect(() => validateReasoningTrace(graph)).not.toThrow();
    expect(() => validateEvidenceNodes(graph, new Set(interpretation.evidence.map((e) => e.id)))).not.toThrow();

    // Assert exact node presence for Wealth
    const natalNode = graph.nodes.find((n) => n.axis === 'NATAL' && n.subjectKey === 'NATAL_PROMISE');
    expect(natalNode).toBeDefined();

    const dashaNode = graph.nodes.find((n) => n.axis === 'DASHA' && n.subjectKey === 'DASHA_ACTIVATION');
    expect(dashaNode).toBeDefined();

    const timingNode = graph.nodes.find((n) => n.axis === 'TIMING' && n.subjectKey === 'TIMING_TRIGGER');
    expect(timingNode).toBeDefined();

    const divisionalNode = graph.nodes.find((n) => n.axis === 'DIVISIONAL' && n.subjectKey === 'D2_CONFIRMATION');
    expect(divisionalNode).toBeDefined();

    const manifestationNode = graph.nodes.find((n) => n.axis === 'MANIFESTATION' && n.subjectKey === 'WEALTH_MANIFESTATION');
    expect(manifestationNode).toBeDefined();
    expect(manifestationNode?.type).toBe('MANIFESTATION');

    const finalNode = graph.nodes.find((n) => n.axis === 'FINAL' && n.subjectKey === 'FINAL_SYNTHESIS');
    expect(finalNode).toBeDefined();
    expect(finalNode?.type).toBe('SYNTHESIS');

    const finalSynthesis = conclusionData.wealthFinalSynthesis;
    if (finalSynthesis) {
      const edgesToFinal = graph.edges.filter((e) => e.toNodeId === finalNode?.nodeId);
      expect(edgesToFinal.length).toBeGreaterThan(0);
    }
  });

  it('enforces UNAVAILABLE / MODIFIES guardrail: no edge into FINAL for unavailable or modifying divisional status', () => {
    const mockEvidence: DomainEvidence[] = [
      createDomainEvidence({
        id: 'EV_NATAL_1',
        sourceType: 'PLANET',
        domain: 'CAREER',
        polarity: 'SUPPORTING',
        statement: '10th lord strong',
        provenance: {
          evidenceId: 'EV_NATAL_1',
          ruleId: 'RULE_CAREER_01',
          axis: 'NATAL',
          source: 'D1',
          effect: 'SUPPORT',
          strength: 'PRIMARY',
          domain: 'CAREER'
        }
      })
    ];

    const careerGraphUnavailableD10 = buildCareerReasoningTraceGraph({
      evidence: mockEvidence,
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'NEUTRAL',
        divisionalStatus: 'UNAVAILABLE',
        manifestationStatus: 'INSUFFICIENT_DATA',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Neutral',
        divisionalEffect: 'Unavailable',
        keySupport: [],
        keyChallenges: [],
        summary: 'Test summary',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const divisionalNode = careerGraphUnavailableD10.nodes.find((n) => n.axis === 'DIVISIONAL');
    const finalNode = careerGraphUnavailableD10.nodes.find((n) => n.axis === 'FINAL');
    const edgesFromDivisionalToFinal = careerGraphUnavailableD10.edges.filter(
      (e) => e.fromNodeId === divisionalNode?.nodeId && e.toNodeId === finalNode?.nodeId
    );
    expect(edgesFromDivisionalToFinal.length).toBe(0);

    const wealthGraphUnavailableD2 = buildWealthReasoningTraceGraph({
      evidence: mockEvidence,
      overallStatus: 'STRONG',
      wealthFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'WEALTH',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'NEUTRAL',
        divisionalStatus: 'UNAVAILABLE',
        manifestationStatus: 'INSUFFICIENT_DATA',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Neutral',
        divisionalEffect: 'Unavailable',
        keySupport: [],
        keyChallenges: [],
        summary: 'Test summary',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const d2Node = wealthGraphUnavailableD2.nodes.find((n) => n.axis === 'DIVISIONAL');
    const wealthFinalNode = wealthGraphUnavailableD2.nodes.find((n) => n.axis === 'FINAL');
    const edgesFromD2ToFinal = wealthGraphUnavailableD2.edges.filter(
      (e) => e.fromNodeId === d2Node?.nodeId && e.toNodeId === wealthFinalNode?.nodeId
    );
    expect(edgesFromD2ToFinal.length).toBe(0);
  });

  it('enforces manifestation guardrail: zero or INSUFFICIENT_DATA manifestations emit NO MANIFESTS edge into FINAL', () => {
    const mockEvidence: DomainEvidence[] = [
      createDomainEvidence({
        id: 'EV_NATAL_1',
        sourceType: 'PLANET',
        domain: 'CAREER',
        polarity: 'SUPPORTING',
        statement: '10th lord strong',
        provenance: {
          evidenceId: 'EV_NATAL_1',
          ruleId: 'RULE_CAREER_01',
          axis: 'NATAL',
          source: 'D1',
          effect: 'SUPPORT',
          strength: 'PRIMARY',
          domain: 'CAREER'
        }
      })
    ];

    const graphNoManifestations = buildCareerReasoningTraceGraph({
      evidence: mockEvidence,
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'SUPPORT',
        divisionalStatus: 'CONFIRMS',
        manifestationStatus: 'INSUFFICIENT_DATA',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Supporting',
        divisionalEffect: 'Confirms',
        keySupport: [],
        keyChallenges: [],
        summary: 'Test summary',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const manifestNode = graphNoManifestations.nodes.find((n) => n.axis === 'MANIFESTATION');
    const finalNode = graphNoManifestations.nodes.find((n) => n.axis === 'FINAL');
    const manifestEdges = graphNoManifestations.edges.filter(
      (e) => e.fromNodeId === manifestNode?.nodeId && e.toNodeId === finalNode?.nodeId
    );
    expect(manifestEdges.length).toBe(0);

    const graphWithManifestations = buildCareerReasoningTraceGraph({
      evidence: mockEvidence,
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'SUPPORT',
        divisionalStatus: 'CONFIRMS',
        manifestationStatus: 'STRONG',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Supporting',
        divisionalEffect: 'Confirms',
        keySupport: [],
        keyChallenges: [],
        summary: 'Test summary',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const manifestNode2 = graphWithManifestations.nodes.find((n) => n.axis === 'MANIFESTATION');
    const finalNode2 = graphWithManifestations.nodes.find((n) => n.axis === 'FINAL');
    const manifestEdges2 = graphWithManifestations.edges.filter(
      (e) => e.fromNodeId === manifestNode2?.nodeId && e.toNodeId === finalNode2?.nodeId
    );
    expect(manifestEdges2.length).toBe(1);
    expect(manifestEdges2[0].type).toBe('MANIFESTS');
  });

  it('enforces partial Dasha activation: MIXED status produces MODIFIES edge into FINAL and not ACTIVATES', () => {
    const mockEvidence: DomainEvidence[] = [
      createDomainEvidence({
        id: 'EV_NATAL_1',
        sourceType: 'PLANET',
        domain: 'CAREER',
        polarity: 'SUPPORTING',
        statement: '10th lord strong',
        provenance: {
          evidenceId: 'EV_NATAL_1',
          ruleId: 'RULE_CAREER_01',
          axis: 'NATAL',
          source: 'D1',
          effect: 'SUPPORT',
          strength: 'PRIMARY',
          domain: 'CAREER'
        }
      })
    ];

    const graphMixedDasha = buildCareerReasoningTraceGraph({
      evidence: mockEvidence,
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'MODERATE',
        finalStatus: 'MODERATE',
        confidence: 'MEDIUM',
        promiseStatus: 'STRONG',
        activationStatus: 'MIXED',
        timingStatus: 'NEUTRAL',
        divisionalStatus: 'CONFIRMS',
        manifestationStatus: 'INSUFFICIENT_DATA',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Mixed',
        timingEffect: 'Neutral',
        divisionalEffect: 'Confirms',
        keySupport: [],
        keyChallenges: [],
        summary: 'Partial dasha test',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const dashaNode = graphMixedDasha.nodes.find((n) => n.axis === 'DASHA' && n.subjectKey === 'DASHA_ACTIVATION');
    const finalNode = graphMixedDasha.nodes.find((n) => n.axis === 'FINAL' && n.subjectKey === 'FINAL_SYNTHESIS');
    const dashaToFinalEdges = graphMixedDasha.edges.filter(
      (e) => e.fromNodeId === dashaNode?.nodeId && e.toNodeId === finalNode?.nodeId
    );

    expect(dashaToFinalEdges.length).toBe(1);
    expect(dashaToFinalEdges[0].type).toBe('MODIFIES');
  });

  it('guarantees full-pipeline deterministic graph outputs across multiple runs', () => {
    const firstCareer = interpretCareerV2(dummyHoroscope);
    const secondCareer = interpretCareerV2(dummyHoroscope);

    const firstCareerGraph = (firstCareer.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph }).reasoningTraceGraph;
    const secondCareerGraph = (secondCareer.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph }).reasoningTraceGraph;
    expect(firstCareerGraph).toEqual(secondCareerGraph);

    const firstWealth = interpretWealthV2(dummyHoroscope);
    const secondWealth = interpretWealthV2(dummyHoroscope);

    const firstWealthGraph = (firstWealth.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph }).reasoningTraceGraph;
    const secondWealthGraph = (secondWealth.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph }).reasoningTraceGraph;
    expect(firstWealthGraph).toEqual(secondWealthGraph);
  });

  it('guarantees evidence order independence in graph construction', () => {
    const evA = createDomainEvidence({
      id: 'EV_A',
      sourceType: 'PLANET',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      statement: 'Evidence A',
      provenance: {
        evidenceId: 'EV_A',
        ruleId: 'RULE_A',
        axis: 'NATAL',
        source: 'D1',
        effect: 'SUPPORT',
        strength: 'PRIMARY',
        domain: 'CAREER'
      }
    });
    const evB = createDomainEvidence({
      id: 'EV_B',
      sourceType: 'PLANET',
      domain: 'CAREER',
      polarity: 'CHALLENGING',
      statement: 'Evidence B',
      provenance: {
        evidenceId: 'EV_B',
        ruleId: 'RULE_B',
        axis: 'DASHA',
        source: 'DASHA',
        effect: 'CHALLENGE',
        strength: 'SECONDARY',
        domain: 'CAREER'
      }
    });
    const evC = createDomainEvidence({
      id: 'EV_C',
      sourceType: 'PLANET',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      statement: 'Evidence C',
      provenance: {
        evidenceId: 'EV_C',
        ruleId: 'RULE_C',
        axis: 'TIMING',
        source: 'TRANSIT',
        effect: 'SUPPORT',
        strength: 'SECONDARY',
        domain: 'CAREER'
      }
    });

    const finalSynth: CareerWealthFinalSynthesis = {
      reasoningVersion: 'CW-05',
      domain: 'CAREER',
      status: 'STRONG',
      finalStatus: 'STRONG',
      confidence: 'HIGH',
      promiseStatus: 'STRONG',
      activationStatus: 'SUPPORT',
      timingStatus: 'SUPPORT',
      divisionalStatus: 'CONFIRMS',
      manifestationStatus: 'STRONG',
      primaryPromise: 'STRONG',
      manifestationSummary: [],
      strongestAreas: [],
      challengedAreas: [],
      dashaEffect: 'Active',
      timingEffect: 'Supporting',
      divisionalEffect: 'Confirms',
      keySupport: [],
      keyChallenges: [],
      summary: 'Deterministic test',
      ruleIds: [],
      evidenceIds: [],
      natalEvidenceIds: [],
      natalRuleIds: []
    };

    const graphABC = buildCareerReasoningTraceGraph({
      evidence: [evA, evB, evC],
      natalStrength: 'STRONG',
      careerFinalSynthesis: finalSynth
    });

    const graphCAB = buildCareerReasoningTraceGraph({
      evidence: [evC, evA, evB],
      natalStrength: 'STRONG',
      careerFinalSynthesis: finalSynth
    });

    expect(graphABC).toEqual(graphCAB);
  });

  it('routes TIMING evidence to TIMING node and DASHA evidence to DASHA node', () => {
    const timingEv = createDomainEvidence({
      id: 'EV_TIMING',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      statement: 'Transit trigger',
      provenance: {
        evidenceId: 'EV_TIMING',
        ruleId: 'RULE_TIMING_01',
        axis: 'TIMING',
        source: 'TRANSIT',
        effect: 'SUPPORT',
        strength: 'SECONDARY',
        domain: 'CAREER'
      }
    });
    const dashaEv = createDomainEvidence({
      id: 'EV_DASHA',
      sourceType: 'DASHA',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      statement: 'Dasha activation',
      provenance: {
        evidenceId: 'EV_DASHA',
        ruleId: 'RULE_DASHA_01',
        axis: 'DASHA',
        source: 'DASHA',
        effect: 'SUPPORT',
        strength: 'SECONDARY',
        domain: 'CAREER'
      }
    });

    const graph = buildCareerReasoningTraceGraph({
      evidence: [timingEv, dashaEv],
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'SUPPORT',
        divisionalStatus: 'CONFIRMS',
        manifestationStatus: 'STRONG',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Supporting',
        divisionalEffect: 'Confirms',
        keySupport: [],
        keyChallenges: [],
        summary: 'Timing test',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    const timingNode = graph.nodes.find((n) => n.axis === 'TIMING' && n.subjectKey === 'TIMING_TRIGGER');
    const dashaNode = graph.nodes.find((n) => n.axis === 'DASHA' && n.subjectKey === 'DASHA_ACTIVATION');

    const timingEdge = graph.edges.find((e) => e.toNodeId === timingNode?.nodeId);
    expect(timingEdge).toBeDefined();
    expect(timingEdge?.type).toBe('ACTIVATES');

    const dashaEdge = graph.edges.find((e) => e.toNodeId === dashaNode?.nodeId);
    expect(dashaEdge).toBeDefined();
    expect(dashaEdge?.type).toBe('ACTIVATES');
  });

  it('does not create edges for NEUTRAL provenance effect', () => {
    const neutralEv = createDomainEvidence({
      id: 'EV_NEUTRAL',
      sourceType: 'PLANET',
      domain: 'CAREER',
      polarity: 'NEUTRAL',
      statement: 'Neutral evidence',
      provenance: {
        evidenceId: 'EV_NEUTRAL',
        ruleId: 'RULE_NEUTRAL_01',
        axis: 'NATAL',
        source: 'D1',
        effect: 'NEUTRAL',
        strength: 'SECONDARY',
        domain: 'CAREER'
      }
    });

    const graph = buildCareerReasoningTraceGraph({
      evidence: [neutralEv],
      natalStrength: 'STRONG',
      careerFinalSynthesis: {
        reasoningVersion: 'CW-05',
        domain: 'CAREER',
        status: 'STRONG',
        finalStatus: 'STRONG',
        confidence: 'HIGH',
        promiseStatus: 'STRONG',
        activationStatus: 'SUPPORT',
        timingStatus: 'NEUTRAL',
        divisionalStatus: 'UNAVAILABLE',
        manifestationStatus: 'INSUFFICIENT_DATA',
        primaryPromise: 'STRONG',
        manifestationSummary: [],
        strongestAreas: [],
        challengedAreas: [],
        dashaEffect: 'Active',
        timingEffect: 'Neutral',
        divisionalEffect: 'Unavailable',
        keySupport: [],
        keyChallenges: [],
        summary: 'Neutral test',
        ruleIds: [],
        evidenceIds: [],
        natalEvidenceIds: [],
        natalRuleIds: []
      }
    });

    // Evidence node should exist
    const evNode = graph.nodes.find((n) => n.evidenceId === 'EV_NEUTRAL');
    expect(evNode).toBeDefined();

    // But no edge originates from this node
    const outEdges = graph.edges.filter((e) => e.fromNodeId === evNode?.nodeId);
    expect(outEdges.length).toBe(0);
  });
});
