import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerProfessionStatusSection } from './CareerProfessionStatusSection';
import { getCareerProfessionStatusCopy, type CareerProfessionStatus } from '../../product/analysis/careerQualificationPresentation';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import i18n from '../../i18n/i18n';

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
        qualifiedPatternCount: 1,
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
