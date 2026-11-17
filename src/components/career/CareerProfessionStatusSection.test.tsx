import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerProfessionStatusSection } from './CareerProfessionStatusSection';
import { CareerExpressionSection } from './CareerExpressionSection';
import { getCareerProfessionStatusCopy, type CareerProfessionStatus } from '../../product/analysis/careerQualificationPresentation';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';
import type { ProductCareerPatternQualification } from '../../product/analysis/productAnalysisTypes';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import i18n from '../../i18n/i18n';

const engineStageCounts: NonNullable<CareerProfessionViewModel['stageCounts']> = Object.freeze({
  inputExpressions: 8,
  matchedRules: 5,
  generatedCandidates: 4,
  d10QualifiedCandidates: 3,
  d10RemovedCandidates: 1,
  rankingEligibleCandidates: 2,
  rankedCandidates: 2
});

const unqualifiedPattern: ProductCareerPatternQualification = {
  patternId: 'PATTERN_UNQUALIFIED_1',
  classification: 'CAREER_HOUSE_NETWORK',
  name: 'Career-house network',
  status: 'UNQUALIFIED',
  decisionBlockingReasons: [{
    kind: 'INSUFFICIENT_STRUCTURAL_EVIDENCE',
    reason: 'The required structural evidence was not established.'
  }],
  deferredDimensions: ['ACTIVATION_POTENTIAL'],
  participants: [{
    planet: 'JUPITER',
    relevance: 'PRIMARY',
    condition: 'WEAK',
    conditionAssessment: 'FULL',
    combustion: 'COMBUST',
    affliction: 'MILD',
    dignity: 'ENEMY_SIGN',
    positiveFactorLabels: ['DIGNITY'],
    negativeFactorLabels: ['COMBUSTION', 'MALEFIC_PRESSURE']
  }]
};

const statuses: readonly CareerProfessionStatus[] = [
  'COMPLETE',
  'PARTIAL',
  'INSUFFICIENT_DATA'
];

