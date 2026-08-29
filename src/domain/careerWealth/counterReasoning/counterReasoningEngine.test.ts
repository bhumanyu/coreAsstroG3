import { describe, expect, it } from 'vitest';
import {
  evaluateCounterReasoning,
  buildCounterReasoningContext
} from './counterReasoningEngine';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import { interpretCareerV2 } from '../../career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../wealth/WealthDomainInterpreterV2';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';

describe('counterReasoningEngine (CW-07)', () => {
  const sampleGraph: ReasoningTraceGraph = {
    traceId: 'CW-TRACE-CAREER',
    nodes: [
      {
        nodeId: 'node_ev_1',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'NATAL',
        evidenceId: 'EV_NATAL_1',
        subjectKey: 'RULE_10TH_LORD_EXALTED',
        label: '10th Lord Exalted'
      },
      {
        nodeId: 'node_ev_2',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'NATAL',
        evidenceId: 'EV_NATAL_2',
        subjectKey: 'RULE_SATURN_AFFLICTION',
        label: 'Saturn Affliction'
      },
      {
        nodeId: 'node_ev_3',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'DASHA',
        evidenceId: 'EV_DASHA_1',
        subjectKey: 'RULE_RAHU_DASHA',
        label: 'Rahu Dasha'
      },
      {
        nodeId: 'node_natal_promise',
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'NATAL',
        subjectKey: 'NATAL_PROMISE',
        label: 'Natal Promise'
      },
      {
        nodeId: 'node_dasha_activation',
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'DASHA',
        subjectKey: 'DASHA_ACTIVATION',
        label: 'Dasha Activation'
      },
      {
        nodeId: 'node_final_synthesis',
        type: 'SYNTHESIS',
        domain: 'CAREER',
        axis: 'FINAL',
        subjectKey: 'FINAL_SYNTHESIS',
        label: 'Final Career Synthesis'
      }
    ],
    edges: [
      {
        edgeId: 'e1',
        fromNodeId: 'node_ev_1',
        toNodeId: 'node_natal_promise',
        type: 'SUPPORTS',
        explanation: 'Supports career promise'
      },
      {
        edgeId: 'e2',
        fromNodeId: 'node_ev_2',
        toNodeId: 'node_natal_promise',
        type: 'CHALLENGES',
        explanation: 'Challenges career promise'
      },
      {
        edgeId: 'e3',
        fromNodeId: 'node_ev_3',
        toNodeId: 'node_dasha_activation',
        type: 'ACTIVATES',
        explanation: 'Activates career dasha'
      },
      {
        edgeId: 'e4',
        fromNodeId: 'node_natal_promise',
        toNodeId: 'node_final_synthesis',
        type: 'SUPPORTS',
        explanation: 'Natal supports final'
      },
      {
        edgeId: 'e5',
        fromNodeId: 'node_dasha_activation',
        toNodeId: 'node_final_synthesis',
        type: 'ACTIVATES',
        explanation: 'Dasha activates final'
      }
    ]
  };

  const sampleContext = buildCounterReasoningContext({
    domain: 'CAREER',
    graph: sampleGraph,
    finalSynthesis: {
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
      summary: 'Career strong',
      ruleIds: ['RULE_10TH_LORD_EXALTED'],
      evidenceIds: ['EV_NATAL_1', 'EV_NATAL_2', 'EV_DASHA_1'],
      natalEvidenceIds: ['EV_NATAL_1'],
      natalRuleIds: ['RULE_10TH_LORD_EXALTED']
    }
  });

  it('short-circuits WHAT_IF questions with UNSUPPORTED_CLAIM and conclusionChanged=false', () => {
    const result = evaluateCounterReasoning(
      'What if my Sun was in Aries instead of Libra?',
      sampleContext
    );

    expect(result.disposition).toBe('UNSUPPORTED_CLAIM');
    expect(result.conclusionChanged).toBe(false);
    expect(result.claim.questionType).toBe('WHAT_IF');
    expect(result.guardrailApplied).toBe(true);
    expect(result.guardrailReasons.some((r) => r.includes('What-if scenarios'))).toBe(true);
  });

  it('returns UNSUPPORTED_CLAIM when target subject cannot be found in the reasoning graph', () => {
    const result = evaluateCounterReasoning(
      'Does D10 divisional chart confirm my role?',
      sampleContext,
      { targetSubjectKey: 'UNKNOWN_NONEXISTENT_KEY' }
    );

    expect(result.disposition).toBe('UNSUPPORTED_CLAIM');
    expect(result.conclusionChanged).toBe(false);
    expect(result.rebuttal).toContain('could not be matched');
  });

  it('evaluates WHY questions targeting FINAL_SYNTHESIS with evidence and guardrails', () => {
    const result = evaluateCounterReasoning('Why is my career indicated to be strong?', sampleContext);

    expect(result.disposition).toBe('PARTIALLY_CONFIRMED');
    expect(result.conclusionChanged).toBe(false);
    expect(result.supportingEvidenceIds).toEqual(['EV_DASHA_1', 'EV_NATAL_1']);
    expect(result.challengingEvidenceIds).toEqual(['EV_NATAL_2']);
    expect(result.guardrailApplied).toBe(true);
  });

  it('evaluates Dasha challenge questions targeting DASHA_ACTIVATION', () => {
    const result = evaluateCounterReasoning('Is my current Dasha causing delays?', sampleContext);

    expect(result.claim.questionType).toBe('DASHA_CHALLENGE');
    expect(result.claim.targetSubjectKey).toBe('DASHA_ACTIVATION');
    expect(result.disposition).toBe('CONFIRMED');
    expect(result.supportingEvidenceIds).toEqual(['EV_DASHA_1']);
    expect(result.challengingEvidenceIds).toEqual([]);
    expect(result.conclusionChanged).toBe(false);
  });

  it('evaluates to INSUFFICIENT_EVIDENCE when node exists but has no incoming evidence', () => {
    const graphWithEmptyNode: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [
        {
          nodeId: 'node_d10',
          type: 'CONCLUSION',
          domain: 'CAREER',
          axis: 'DIVISIONAL',
          subjectKey: 'D10_CONFIRMATION',
          label: 'D10 Confirmation'
        }
      ],
      edges: []
    };

    const emptyContext = buildCounterReasoningContext({
      domain: 'CAREER',
      graph: graphWithEmptyNode
    });

    const result = evaluateCounterReasoning('Does D10 confirm?', emptyContext, {
      targetSubjectKey: 'D10_CONFIRMATION'
    });

    expect(result.disposition).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.conclusionChanged).toBe(false);
    expect(result.supportingEvidenceIds).toEqual([]);
    expect(result.challengingEvidenceIds).toEqual([]);
  });

  it('guarantees deterministic evaluation output regardless of node and edge insertion order in the graph', () => {
    const reorderedGraph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [
        sampleGraph.nodes[5],
        sampleGraph.nodes[4],
        sampleGraph.nodes[1],
        sampleGraph.nodes[3],
        sampleGraph.nodes[0],
        sampleGraph.nodes[2]
      ],
      edges: [
        sampleGraph.edges[4],
        sampleGraph.edges[2],
        sampleGraph.edges[0],
        sampleGraph.edges[3],
        sampleGraph.edges[1]
      ]
    };

    const reorderedContext = buildCounterReasoningContext({
      domain: 'CAREER',
      graph: reorderedGraph,
      finalSynthesis: sampleContext.finalSynthesis
    });

    const out1 = evaluateCounterReasoning('Why is career strong?', sampleContext);
    const out2 = evaluateCounterReasoning('Why is career strong?', reorderedContext);

    expect(out1).toEqual(out2);
  });

  it('integrates end-to-end with real Career interpretation on canonical fixture', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const careerInterp = interpretCareerV2(horoscope);
    const conclusionData = careerInterp.conclusionData as {
      reasoningTraceGraph?: ReasoningTraceGraph;
      careerFinalSynthesis?: any;
    };

    expect(conclusionData.reasoningTraceGraph).toBeDefined();
    const context = buildCounterReasoningContext({
      domain: 'CAREER',
      graph: conclusionData.reasoningTraceGraph!,
      finalSynthesis: conclusionData.careerFinalSynthesis
    });

    const whyCareer = evaluateCounterReasoning('Why is my career structured this way?', context);
    expect(whyCareer.disposition).toBeDefined();
    expect(whyCareer.conclusionChanged).toBe(false);
    expect(whyCareer.claim.targetSubjectKey).toBe('FINAL_SYNTHESIS');

    const dashaChallenge = evaluateCounterReasoning('Is my current Dasha causing trouble in career?', context);
    expect(dashaChallenge.disposition).toBeDefined();
    expect(dashaChallenge.claim.targetSubjectKey).toBe('DASHA_ACTIVATION');
    expect(dashaChallenge.conclusionChanged).toBe(false);

    const d10Challenge = evaluateCounterReasoning('Does the D10 chart conflict with this?', context);
    expect(d10Challenge.disposition).toBeDefined();
    expect(d10Challenge.claim.targetSubjectKey).toBe('D10_CONFIRMATION');
    expect(d10Challenge.conclusionChanged).toBe(false);
  });

  it('integrates end-to-end with real Wealth interpretation on canonical fixture', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const wealthInterp = interpretWealthV2(horoscope);
    const conclusionData = wealthInterp.conclusionData as {
      reasoningTraceGraph?: ReasoningTraceGraph;
      wealthFinalSynthesis?: any;
    };

    expect(conclusionData.reasoningTraceGraph).toBeDefined();
    const context = buildCounterReasoningContext({
      domain: 'WEALTH',
      graph: conclusionData.reasoningTraceGraph!,
      finalSynthesis: conclusionData.wealthFinalSynthesis
    });

    const whyWealth = evaluateCounterReasoning('Why is my wealth status evaluated this way?', context);
    expect(whyWealth.disposition).toBeDefined();
    expect(whyWealth.conclusionChanged).toBe(false);
    expect(whyWealth.claim.targetSubjectKey).toBe('FINAL_SYNTHESIS');

    const d2Challenge = evaluateCounterReasoning('Does D2 Hora chart support my wealth?', context);
    expect(d2Challenge.disposition).toBeDefined();
    expect(d2Challenge.claim.targetSubjectKey).toBe('D2_CONFIRMATION');
    expect(d2Challenge.conclusionChanged).toBe(false);

    const whatIf = evaluateCounterReasoning('What if Jupiter was placed in 8th house?', context);
    expect(whatIf.disposition).toBe('UNSUPPORTED_CLAIM');
    expect(whatIf.conclusionChanged).toBe(false);
  });
});
