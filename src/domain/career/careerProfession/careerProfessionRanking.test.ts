import { describe, expect, it } from 'vitest';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { CareerProfessionCandidate } from './careerProfessionTypes';
import { buildCareerProfessionRanking } from './careerProfessionRanking';

function candidate(params: {
  readonly domain: CareerProfessionCandidate['domain'];
  readonly family: CareerProfessionCandidate['family'];
  readonly id: string;
  readonly ruleId?: string;
  readonly basis?: CareerProfessionCandidate['basis'];
  readonly occurrenceIds?: readonly string[];
  readonly semanticIds?: readonly string[];
  readonly rootIds?: readonly string[];
  readonly d10Status?: CareerProfessionCandidate['d10Status'];
  readonly d10Direction?: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'UNDETERMINED';
  readonly d10OccurrenceIds?: readonly string[];
}): CareerProfessionCandidate {
  const d10Status = params.d10Status ?? 'NOT_PROVIDED';
  return {
    candidateId: params.id,
    domain: params.domain,
    family: params.family,
    basis: params.basis ?? 'EXPRESSION',
    expressionTypes: ['RESEARCH_WORK'],
    mechanismTypes: ['RESEARCH'],
    patternIds: ['PATTERN_1'],
    d10Status,
    ...(params.d10Direction ? {
      d10Qualification: {
        status: d10Status,
        direction: params.d10Direction,
        effects: params.d10Direction === 'SUPPORT' ? ['REINFORCES'] : params.d10Direction === 'CHALLENGE' ? ['CONFLICTS'] : ['QUALIFIES'],
        evidenceOccurrenceIds: params.d10OccurrenceIds ?? ['d10-occ-1'],
        counterEvidenceOccurrenceIds: params.d10Direction === 'CHALLENGE' ? (params.d10OccurrenceIds ?? ['d10-occ-1']) : [],
        rootIdentityKeys: ['root:d1:career:research']
      }
    } : {}),
    evidenceOccurrenceIds: params.occurrenceIds ?? [],
    semanticIdentityKeys: params.semanticIds ?? [],
    rootIdentityKeys: params.rootIds ?? [],
    evidence: [{
      evidenceId: `profession-evidence:${params.id}`,
      basis: params.basis ?? 'EXPRESSION',
      sourceIds: [`source:${params.id}`],
      ruleId: params.ruleId ?? 'RULE_PROFESSION_RESEARCH',
      statement: 'Broad research expression evidence'
    }],
    domainEvidenceIds: [...(params.occurrenceIds ?? [])],
    relatedEvidenceIds: [...(params.occurrenceIds ?? [])],
    ruleId: params.ruleId ?? 'RULE_PROFESSION_RESEARCH'
  };
}

function evidence(params: {
  readonly id: string;
  readonly identityKey: string;
  readonly rootEvidenceIds?: readonly string[];
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly strength?: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK';
  readonly priority?: number;
}): DomainEvidence {
  return {
    id: params.id,
    sourceType: 'STRUCTURAL',
    domain: 'CAREER',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: `Evidence ${params.id}`,
    polarity: params.polarity ?? 'SUPPORTING',
    strength: params.strength ?? 'STRONG',
    priority: params.priority ?? 1,
    relatedEvidenceIds: [],
    identityKey: params.identityKey,
    ...(params.rootEvidenceIds ? { rootEvidenceIds: params.rootEvidenceIds } : {})
  } as DomainEvidence;
}