describe('CareerProfessionStatusSection', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it.each(statuses)('renders the localized label for %s without exposing its enum value', (status) => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status,
      statusCopy: getCareerProfessionStatusCopy(status)
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('heading', { name: 'Profession Analysis Status' })).toBeInTheDocument();
    const expectedLabel = {
      COMPLETE: 'Analysis complete',
      PARTIAL: 'Partial analysis',
      INSUFFICIENT_DATA: 'Insufficient data'
    }[status];
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    expect(screen.queryByText(status)).not.toBeInTheDocument();
    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
  });

  it('does not portray insufficient profession data as a negative career prediction', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      missingInputs: ['career10HFoundation'],
      statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const renderedText = screen.getByRole('region', {
      name: 'Profession Analysis Status'
    }).textContent?.toLowerCase() ?? '';
    expect(renderedText).not.toContain('no career promise');
    expect(renderedText).not.toContain('no career potential');
    expect(renderedText).toContain('not a negative career prediction');
    expect(renderedText).toContain('10th-house career foundation');
  });

  it('does not label a partial profession analysis as mixed or neutral', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'PARTIAL' as const,
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.queryByText('PARTIAL')).not.toBeInTheDocument();
    expect(screen.getByText('Partial analysis')).toBeInTheDocument();
    expect(screen.queryByText(/mixed|neutral/i)).not.toBeInTheDocument();
  });

  it('uses the generic non-negative explanation when C8 coverage is absent', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      coverageSummary: undefined,
      missingInputs: [],
      statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByText(/No resolved career mechanisms/)).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Missing profession analysis inputs' })).not.toBeInTheDocument();
    expect(screen.queryByText('Missing inputs')).not.toBeInTheDocument();
  });

  it('attributes insufficient profession data to zero resolved mechanisms without a negative prediction', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        patternCandidateRecordCount: 2,
        distinctCandidateIdCount: 2,
        conflictedCandidateCount: 0,
        conflictedQualificationCount: 0,
        qualificationResultMissingCount: 0,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(/No resolved career mechanisms were available to derive profession candidates/)).toBeInTheDocument();
    expect(screen.getByText(/This is not a negative career prediction/)).toBeInTheDocument();
    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
  });

  it('uses the generic non-negative explanation when qualification-result diagnostics are incomplete', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByText(/No resolved career mechanisms/)).not.toBeInTheDocument();
    expect(screen.getByText(/This status alone is not a negative career prediction/)).toBeInTheDocument();
  });

  it('uses the generic explanation for persisted coverage without quarantine counters', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        qualificationResultMissingCount: 0,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByText(/No resolved career mechanisms/)).not.toBeInTheDocument();
    expect(screen.getByText(/This status alone is not a negative career prediction/)).toBeInTheDocument();
  });

  it('renders generic explanations for persisted analyses with legacy partial C8 coverage', () => {
    const base = createProductAnalysis();
    const legacyAnalysis = createProductAnalysis({
      career: {
        ...base.career,
        expression: {
          analysisStatus: 'EXECUTED',
          candidates: [],
          coverageSummary: {
            mechanismCandidateCount: 0,
            expressionCount: 0,
            expressionsWithEvidenceCount: 0,
            evidenceCount: 0,
            evidenceWithPlanetAttributionCount: 0
          }
        }
      }
    });
    const viewModel = selectCareerViewModel(legacyAnalysis);
    const profession = {
      ...viewModel.profession,
      status: 'INSUFFICIENT_DATA' as const,
      statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA')
    };

    render(
      <>
        <CareerExpressionSection expression={viewModel.expression} />
        <CareerProfessionStatusSection profession={profession} />
      </>
    );

    expect(screen.getByText('The expression analysis completed without producing candidates.')).toBeInTheDocument();
    expect(screen.queryByText('No career patterns were discovered.')).not.toBeInTheDocument();
    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByText(/No resolved career mechanisms/)).not.toBeInTheDocument();
  });

  it('renders labels for each known missing input and preserves the generic explanation', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'PARTIAL' as const,
      missingInputs: [
        'career10HFoundation',
        'career10LFoundation',
        'careerD10CanonicalAnalysis',
        'domainEvidence'
      ],
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Missing profession analysis inputs' });
    expect(list).toHaveTextContent('10th-house career foundation');
    expect(list).toHaveTextContent('10th-lord career foundation');
    expect(list).toHaveTextContent('Canonical D10 career analysis');
    expect(list).toHaveTextContent('Career domain evidence');
  });

  it('distinguishes unmatched expressions and ranking-gate rejection', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      diagnostics: [
        'NO_PROFESSION_RULE_MATCHED',
        'PROFESSION_RANKING_REJECTED_BY_D1_GATE'
      ]
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const list = screen.getByRole('list', { name: 'Profession analysis diagnostics' });
    expect(list).toHaveTextContent('Expression candidates were present, but no profession rule matched');
    expect(list).toHaveTextContent('Candidates exist, but the D1 promise gate rejected ranking');
  });

  it('uses the canonical profession status rather than display-copy wording as its key', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'PARTIAL' as const,
      statusCopy: getCareerProfessionStatusCopy('COMPLETE')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText('Partial analysis')).toBeInTheDocument();
    expect(screen.queryByText('Analysis complete')).not.toBeInTheDocument();
  });

  it('falls back to the raw key for an unmapped missing input', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      missingInputs: ['futureEngineInput'],
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('list', { name: 'Missing profession analysis inputs' }))
      .toHaveTextContent('futureEngineInput');
  });

  it('renders profession candidates with their evidence provenance and linkage', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: {
        inputExpressions: 1,
        matchedRules: 1,
        generatedCandidates: 1,
        d10QualifiedCandidates: 1,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      },
      candidates: [{
        candidateId: 'PROFESSION_TECH_PATTERN_1',
        domain: 'TECHNOLOGY',
        family: 'TECHNICAL_LEADERSHIP',
        basis: 'EXPRESSION',
        expressionTypes: ['LEADERSHIP_EXPRESSION'],
        mechanismTypes: ['LEADERSHIP'],
        patternIds: ['PATTERN_1'],
        d10Status: 'NOT_PROVIDED',
        evidenceOccurrenceIds: ['OCCURRENCE_1'],
        semanticIdentityKeys: ['IDENTITY_1'],
        rootIdentityKeys: ['ROOT_1'],
        evidence: [{
          evidenceId: 'PROFESSION_EVIDENCE_1',
          basis: 'EXPRESSION',
          sourceIds: ['EXPRESSION_CANDIDATE_1', 'MECHANISM_CANDIDATE_1'],
          ruleId: 'CAREER_PROFESSION_RULE_TECH_LEADERSHIP',
          statement: 'Leadership expression links to a technology family.',
          linkage: 'PARTIAL',
          unresolvedMechanismIds: ['MECHANISM_UNRESOLVED_1']
        }],
        domainEvidenceIds: ['DOMAIN_EVIDENCE_1'],
        relatedEvidenceIds: [],
        ruleId: 'CAREER_PROFESSION_RULE_TECH_LEADERSHIP'
      }]
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    const candidates = screen.getByRole('list', { name: 'Profession candidates' });
    expect(candidates).toHaveTextContent('Technology · Technical leadership (PROFESSION_TECH_PATTERN_1)');
    expect(candidates).toHaveTextContent('Basis: Career expression');
    expect(candidates).toHaveTextContent('D10 status: Not provided');
    expect(candidates).toHaveTextContent('Pattern refs: PATTERN_1');
    expect(candidates).toHaveTextContent('Expressions: Leadership expression');
    expect(candidates).toHaveTextContent('Mechanism types: Leadership');
    expect(candidates).toHaveTextContent('Evidence ID: PROFESSION_EVIDENCE_1');
    expect(candidates).toHaveTextContent('Rule ID: CAREER_PROFESSION_RULE_TECH_LEADERSHIP');
    expect(candidates).toHaveTextContent('Source IDs: EXPRESSION_CANDIDATE_1, MECHANISM_CANDIDATE_1');
    expect(candidates).toHaveTextContent('Linkage: Partial');
    expect(candidates).toHaveTextContent('Unresolved mechanism IDs: MECHANISM_UNRESOLVED_1');
    expect(screen.getByRole('list', { name: 'Profession analysis stages' })).toHaveTextContent('Ranking-eligible0');
    expect(screen.queryByRole('list', { name: 'Ranked profession families' })).not.toBeInTheDocument();
  });

  it('preserves the D1 gate diagnostic and unavailable ranking when the D1 promise is mixed', () => {
    const base = selectCareerViewModel(createProductAnalysis()).profession;
    const profession = {
      ...base,
      stageCounts: {
        inputExpressions: 1,
        matchedRules: 1,
        generatedCandidates: 1,
        d10QualifiedCandidates: 1,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 1,
        rankedCandidates: 0
      },
      ranking: {
        ...base.ranking,
        status: 'UNAVAILABLE' as const,
        diagnostics: ['PROFESSION_RANKING_REJECTED_BY_D1_GATE'],
        rankedCandidates: []
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('list', { name: 'Profession ranking diagnostics' }))
      .toHaveTextContent('Candidates exist, but the D1 promise gate rejected ranking');
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Ranked profession families' })).not.toBeInTheDocument();
  });

  it('renders profession display enums in Hindi while preserving canonical candidate IDs', async () => {
    await i18n.changeLanguage('hi');
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      candidates: [{
        candidateId: 'PROFESSION_TECH_PATTERN_1',
        domain: 'TECHNOLOGY',
        family: 'TECHNICAL_LEADERSHIP',
        basis: 'EXPRESSION',
        expressionTypes: ['LEADERSHIP_EXPRESSION'],
        mechanismTypes: ['LEADERSHIP'],
        patternIds: ['PATTERN_1'],
        d10Status: 'NOT_PROVIDED',
        evidenceOccurrenceIds: [],
        semanticIdentityKeys: [],
        rootIdentityKeys: [],
        evidence: [],
        domainEvidenceIds: [],
        relatedEvidenceIds: [],
        ruleId: 'CAREER_PROFESSION_RULE_TECH_LEADERSHIP'
      }]
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    const rendered = screen.getByRole('list', { name: 'व्यवसाय उम्मीदवार' });
    expect(rendered).toHaveTextContent('प्रौद्योगिकी · तकनीकी नेतृत्व (PROFESSION_TECH_PATTERN_1)');
    expect(rendered).toHaveTextContent('करियर अभिव्यक्ति');
    expect(rendered).toHaveTextContent('नेतृत्व अभिव्यक्ति');
    expect(rendered).toHaveTextContent('नेतृत्व');
    expect(rendered).not.toHaveTextContent('TECHNOLOGY|TECHNICAL_LEADERSHIP|EXPRESSION|LEADERSHIP_EXPRESSION');
  });

  it('renders a non-conclusory empty state when no profession candidates exist', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      candidates: []
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    const region = screen.getByRole('region', { name: 'Profession Analysis Status' });
    expect(region).toHaveTextContent('No profession candidates are available from the current inputs.');
    expect(region).toHaveTextContent('This is not a negative career conclusion.');
    expect(region).not.toHaveTextContent(/no career promise|no career potential/i);
  });

  it('renders each validated engine stage count with its localized label', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: engineStageCounts
    };

    expect(profession.stageCounts).toBe(engineStageCounts);
    render(<CareerProfessionStatusSection profession={profession} />);

    const funnel = screen.getByRole('list', { name: 'Profession analysis stages' });
    expect(screen.getByRole('heading', { name: 'Profession engine stage counts' })).toBeInTheDocument();
    const stages = [...funnel.querySelectorAll('li')];
    expect(stages.map(item => item.querySelector('span:last-child')?.textContent))
      .toEqual(Object.values(engineStageCounts).map(String));
    expect(stages.map(item => item.querySelector('span:first-child')?.textContent)).toEqual([
      '1. Input expressions',
      '2. Matched rules',
      '3. Generated candidates',
      '4. D10-qualified',
      '5. D10-removed',
      '6. Ranking-eligible',
      '7. Ranked'
    ]);
  });

  it('renders unqualified pattern reasons and participant factors with localized labels', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      patternQualifications: [unqualifiedPattern]
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const breakdown = screen.getByRole('list', { name: 'Pattern qualification breakdown' });
    expect(screen.getByRole('heading', { name: 'Pattern Qualification Breakdown' })).toBeInTheDocument();
    expect(breakdown).toHaveTextContent('Career-house network · Career-house network');
    expect(breakdown).toHaveTextContent('Unqualified');
    expect(screen.getByRole('list', { name: 'Decision-blocking reasons' }))
      .toHaveTextContent('Insufficient structural evidence: The required structural evidence was not established.');
    expect(screen.getByRole('list', { name: 'Pattern participant evidence' }))
      .toHaveTextContent('Jupiter — Primary relevance, Weak condition (Full assessment): combustion: Combust; affliction: Mild; dignity: Enemy sign; positive factors: Dignity; negative factors: Combustion, Malefic pressure');
    expect(breakdown).toHaveTextContent('Deferred dimensions: Activation potential');
  });

  it('renders INSUFFICIENT_DATA distinctly from UNQUALIFIED in mixed pattern results', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      patternQualifications: [
        unqualifiedPattern,
        {
          ...unqualifiedPattern,
          patternId: 'PATTERN_INSUFFICIENT_1',
          name: 'Incomplete pattern',
          status: 'INSUFFICIENT_DATA' as const,
          decisionBlockingReasons: [{
            kind: 'MISSING_INPUT' as const,
            reason: 'Condition evidence was unavailable.'
          }]
        }
      ]
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const breakdown = screen.getByRole('list', { name: 'Pattern qualification breakdown' });
    expect(breakdown).toHaveTextContent('Unqualified');
    expect(breakdown).toHaveTextContent('Insufficient data');
    expect(breakdown.children).toHaveLength(2);
  });

  it('hides the pattern qualification section when legacy records omit the projection', () => {
    const profession = selectCareerViewModel(createProductAnalysis()).profession;
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.queryByRole('list', { name: 'Pattern qualification breakdown' })).not.toBeInTheDocument();
  });

  it('renders pattern qualification labels and evidence in Hindi', async () => {
    await i18n.changeLanguage('hi');
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      patternQualifications: [{
        ...unqualifiedPattern,
        status: 'INSUFFICIENT_DATA' as const,
        decisionBlockingReasons: [{
          kind: 'MISSING_INPUT' as const,
          reason: 'Condition evidence was unavailable.'
        }]
      }]
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const breakdown = screen.getByRole('list', { name: 'पैटर्न योग्यता विवरण' });
    expect(screen.getByRole('heading', { name: 'पैटर्न योग्यता विवरण' })).toBeInTheDocument();
    expect(breakdown).toHaveTextContent('अपर्याप्त डेटा');
    expect(breakdown).toHaveTextContent('अनुपलब्ध इनपुट');
    expect(breakdown).toHaveTextContent('बृहस्पति — प्राथमिक प्रासंगिकता, कमज़ोर स्थिति (पूर्ण आकलन)');
    expect(breakdown).toHaveTextContent('नकारात्मक कारक: दहन, पाप प्रभाव का दबाव');
  });

  it('hides the stage funnel when legacy records omit stage counts', () => {
    const profession = selectCareerViewModel(createProductAnalysis()).profession;
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.queryByRole('list', { name: 'Profession analysis stages' })).not.toBeInTheDocument();
  });

  it.each([
    ['negative count', { ...engineStageCounts, matchedRules: -1 }],
    ['fractional count', { ...engineStageCounts, generatedCandidates: 1.5 }],
    ['inconsistent D10 totals', { ...engineStageCounts, d10RemovedCandidates: 0 }],
    ['incomplete counts', {
      inputExpressions: 8,
      matchedRules: 5,
      generatedCandidates: 4,
      d10QualifiedCandidates: 3,
      d10RemovedCandidates: 1,
      rankingEligibleCandidates: 2
    }]
  ])('hides the stage funnel for %s', (_description, stageCounts) => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: stageCounts as NonNullable<CareerProfessionViewModel['stageCounts']>
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.queryByRole('list', { name: 'Profession analysis stages' })).not.toBeInTheDocument();
  });

  it.each([
    [
      { ...engineStageCounts, matchedRules: 0 },
      'No profession rule matched the resolved expressions.'
    ],
    [
      {
        ...engineStageCounts,
        generatedCandidates: 0,
        d10QualifiedCandidates: 0,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      },
      'Rules matched, but no profession candidates were generated.'
    ],
    [
      {
        ...engineStageCounts,
        generatedCandidates: 4,
        d10QualifiedCandidates: 0,
        d10RemovedCandidates: 4,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      },
      'Candidates were generated, but none passed D10 qualification.'
    ],
    [
      {
        ...engineStageCounts,
        d10QualifiedCandidates: 3,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      },
      'Candidates passed D10, but none met the full evidence-linkage requirement for ranking'
    ]
  ])('explains the pipeline stage without changing status for %s', (stageCounts, expectedExplanation) => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: stageCounts as NonNullable<CareerProfessionViewModel['stageCounts']>
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(new RegExp(expectedExplanation))).toBeInTheDocument();
    expect(screen.getByText(/This is not a negative career prediction/)).toBeInTheDocument();
  });

  it('prefers a specific downstream explanation to the zero-mechanism fallback', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        patternCandidateRecordCount: 2,
        distinctCandidateIdCount: 2,
        conflictedCandidateCount: 0,
        conflictedQualificationCount: 0,
        qualificationResultMissingCount: 0,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      },
      stageCounts: { ...engineStageCounts, matchedRules: 0 }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(/No profession rule matched the resolved expressions/)).toBeInTheDocument();
    expect(screen.queryByText(/No resolved career mechanisms were available/)).not.toBeInTheDocument();
  });

  it.each([
    ['missing inputs', ['domainEvidence'], []],
    ['missing-input diagnostic', [], ['PROFESSION_INPUTS_MISSING']]
  ])('uses the generic explanation for %s but keeps factual stage counts', (_case, missingInputs, diagnostics) => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      missingInputs,
      diagnostics,
      stageCounts: { ...engineStageCounts, matchedRules: 0 }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByText(/No profession rule matched the resolved expressions/)).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Profession analysis stages' })).toBeInTheDocument();
  });

  it('explains that zero expressions prevented profession rules from being evaluated', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: {
        inputExpressions: 0,
        matchedRules: 0,
        generatedCandidates: 0,
        d10QualifiedCandidates: 0,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(/No career expressions were produced upstream, so the profession engine had no inputs to evaluate/))
      .toBeInTheDocument();
  });

  it('renders upstream coverage counts when no expressions reached the profession engine', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: {
        inputExpressions: 0,
        matchedRules: 0,
        generatedCandidates: 0,
        d10QualifiedCandidates: 0,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      },
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        patternCandidateRecordCount: 2,
        distinctCandidateIdCount: 2,
        conflictedCandidateCount: 0,
        conflictedQualificationCount: 0,
        qualificationResultMissingCount: 0,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(
      'Upstream coverage: 2 patterns detected → 1 qualified → 1 eligible → 0 mechanisms resolved → 0 expressions.'
    )).toBeInTheDocument();
  });

  it('allows matched-rule counts to exceed input-expression counts', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts: { ...engineStageCounts, inputExpressions: 2 }
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('list', { name: 'Profession analysis stages' })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('localizes all funnel labels and stage explanations in Hindi', async () => {
    await i18n.changeLanguage('hi');
    const makeProfession = (stageCounts: NonNullable<CareerProfessionViewModel['stageCounts']>) => ({
      ...selectCareerViewModel(createProductAnalysis()).profession,
      stageCounts
    });
    const profession = makeProfession({ ...engineStageCounts, matchedRules: 0 });
    const { rerender } = render(<CareerProfessionStatusSection profession={profession} />);

    const funnel = screen.getByRole('list', { name: 'व्यवसाय विश्लेषण के चरण' });
    expect(funnel).toHaveTextContent('इनपुट अभिव्यक्तियाँ');
    expect(funnel).toHaveTextContent('मेल खाने वाले नियम');
    expect(funnel).toHaveTextContent('बनाए गए उम्मीदवार');
    expect(funnel).toHaveTextContent('D10 में योग्य');
    expect(funnel).toHaveTextContent('D10 से हटाए गए');
    expect(funnel).toHaveTextContent('क्रम निर्धारण के योग्य');
    expect(funnel).toHaveTextContent('क्रमबद्ध');
    expect(screen.getByRole('heading', { name: 'व्यवसाय इंजन के चरणों की गणना' })).toBeInTheDocument();
    expect(screen.getByText(/समाधान की गई अभिव्यक्तियों से कोई व्यवसाय नियम मेल नहीं खाया/)).toBeInTheDocument();
    expect(screen.getByText(/यह नकारात्मक करियर पूर्वानुमान नहीं है/)).toBeInTheDocument();

    rerender(<CareerProfessionStatusSection profession={makeProfession({
      ...engineStageCounts,
      generatedCandidates: 0,
      d10QualifiedCandidates: 0,
      d10RemovedCandidates: 0,
      rankingEligibleCandidates: 0,
      rankedCandidates: 0
    })} />);
    expect(screen.getByText(/नियम मेल खाए, लेकिन कोई व्यवसाय उम्मीदवार नहीं बना/)).toBeInTheDocument();
    expect(screen.getByText(/यह नकारात्मक करियर पूर्वानुमान नहीं है/)).toBeInTheDocument();

    rerender(<CareerProfessionStatusSection profession={makeProfession({
      ...engineStageCounts,
      generatedCandidates: 4,
      d10QualifiedCandidates: 0,
      d10RemovedCandidates: 4,
      rankingEligibleCandidates: 0,
      rankedCandidates: 0
    })} />);
    expect(screen.getByText(/उम्मीदवार बने, लेकिन कोई भी D10 योग्यता में सफल नहीं हुआ/)).toBeInTheDocument();
    expect(screen.getByText(/यह नकारात्मक करियर पूर्वानुमान नहीं है/)).toBeInTheDocument();

    rerender(<CareerProfessionStatusSection profession={makeProfession({
      ...engineStageCounts,
      rankingEligibleCandidates: 0,
      rankedCandidates: 0
    })} />);
    expect(screen.getByText(/क्रम निर्धारण के लिए पूर्ण साक्ष्य-संबंध आवश्यकता पूरी नहीं कर सका/)).toBeInTheDocument();
    expect(screen.getByText(/यह नकारात्मक करियर पूर्वानुमान नहीं है/)).toBeInTheDocument();

    rerender(<CareerProfessionStatusSection profession={{
      ...makeProfession({
        inputExpressions: 0,
        matchedRules: 0,
        generatedCandidates: 0,
        d10QualifiedCandidates: 0,
        d10RemovedCandidates: 0,
        rankingEligibleCandidates: 0,
        rankedCandidates: 0
      }),
      coverageSummary: {
        mechanismCandidateCount: 0,
        patternCandidateCount: 2,
        patternCandidateRecordCount: 2,
        distinctCandidateIdCount: 2,
        conflictedCandidateCount: 0,
        conflictedQualificationCount: 0,
        qualificationResultMissingCount: 0,
        qualifiedPatternCount: 1,
        eligiblePatternCount: 1,
        invalidRolePatternCount: 0,
        roleAssignmentSkippedPatternCount: 0,
        resolvedMechanismCount: 0,
        networkResolutionStatus: 'RESOLVED' as const,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      }
    }} />);
    expect(screen.getByText(/ऊपरी चरण में कोई करियर अभिव्यक्ति नहीं बनी/)).toBeInTheDocument();
    expect(screen.getByText(
      'पूर्ववर्ती कवरेज: 2 पैटर्न मिले → 1 योग्य → 1 पात्र → 0 तंत्र हल हुए → 0 अभिव्यक्तियाँ।'
    )).toBeInTheDocument();
  });
});

  it('renders deterministic profession-family rank, score, confidence, reasons, and counter-evidence', () => {
    const base = selectCareerViewModel(createProductAnalysis()).profession;
    const profession = {
      ...base,
      ranking: {
        policyVersion: 'B04-PROFESSION-RANKING-v1' as const,
        status: 'PARTIAL' as const,
        diagnostics: ['D10_QUALIFICATION_PARTIAL'],
        rankedCandidates: [{
          candidateId: 'PROFESSION:TECHNOLOGY:TECHNICAL_LEADERSHIP',
          domain: 'TECHNOLOGY',
          family: 'TECHNICAL_LEADERSHIP',
          rank: 1,
          score: 14,
          scoreContributions: [{
            referenceType: 'PROFESSION_RULE' as const,
            referenceId: 'RULE_TECHNICAL_LEADERSHIP',
            direction: 'SUPPORT' as const,
            points: 8,
            explanation: 'The profession rule contributes +8 base points.'
          }, {
            referenceType: 'DOMAIN_EVIDENCE' as const,
            referenceId: 'occ-d1-1',
            direction: 'SUPPORT' as const,
            points: 6,
            explanation: 'Strong evidence × priority 2 contributes +6 points.'
          }, {
            referenceType: 'D10_QUALIFICATION' as const,
            referenceId: 'occ-d10-1',
            direction: 'NEUTRAL' as const,
            points: 0,
            explanation: 'Mixed D10 does not change the score.'
          }],
          confidence: 'MEDIUM' as const,
          confidenceReasons: ['Root evidence is present; D10 is partial.'],
          evidenceCoverage: {
            status: 'COMPLETE' as const,
            occurrenceCount: 2,
            semanticIdentityCount: 2,
            rootIdentityCount: 2,
            linkedSourceCount: 1
          },
          supportingCandidateIds: ['candidate-pattern-1'],
          ruleIds: ['RULE_PROFESSION_TECHNICAL_LEADERSHIP'],
          supportingEvidenceOccurrenceIds: ['occ-d1-1'],
          d10EvidenceOccurrenceIds: ['occ-d10-1'],
          d10Direction: 'MIXED' as const,
          counterEvidenceOccurrenceIds: ['occ-d1-challenge'],
          semanticIdentityKeys: ['identity-d1-1'],
          rootIdentityKeys: ['root-d1-1'],
          d10Status: 'PARTIAL' as const,
          reasons: ['D1-derived expression establishes this broad family.'],
          counterEvidenceReasons: ['D10 mixed evidence constrains expression.'],
          alternativeExplanation: 'Primary-ranked broad profession-family candidate.'
        }]
      }
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    const ranking = screen.getByRole('list', { name: 'Ranked profession families' });
    expect(ranking).toHaveTextContent('#1 · Technology / Technical leadership');
    expect(ranking).toHaveTextContent('14 policy points · Confidence: Medium Confidence');
    expect(screen.getByRole('list', { name: 'Score contributions for Technology Technical leadership' }))
      .toHaveTextContent('Strong evidence × priority 2 contributes +6 points.');
    expect(ranking).toHaveTextContent('D10: Partial (Mixed)');
    expect(ranking).toHaveTextContent('D1-derived expression establishes this broad family.');
    expect(ranking).toHaveTextContent('D10 mixed evidence constrains expression.');
    expect(ranking).toHaveTextContent('occ-d10-1');
    const diagnostics = screen.getByRole('list', { name: 'Profession ranking diagnostics' });
    expect(diagnostics).toHaveTextContent('D10 qualification is partial');
    expect(diagnostics.querySelector('li')).toHaveAttribute('title', 'D10_QUALIFICATION_PARTIAL');
  });
