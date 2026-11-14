import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { CareerPage } from '../CareerPage';
import { CareerJourney } from '../../components/career/CareerJourney';
import { CareerExpressionSection } from '../../components/career/CareerExpressionSection';
import { CareerPromiseSection } from '../../components/career/CareerPromiseSection';
import { CareerDashaSection } from '../../components/career/CareerDashaSection';
import { CareerAnalyticalAxesSection } from '../../components/career/CareerAnalyticalAxesSection';
import { OverviewPage } from '../OverviewPage';
import { ReasoningPage } from '../ReasoningPage';
import { WealthPage } from '../WealthPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import { resolveUserFacingCopy } from '../../product/life-analysis/userFacingInterpretation';
import type { ProductCareerAnalyticalAxes } from '../../product/analysis/productAnalysisTypes';

const baseAnalysis = createProductAnalysis();
const assessmentAnalysis = createProductAnalysis({
  career: {
    ...baseAnalysis.career,
    synthesis: {
      ...baseAnalysis.career.synthesis,
      finalStatus: 'MIXED',
      statement: 'MIXED CHALLENGE SUPPORT INSUFFICIENT_DATA NOT_ACTIVE',
      finalDirection: 'MIXED',
      natalDirection: 'MIXED',
      natalStrength: 'STRONG',
      dashaDirection: 'NEUTRAL',
      timingStatus: 'NOT_ACTIVE',
      confidence: 'MEDIUM'
    }
  },
  wealth: {
    ...baseAnalysis.wealth,
    synthesis: {
      ...baseAnalysis.wealth.synthesis,
      overallStatus: 'MIXED',
      promiseStatus: 'MIXED',
      dashaDirection: 'NEUTRAL',
      timingStatus: 'NEUTRAL',
      confidence: 'MEDIUM'
    }
  }
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('user-facing assessment localization at page boundaries', () => {
  it('renders the executed-empty C8 state in Hindi rather than translation keys', async () => {
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    render(
      <CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          patternCandidateCount: 0,
          qualifiedPatternCount: 0,
          invalidRolePatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'NOT_REQUIRED',
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />
    );

    expect(screen.getByText('अभिव्यक्ति विश्लेषण पूरा हुआ, लेकिन कोई उम्मीदवार नहीं मिला।')).toBeInTheDocument();
    expect(screen.getByText('इस प्रोफ़ाइल के लिए कोई प्रामाणिक करियर अभिव्यक्ति उम्मीदवार उपलब्ध नहीं हैं।')).toBeInTheDocument();
    expect(screen.getByText('कोई करियर पैटर्न नहीं मिला।')).toBeInTheDocument();
    expect(screen.queryByText('ui.expression.executedNoCandidatesTitle')).not.toBeInTheDocument();
  });

  it('does not infer a C8 failing stage when stage diagnostics are absent', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<CareerExpressionSection expression={{
      available: false,
      status: 'EXECUTED_NO_CANDIDATES',
      coverageSummary: {
        mechanismCandidateCount: 0,
        expressionCount: 0,
        expressionsWithEvidenceCount: 0,
        evidenceCount: 0,
        evidenceWithPlanetAttributionCount: 0
      },
      candidates: []
    }} />);

    expect(screen.getByText('The expression analysis completed without producing candidates.')).toBeInTheDocument();
    expect(screen.queryByText('No career patterns were discovered.')).not.toBeInTheDocument();
    expect(screen.queryByText('Career patterns were identified, but none passed qualification.')).not.toBeInTheDocument();
  });

  it('localizes each labeled promise dimension in Hindi', async () => {
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    const promise = selectCareerViewModel(
      assessmentAnalysis,
      resolveUserFacingCopy(i18n.language)
    ).promise;
    render(<CareerPromiseSection promise={promise} />);

    expect(screen.getByText(/करियर संकेत: मिश्रित संकेत/)).toBeInTheDocument();
    expect(screen.getByText(/आधार:/)).toBeInTheDocument();
    expect(screen.getByText(/दशा का समर्थन:/)).toBeInTheDocument();
    expect(screen.getByText(/साक्ष्य पर विश्वास:/)).toBeInTheDocument();
    expect(screen.queryByText(/\b(MIXED|CHALLENGE|SUPPORT|INSUFFICIENT_DATA|NOT_ACTIVE)\b/)).not.toBeInTheDocument();
  });

  it('renders the partially assessed Dasha badge in Hindi', async () => {
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    render(<CareerDashaSection dasha={{
      status: 'AVAILABLE',
      periods: [{
        level: 'MD',
        planet: 'Jupiter',
        role: 'PRIMARY',
        direction: 'CHALLENGE',
        effect: 'CHALLENGES',
        evidenceIds: [],
        conditionAssessment: 'PARTIAL',
        afflictionAssessed: false
      }]
    }} />);

    expect(screen.getByText('आंशिक रूप से आकलित')).toBeInTheDocument();
    expect(screen.queryByText('ui.dasha.partialAssessment')).not.toBeInTheDocument();
  });

  it('localizes the provenance diagnostic and keeps non-activation occurrences visible', async () => {
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    const coverage = {
      status: 'COMPLETE' as const,
      availableSources: [],
      missingSources: [],
      evidenceOccurrenceCount: 0
    };
    const confidence = { status: 'NOT_ASSESSED' as const, reason: 'Test fixture.' };
    const common = {
      supportingEvidenceOccurrenceIds: [],
      conflictingEvidenceOccurrenceIds: [],
      ruleIds: [],
      coverage,
      confidence,
      methodVersion: 'B01-test'
    };
    const axes: ProductCareerAnalyticalAxes = {
      version: 'B01-test',
      promise: {
        ...common,
        axis: 'PROMISE',
        status: 'AVAILABLE',
        result: { direction: 'SUPPORT', strength: 'STRONG' }
      },
      activation: {
        ...common,
        axis: 'ACTIVATION',
        status: 'AVAILABLE',
        result: { direction: 'SUPPORT', effect: 'ACTIVATES', strength: 'STRONG', dominantLevel: 'MD' }
      },
      sustainability: {
        ...common,
        axis: 'SUSTAINABILITY',
        status: 'UNAVAILABLE',
        result: { assessment: 'NOT_ASSESSED', requiredEvidenceFamily: 'CAREER_SUSTAINABILITY' }
      },
      risk: {
        ...common,
        axis: 'RISK',
        status: 'AVAILABLE',
        result: {
          assessment: 'NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES',
          conflictCount: 0,
          nonActivationOccurrences: [{
            occurrenceId: 'dasha-non-activation',
            planet: 'SATURN',
            level: 'MD'
          }]
        },
        diagnostics: ['C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE']
      },
      timing: {
        ...common,
        axis: 'TIMING',
        status: 'AVAILABLE',
        result: { candidateWindows: [], untimedLevels: [], guarantee: 'NONE' }
      }
    };
    render(<CareerAnalyticalAxesSection axes={axes} />);

    const diagnostic = screen.getByText('सक्रियता साक्ष्य को अभी व्यक्तिगत जन्म-कुंडली अभिलेखों तक नहीं खोजा जा सकता।');
    expect(diagnostic).toHaveAttribute('title', 'C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE');
    expect(screen.getByText('सक्रिय न करने वाली अवधियाँ: SATURN · महादशा (MD)')).toBeInTheDocument();
  });

  it('renders all expanded Career journey states with Hindi labels', async () => {
    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    render(
      <CareerJourney steps={[
        { id: 'absent', title: 'Absent', description: 'Absent state', state: 'ABSENT' },
        { id: 'not-assessed', title: 'Not assessed', description: 'Not assessed state', state: 'NOT_ASSESSED' },
        { id: 'executed-empty', title: 'Empty execution', description: 'Executed state', state: 'EXECUTED_NO_CANDIDATES' },
        { id: 'blocked', title: 'Blocked', description: 'Blocked state', state: 'QUALIFICATION_BLOCKED' }
      ]} />
    );

    await waitFor(() => {
      expect(screen.getByText('अनुपस्थित')).toBeInTheDocument();
      expect(screen.getByText('डिज़ाइन के अनुसार आकलन नहीं किया गया')).toBeInTheDocument();
      expect(screen.getByText('विश्लेषण चला; कोई उम्मीदवार नहीं')).toBeInTheDocument();
      expect(screen.getByText('पुष्टि-प्रवेश अवरुद्ध')).toBeInTheDocument();
    });
    expect(screen.queryByText('ui.journey.absent')).not.toBeInTheDocument();
    expect(screen.queryByText('ui.journey.notAssessed')).not.toBeInTheDocument();
    expect(screen.queryByText('ui.journey.executedNoCandidates')).not.toBeInTheDocument();
    expect(screen.queryByText('ui.journey.qualificationBlocked')).not.toBeInTheDocument();
  });

  it('updates Overview assessment copy while retaining canonical values and evidence prose', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<OverviewPage analysis={assessmentAnalysis} status="READY" />);

    expect(screen.getAllByText('Strong foundation with mixed indications').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No clear activation identified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getAllByText('मजबूत आधार के साथ मिश्रित संकेत').length).toBeGreaterThan(0);
      expect(screen.getAllByText('कोई स्पष्ट सक्रियता नहीं मिली').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Strong foundation with mixed indications')).not.toBeInTheDocument();
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);
    expect(assessmentAnalysis.career.synthesis?.natalDirection).toBe('MIXED');
  });

  it('updates Career promise and conclusion copy without exposing the domain statement', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getAllByText(/Strong foundation with mixed indications/).length).toBeGreaterThan(0);
    expect(screen.queryByText('High vocational promise across 10th lord and Lagna.')).not.toBeInTheDocument();
    expect(screen.queryByText('MIXED CHALLENGE SUPPORT INSUFFICIENT_DATA NOT_ACTIVE')).not.toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getAllByText(/मजबूत आधार के साथ मिश्रित संकेत/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('High vocational promise across 10th lord and Lagna.')).not.toBeInTheDocument();
    expect(assessmentAnalysis.career.synthesis?.natalDirection).toBe('MIXED');
  });

  it('updates Wealth conclusion copy while leaving evidence prose unchanged', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<WealthPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getByText(/Mixed outlook/)).toBeInTheDocument();
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getByText(/मिश्रित संकेत\. मिश्रित आधार/)).toBeInTheDocument();
    });
    expect(screen.getAllByText('Jupiter in Cancer in 7th house.').length).toBeGreaterThan(0);
    expect(assessmentAnalysis.wealth.synthesis?.promiseStatus).toBe('MIXED');
  });

  it('localizes reasoning conclusions without translating domain-generated prose', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    render(<ReasoningPage productAnalysisState={{ status: 'READY', analysis: assessmentAnalysis }} />);

    expect(screen.getAllByText(/Strong foundation with mixed indications/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jupiter in Cancer in 7th house').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });

    await waitFor(() => {
      expect(screen.getAllByText(/मजबूत आधार के साथ मिश्रित संकेत/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Jupiter in Cancer in 7th house').length).toBeGreaterThan(0);
  });

  it('localizes the safe not-assessed fallback', async () => {
    const analysisWithoutSynthesis = createProductAnalysis({
      career: { ...baseAnalysis.career, synthesis: undefined },
      wealth: { ...baseAnalysis.wealth, synthesis: undefined }
    });
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    const { rerender } = render(<OverviewPage analysis={analysisWithoutSynthesis} status="READY" />);

    expect(screen.getAllByText('Not assessed').length).toBeGreaterThan(0);

    await act(async () => {
      await i18n.changeLanguage('hi');
    });
    rerender(<OverviewPage analysis={analysisWithoutSynthesis} status="READY" />);

    await waitFor(() => {
      expect(screen.getAllByText('आकलन नहीं किया गया').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument();
  });
});
