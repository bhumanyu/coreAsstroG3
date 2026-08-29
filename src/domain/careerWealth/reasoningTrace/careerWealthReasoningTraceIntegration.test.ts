import { describe, expect, it } from 'vitest';
import { interpretCareerV2, buildCareerReasoningTraceGraph } from '../../career/CareerDomainInterpreterV2';
import { interpretWealthV2, buildWealthReasoningTraceGraph } from '../../wealth/WealthDomainInterpreterV2';
import type { Horoscope } from '../../../types';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { ReasoningTraceGraph } from './reasoningTraceGraph';
import { validateReasoningTrace, validateEvidenceNodes } from './reasoningTraceValidator';

describe('Career & Wealth ReasoningTraceGraph Integration (CW-06B)', () => {
  const dummyHoroscope: Horoscope = {
    planets: [
      { name: 'Sun', longitude: 120, speed: 1, house: 5 },
      { name: 'Moon', longitude: 40, speed: 1, house: 2 },
      { name: 'Mars', longitude: 270, speed: 1, house: 10 },
      { name: 'Mercury', longitude: 150, speed: 1, house: 6 },
      { name: 'Jupiter', longitude: 280, speed: 1, house: 11 },
      { name: 'Venus', longitude: 60, speed: 1, house: 3 },
      { name: 'Saturn', longitude: 300, speed: 1, house: 11 },
      { name: 'Rahu', longitude: 10, speed: 1, house: 1 },
      { name: 'Ketu', longitude: 190, speed: 1, house: 7 }
    ],
    houses: [
      { number: 1, sign: 'Aries', degree: 10 },
      { number: 2, sign: 'Taurus', degree: 10 },
      { number: 3, sign: 'Gemini', degree: 10 },
      { number: 4, sign: 'Cancer', degree: 10 },
      { number: 5, sign: 'Leo', degree: 10 },
      { number: 6, sign: 'Virgo', degree: 10 },
      { number: 7, sign: 'Libra', degree: 10 },
      { number: 8, sign: 'Scorpio', degree: 10 },
      { number: 9, sign: 'Sagittarius', degree: 10 },
      { number: 10, sign: 'Capricorn', degree: 10 },
      { number: 11, sign: 'Aquarius', degree: 10 },
      { number: 12, sign: 'Pisces', degree: 10 }
    ],
    ascendant: { sign: 'Aries', degree: 10 }
  };

  it('populates valid reasoningTraceGraph on Career domain interpretation conclusionData with exact node requirements', () => {
    const interpretation = interpretCareerV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph };

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
  });

  it('populates valid reasoningTraceGraph on Wealth domain interpretation conclusionData with exact node requirements', () => {
    const interpretation = interpretWealthV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as { reasoningTraceGraph?: ReasoningTraceGraph };

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
  });

  it('enforces NEUTRAL guardrail: when D10/D2 relationship is NEUTRAL, there is no CONFIRMS edge into FINAL', () => {
    const mockEvidence: DomainEvidence[] = [
      {
        id: 'EV_NATAL_1',
        domain: 'CAREER',
        polarity: 'SUPPORTING',
        weight: 1,
        statement: '10th lord strong',
        provenance: {
          evidenceId: 'EV_NATAL_1',
          ruleId: 'RULE_CAREER_01',
          axis: 'NATAL',
          effect: 'SUPPORT',
          domain: 'CAREER'
        }
      }
    ];

    const careerGraphNeutralD10 = buildCareerReasoningTraceGraph({
      evidence: mockEvidence,
      natalStrength: 'STRONG',
      careerDashaSynthesis: { overallActivation: 'ACTIVE' } as any,
      d10Relationship: 'NEUTRAL',
      careerManifestationSynthesis: [],
      careerFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
    });

    const divisionalNode = careerGraphNeutralD10.nodes.find((n) => n.axis === 'DIVISIONAL');
    const confirmsEdgesFromDivisional = careerGraphNeutralD10.edges.filter(
      (e) => e.fromNodeId === divisionalNode?.nodeId
    );
    expect(confirmsEdgesFromDivisional.length).toBe(0);

    const wealthGraphNeutralD2 = buildWealthReasoningTraceGraph({
      evidence: mockEvidence,
      overallStatus: 'STRONG',
      d2Relationship: 'NEUTRAL',
      wealthManifestationSynthesis: undefined,
      wealthFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
    });

    const d2Node = wealthGraphNeutralD2.nodes.find((n) => n.axis === 'DIVISIONAL');
    const edgesFromD2 = wealthGraphNeutralD2.edges.filter(
      (e) => e.fromNodeId === d2Node?.nodeId
    );
    expect(edgesFromD2.length).toBe(0);
  });

  it('guarantees full-pipeline deterministic graph outputs across multiple runs', () => {
    const firstCareer = interpretCareerV2(dummyHoroscope);
    const secondCareer = interpretCareerV2(dummyHoroscope);

    expect(
      (firstCareer.conclusionData as any).reasoningTraceGraph
    ).toEqual(
      (secondCareer.conclusionData as any).reasoningTraceGraph
    );

    const firstWealth = interpretWealthV2(dummyHoroscope);
    const secondWealth = interpretWealthV2(dummyHoroscope);

    expect(
      (firstWealth.conclusionData as any).reasoningTraceGraph
    ).toEqual(
      (secondWealth.conclusionData as any).reasoningTraceGraph
    );
  });

  it('guarantees evidence order independence in graph construction', () => {
    const evA: DomainEvidence = {
      id: 'EV_A',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      weight: 1,
      statement: 'Evidence A',
      provenance: {
        evidenceId: 'EV_A',
        ruleId: 'RULE_A',
        axis: 'NATAL',
        effect: 'SUPPORT',
        domain: 'CAREER'
      }
    };
    const evB: DomainEvidence = {
      id: 'EV_B',
      domain: 'CAREER',
      polarity: 'CHALLENGING',
      weight: 1,
      statement: 'Evidence B',
      provenance: {
        evidenceId: 'EV_B',
        ruleId: 'RULE_B',
        axis: 'DASHA',
        effect: 'CHALLENGE',
        domain: 'CAREER'
      }
    };
    const evC: DomainEvidence = {
      id: 'EV_C',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      weight: 1,
      statement: 'Evidence C',
      provenance: {
        evidenceId: 'EV_C',
        ruleId: 'RULE_C',
        axis: 'TIMING',
        effect: 'SUPPORT',
        domain: 'CAREER'
      }
    };

    const graphABC = buildCareerReasoningTraceGraph({
      evidence: [evA, evB, evC],
      natalStrength: 'STRONG',
      careerDashaSynthesis: { overallActivation: 'ACTIVE' } as any,
      careerTimingSynthesis: { overallEffect: 'ACTIVATES' } as any,
      d10Relationship: 'CONFIRMS',
      careerManifestationSynthesis: [],
      careerFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
    });

    const graphCAB = buildCareerReasoningTraceGraph({
      evidence: [evC, evA, evB],
      natalStrength: 'STRONG',
      careerDashaSynthesis: { overallActivation: 'ACTIVE' } as any,
      careerTimingSynthesis: { overallEffect: 'ACTIVATES' } as any,
      d10Relationship: 'CONFIRMS',
      careerManifestationSynthesis: [],
      careerFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
    });

    expect(graphABC).toEqual(graphCAB);
  });

  it('routes TIMING evidence to TIMING node and DASHA evidence to DASHA node', () => {
    const timingEv: DomainEvidence = {
      id: 'EV_TIMING',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      weight: 1,
      statement: 'Transit trigger',
      provenance: {
        evidenceId: 'EV_TIMING',
        ruleId: 'RULE_TIMING_01',
        axis: 'TIMING',
        effect: 'SUPPORT',
        domain: 'CAREER'
      }
    };
    const dashaEv: DomainEvidence = {
      id: 'EV_DASHA',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      weight: 1,
      statement: 'Dasha activation',
      provenance: {
        evidenceId: 'EV_DASHA',
        ruleId: 'RULE_DASHA_01',
        axis: 'DASHA',
        effect: 'SUPPORT',
        domain: 'CAREER'
      }
    };

    const graph = buildCareerReasoningTraceGraph({
      evidence: [timingEv, dashaEv],
      natalStrength: 'STRONG',
      careerDashaSynthesis: { overallActivation: 'ACTIVE' } as any,
      careerTimingSynthesis: { overallEffect: 'ACTIVATES' } as any,
      d10Relationship: 'CONFIRMS',
      careerManifestationSynthesis: [],
      careerFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
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
    const neutralEv: DomainEvidence = {
      id: 'EV_NEUTRAL',
      domain: 'CAREER',
      polarity: 'NEUTRAL',
      weight: 0,
      statement: 'Neutral evidence',
      provenance: {
        evidenceId: 'EV_NEUTRAL',
        ruleId: 'RULE_NEUTRAL_01',
        axis: 'NATAL',
        effect: 'NEUTRAL',
        domain: 'CAREER'
      }
    };

    const graph = buildCareerReasoningTraceGraph({
      evidence: [neutralEv],
      natalStrength: 'STRONG',
      careerFinalSynthesis: { finalStatus: 'STRONG', confidence: 'HIGH' } as any
    });

    // Evidence node should exist
    const evNode = graph.nodes.find((n) => n.evidenceId === 'EV_NEUTRAL');
    expect(evNode).toBeDefined();

    // But no edge originates from this node
    const outEdges = graph.edges.filter((e) => e.fromNodeId === evNode?.nodeId);
    expect(outEdges.length).toBe(0);
  });
});