describe('B04 deterministic profession-family ranking', () => {
  it('ranks multiple broad families by weighted linked evidence and retains alternatives', () => {
    const technology = candidate({
      id: 'pattern-tech', domain: 'TECHNOLOGY', family: 'TECHNICAL_LEADERSHIP',
      occurrenceIds: ['occ-tech'], semanticIds: ['identity-tech'], rootIds: ['root-tech']
    });
    const research = candidate({
      id: 'pattern-research', domain: 'RESEARCH', family: 'ANALYTICAL_RESEARCH',
      occurrenceIds: ['occ-research'], semanticIds: ['identity-research'], rootIds: ['root-research']
    });
    const result = buildCareerProfessionRanking({
      candidates: [research, technology],
      domainEvidence: [
        evidence({ id: 'occ-tech', identityKey: 'identity-tech', rootEvidenceIds: ['root-tech'], priority: 1 }),
        evidence({ id: 'occ-research', identityKey: 'identity-research', rootEvidenceIds: ['root-research'], priority: 3 })
      ],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates).toHaveLength(2);
    expect(result.rankedCandidates[0].domain).toBe('RESEARCH');
    expect(result.rankedCandidates[0].rank).toBe(1);
    expect(result.rankedCandidates[0].scoreContributions.reduce((sum, item) => sum + item.points, 0))
      .toBe(result.rankedCandidates[0].score);
    expect(result.rankedCandidates[0].scoreContributions.some(item =>
      item.referenceType === 'DOMAIN_EVIDENCE' && item.direction === 'SUPPORT'
    )).toBe(true);
    expect(result.rankedCandidates[1].rank).toBe(2);
    expect(result.rankedCandidates[1].alternativeExplanation).toContain('Retained as an alternative');
  });

  it('uses deterministic competition ranks and exposes ties', () => {
    const left = candidate({
      id: 'candidate-left', domain: 'FINANCE', family: 'FINANCIAL_SERVICES',
      occurrenceIds: ['occ-left'], semanticIds: ['identity-left'], rootIds: ['root-left']
    });
    const right = candidate({
      id: 'candidate-right', domain: 'EDUCATION', family: 'ACADEMIC_TEACHING',
      occurrenceIds: ['occ-right'], semanticIds: ['identity-right'], rootIds: ['root-right']
    });
    const result = buildCareerProfessionRanking({
      candidates: [right, left],
      domainEvidence: [
        evidence({ id: 'occ-left', identityKey: 'identity-left', rootEvidenceIds: ['root-left'] }),
        evidence({ id: 'occ-right', identityKey: 'identity-right', rootEvidenceIds: ['root-right'] })
      ],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates.map(item => item.rank)).toEqual([1, 1]);
    expect(result.rankedCandidates[1].alternativeExplanation).toContain('Tied with');
  });

  it('keeps candidate confidence separate from rank and score', () => {
    const item = candidate({
      id: 'candidate-confident', domain: 'RESEARCH', family: 'ANALYTICAL_RESEARCH',
      occurrenceIds: ['occ-1', 'occ-2'], semanticIds: ['identity-1', 'identity-2'],
      rootIds: ['root-1', 'root-2'], d10Status: 'QUALIFIED',
      d10Direction: 'SUPPORT', d10OccurrenceIds: ['d10-occ-1']
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      domainEvidence: [
        evidence({ id: 'occ-1', identityKey: 'identity-1', rootEvidenceIds: ['root-1'] }),
        evidence({ id: 'occ-2', identityKey: 'identity-2', rootEvidenceIds: ['root-2'] })
      ],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates[0].rank).toBe(1);
    expect(result.rankedCandidates[0].confidence).toBe('HIGH');
    expect(result.rankedCandidates[0].d10EvidenceOccurrenceIds).toEqual(['d10-occ-1']);
  });

  it('retains and exposes counter-evidence without deleting a candidate', () => {
    const item = candidate({
      id: 'candidate-conflict', domain: 'FINANCE', family: 'FINANCIAL_SERVICES',
      occurrenceIds: ['occ-support', 'occ-challenge'],
      semanticIds: ['identity-support', 'identity-challenge'],
      rootIds: ['root-support', 'root-challenge']
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      domainEvidence: [
        evidence({ id: 'occ-support', identityKey: 'identity-support', rootEvidenceIds: ['root-support'] }),
        evidence({ id: 'occ-challenge', identityKey: 'identity-challenge', rootEvidenceIds: ['root-challenge'], polarity: 'CHALLENGING' })
      ],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates).toHaveLength(1);
    expect(result.rankedCandidates[0].counterEvidenceOccurrenceIds).toEqual(['occ-challenge']);
    expect(result.rankedCandidates[0].counterEvidenceReasons).toContain('Evidence occ-challenge');
    expect(result.rankedCandidates[0].confidence).toBe('LOW');
  });

  it('marks missing D10 as partial and does not apply a D10 score bonus', () => {
    const item = candidate({
      id: 'candidate-no-d10', domain: 'SERVICE', family: 'PUBLIC_SERVICE',
      occurrenceIds: ['occ-service'], semanticIds: ['identity-service'], rootIds: ['root-service']
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      domainEvidence: [evidence({ id: 'occ-service', identityKey: 'identity-service', rootEvidenceIds: ['root-service'] })],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.status).toBe('PARTIAL');
    expect(result.rankedCandidates[0].d10Status).toBe('NOT_PROVIDED');
  });

  it('does not rank candidates when C11 does not establish a D1 promise', () => {
    const item = candidate({
      id: 'candidate-without-promise', domain: 'TECHNOLOGY', family: 'TECHNICAL_LEADERSHIP'
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      natalPromiseDirection: 'NEUTRAL'
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.rankedCandidates).toEqual([]);
    expect(result.diagnostics).toContain('D1_NATAL_PROMISE_NOT_ESTABLISHED');
  });

  it('distinguishes a mixed, contested D1 promise without admitting ranking', () => {
    const item = candidate({
      id: 'candidate-mixed-promise', domain: 'TECHNOLOGY', family: 'TECHNICAL_LEADERSHIP'
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      natalPromiseDirection: 'MIXED'
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.rankedCandidates).toEqual([]);
    expect(result.diagnostics).toContain('D1_NATAL_PROMISE_MIXED_CONTESTED');
  });

  it('does not let D10 qualification bypass the mixed D1 promise gate', () => {
    const item = candidate({
      id: 'candidate-mixed-d1-qualified-d10',
      domain: 'TECHNOLOGY',
      family: 'TECHNICAL_LEADERSHIP',
      occurrenceIds: ['occ-d1'],
      semanticIds: ['identity-d1'],
      rootIds: ['root-d1'],
      d10Status: 'QUALIFIED',
      d10Direction: 'SUPPORT',
      d10OccurrenceIds: ['occ-d10']
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      domainEvidence: [
        evidence({ id: 'occ-d1', identityKey: 'identity-d1', rootEvidenceIds: ['root-d1'] })
      ],
      natalPromiseDirection: 'MIXED'
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.rankedCandidates).toEqual([]);
    expect(result.diagnostics).toContain('D1_NATAL_PROMISE_MIXED_CONTESTED');
  });

  it('distinguishes a missing D1 direction from an unestablished promise', () => {
    const result = buildCareerProfessionRanking({
      candidates: [],
      natalPromiseDirection: undefined
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.diagnostics).toContain('D1_PROMISE_DIRECTION_NOT_PROVIDED');
  });

  it('is stable under candidate and evidence input permutation', () => {
    const a = candidate({
      id: 'candidate-a', domain: 'TECHNOLOGY', family: 'TECHNICAL_LEADERSHIP',
      occurrenceIds: ['occ-a'], semanticIds: ['identity-a'], rootIds: ['root-a']
    });
    const b = candidate({
      id: 'candidate-b', domain: 'RESEARCH', family: 'ANALYTICAL_RESEARCH',
      occurrenceIds: ['occ-b'], semanticIds: ['identity-b'], rootIds: ['root-b']
    });
    const evidenceA = evidence({ id: 'occ-a', identityKey: 'identity-a', rootEvidenceIds: ['root-a'] });
    const evidenceB = evidence({ id: 'occ-b', identityKey: 'identity-b', rootEvidenceIds: ['root-b'], priority: 2 });
    const first = buildCareerProfessionRanking({
      candidates: [a, b], domainEvidence: [evidenceA, evidenceB], natalPromiseDirection: 'SUPPORT'
    });
    const second = buildCareerProfessionRanking({
      candidates: [b, a], domainEvidence: [evidenceB, evidenceA], natalPromiseDirection: 'SUPPORT'
    });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('exposes expression-specific D10 challenge occurrence IDs as counter-evidence', () => {
    const item = candidate({
      id: 'candidate-d10-challenge',
      domain: 'TECHNOLOGY',
      family: 'TECHNICAL_LEADERSHIP',
      d10Status: 'CONFLICTED',
      d10Direction: 'CHALLENGE',
      d10OccurrenceIds: ['d10-challenge-occ']
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates[0].counterEvidenceOccurrenceIds).toContain('d10-challenge-occ');
    expect(result.rankedCandidates[0].d10Direction).toBe('CHALLENGE');
    expect(result.rankedCandidates[0].counterEvidenceReasons).toContain(
      'Expression-specific D10 challenge/weakening evidence is retained as counter-evidence.'
    );
  });


  it('groups pattern-scoped candidates into one stable domain/family identity', () => {
    const first = candidate({
      id: 'pattern-1-candidate',
      domain: 'TECHNOLOGY',
      family: 'TECHNICAL_LEADERSHIP',
      ruleId: 'RULE_TECH_LEAD',
      occurrenceIds: ['occ-pattern-1'],
      semanticIds: ['identity-1'],
      rootIds: ['root-1']
    });
    const second = candidate({
      id: 'pattern-2-candidate',
      domain: 'TECHNOLOGY',
      family: 'TECHNICAL_LEADERSHIP',
      ruleId: 'RULE_TECH_LEAD',
      occurrenceIds: ['occ-pattern-2'],
      semanticIds: ['identity-2'],
      rootIds: ['root-2']
    });
    const result = buildCareerProfessionRanking({
      candidates: [first, second],
      domainEvidence: [
        evidence({ id: 'occ-pattern-1', identityKey: 'identity-1', rootEvidenceIds: ['root-1'] }),
        evidence({ id: 'occ-pattern-2', identityKey: 'identity-2', rootEvidenceIds: ['root-2'] })
      ],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.rankedCandidates).toHaveLength(1);
    expect(result.rankedCandidates[0].candidateId).toBe('PROFESSION:TECHNOLOGY:TECHNICAL_LEADERSHIP');
    expect(result.rankedCandidates[0].supportingCandidateIds).toEqual(['pattern-1-candidate', 'pattern-2-candidate']);
    // One distinct rule contribution (+5), plus two STRONG × priority-1 evidence occurrences (+6).
    expect(result.rankedCandidates[0].score).toBe(11);
    expect(result.rankedCandidates[0].scoreContributions.filter(item => item.referenceType === 'PROFESSION_RULE')).toHaveLength(1);
    expect(result.rankedCandidates[0].scoreContributions.reduce((sum, item) => sum + item.points, 0)).toBe(11);
  });

  it('fails closed when duplicate canonical occurrence IDs are supplied', () => {
    const item = candidate({
      id: 'candidate-duplicate-evidence',
      domain: 'RESEARCH',
      family: 'ANALYTICAL_RESEARCH',
      occurrenceIds: ['duplicate-occ'],
      semanticIds: ['identity-1'],
      rootIds: ['root-1']
    });
    const duplicate = evidence({ id: 'duplicate-occ', identityKey: 'identity-1', rootEvidenceIds: ['root-1'] });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      domainEvidence: [duplicate, duplicate],
      natalPromiseDirection: 'SUPPORT'
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.rankedCandidates).toEqual([]);
    expect(result.diagnostics).toContain('DUPLICATE_DOMAIN_EVIDENCE_OCCURRENCE_ID');
  });


  it('keeps recommendation granularity at broad profession families, not planets or job titles', () => {
    const item = candidate({
      id: 'candidate-broad-technology',
      domain: 'TECHNOLOGY',
      family: 'TECHNICAL_LEADERSHIP'
    });
    const result = buildCareerProfessionRanking({
      candidates: [item],
      natalPromiseDirection: 'SUPPORT'
    });
    const ranked = result.rankedCandidates[0];

    expect(ranked.candidateId).toBe('PROFESSION:TECHNOLOGY:TECHNICAL_LEADERSHIP');
    expect(ranked.domain).toBe('TECHNOLOGY');
    expect(ranked.family).toBe('TECHNICAL_LEADERSHIP');
    expect(ranked).not.toHaveProperty('planet');
    expect(ranked).not.toHaveProperty('jobTitle');
  });

});