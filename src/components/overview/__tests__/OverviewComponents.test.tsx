import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../../../i18n/i18n';
import {
  OverviewHeader,
  OverallAssessmentCard,
  DomainSummaryCard,
  KeyFindingsCard,
  QualificationsCard,
  EvidencePreview,
  OverviewEmptyState,
  OverviewLoadingState,
  OverviewErrorState
} from '../index';
import { selectOverviewViewModel } from '../../../product/analysis/overviewViewModel';
import { buildUserFacingAssessment } from '../../../product/life-analysis/userFacingInterpretation';
import { createProductAnalysis } from '../../../product/analysis/__tests__/testHelpers';

describe('Overview Component Library (P-UI-03)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  const analysis = createProductAnalysis();
  const vm = selectOverviewViewModel(analysis);

  describe('OverviewHeader', () => {
    it('renders chart metadata and warnings count badge if warnings exist', () => {
      render(
        <OverviewHeader
          chart={vm.chart}
          warnings={[{ code: 'W1', message: 'Test warning', severity: 'WARNING' }]}
        />
      );

      expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
      expect(screen.getByText('1 Notice')).toBeInTheDocument();
      expect(screen.getAllByText('Capricorn').length).toBe(2);
      expect(screen.getByText('Leo')).toBeInTheDocument();
      expect(screen.getByText('Magha')).toBeInTheDocument();
    });

    it('renders Unavailable for missing chart properties', () => {
      render(<OverviewHeader chart={{}} warnings={[]} />);
      expect(screen.getAllByText('Unavailable').length).toBe(4);
    });
  });

  describe('OverallAssessmentCard', () => {
    it('renders status and confidence badges with summary statement', () => {
      render(<OverallAssessmentCard overall={vm.overall} />);

      expect(screen.getByText('Overall Synthesis & Assessment')).toBeInTheDocument();
      expect(screen.getByText('Complete Assessment')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText(vm.overall.summary)).toBeInTheDocument();
    });

    it('renders all assessment dimensions and a concise mixed-domain conclusion without enum tokens', () => {
      const base = createProductAnalysis();
      const analysis = createProductAnalysis({
        career: {
          ...base.career,
          synthesis: {
            ...base.career.synthesis,
            finalStatus: 'MIXED',
            natalDirection: 'MIXED',
            natalStrength: 'STRONG',
            dashaDirection: 'NEUTRAL',
            timingStatus: 'NOT_ACTIVE',
            confidence: 'MEDIUM'
          }
        },
        wealth: {
          ...base.wealth,
          synthesis: {
            ...base.wealth.synthesis,
            overallStatus: 'STRONG',
            promiseStatus: 'STRONG'
          }
        }
      });
      const overall = selectOverviewViewModel(analysis).overall;

      render(<OverallAssessmentCard overall={overall} />);

      expect(screen.getByText('Mixed career outlook; Strong wealth outlook.')).toBeInTheDocument();
      expect(screen.getByText('Foundation')).toBeInTheDocument();
      expect(screen.getByText('Dasha support')).toBeInTheDocument();
      expect(screen.getByText('Timing')).toBeInTheDocument();
      expect(screen.getByText('Evidence confidence')).toBeInTheDocument();
      expect(screen.getByText(/Strong foundation with mixed indications/)).toBeInTheDocument();
      expect(screen.getByText(/No clear activation identified/)).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/MIXED\s*\(|NOT_ACTIVE|ACCUMULATION/);
    });

    it('renders not-assessed dimension fallbacks when structured synthesis is absent', () => {
      const base = createProductAnalysis();
      const analysis = createProductAnalysis({
        career: { ...base.career, synthesis: undefined },
        wealth: { ...base.wealth, synthesis: undefined }
      });
      const overall = selectOverviewViewModel(analysis).overall;

      render(<OverallAssessmentCard overall={overall} />);

      expect(screen.getAllByText('Not assessed').length).toBeGreaterThanOrEqual(4);
      expect(document.body.textContent).not.toMatch(/MIXED\s*\(|NOT_ACTIVE|ACCUMULATION/);
    });

    it('allows long explanations to wrap', () => {
      const longExplanation = `${'A detailed explanation of structured classifications. '.repeat(12)}`;
      const overall = {
        ...vm.overall,
        assessment: {
          ...vm.overall.assessment,
          foundation: { ...vm.overall.assessment.foundation, explanation: longExplanation }
        }
      };

      render(<OverallAssessmentCard overall={overall} />);

      const explanation = screen.getByText(/A detailed explanation of structured classifications/);
      expect(explanation).toHaveClass('break-words');
    });
  });

  describe('DomainSummaryCard', () => {
    it('renders domain strength, confidence, and top evidentiary drivers', () => {
      const onOpen = vi.fn();
      render(
        <DomainSummaryCard
          domain={vm.career}
          domainKey="career"
          onOpen={onOpen}
        />
      );

      expect(screen.getByText('Career & Professional Life')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Top Evidentiary Drivers')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /explore career details/i });
      fireEvent.click(btn);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('renders all four assessment dimensions, mixed foundation wording, and safe detail labels', () => {
      const base = createProductAnalysis();
      const analysis = createProductAnalysis({
        career: {
          ...base.career,
          synthesis: {
            ...base.career.synthesis,
            finalStatus: 'MIXED',
            natalDirection: 'MIXED',
            natalStrength: 'STRONG',
            dashaDirection: 'NEUTRAL',
            timingStatus: 'NOT_ACTIVE',
            confidence: 'MEDIUM'
          }
        },
        wealth: {
          ...base.wealth,
          synthesis: {
            ...base.wealth.synthesis,
            promiseStatus: 'MIXED',
            dimensionStatuses: { ACCUMULATION: 'STRONG' }
          }
        }
      });
      const domain = selectOverviewViewModel(analysis).career;
      const withLongExplanation = {
        ...domain,
        assessment: {
          ...domain.assessment,
          foundation: {
            ...domain.assessment.foundation,
            explanation: `${'Strong supportive factors coexist with challenges. '.repeat(12)}`
          }
        }
      };

      render(<DomainSummaryCard domain={withLongExplanation} domainKey="career" />);

      expect(screen.getByText('Foundation')).toBeInTheDocument();
      expect(screen.getByText('Dasha support')).toBeInTheDocument();
      expect(screen.getByText('Timing')).toBeInTheDocument();
      expect(screen.getByText('Evidence confidence')).toBeInTheDocument();
      expect(screen.getByText('Strong foundation with mixed indications')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('No clear activation identified')).toBeInTheDocument();
      expect(screen.getByText('Medium confidence')).toBeInTheDocument();
      expect(screen.getByText(/Strong supportive factors coexist with challenges/)).toHaveClass('break-words');
      expect(document.body.textContent).not.toMatch(/MIXED\s*\(|NOT_ACTIVE|ACCUMULATION/);
    });

    it('shows not-assessed labels if synthesis fields are unavailable', () => {
      const base = createProductAnalysis();
      const analysis = createProductAnalysis({
        career: { ...base.career, synthesis: undefined }
      });
      const domain = selectOverviewViewModel(analysis).career;

      render(<DomainSummaryCard domain={domain} domainKey="career" />);

      expect(screen.getAllByText('Not assessed').length).toBeGreaterThanOrEqual(4);
      expect(document.body.textContent).not.toMatch(/MIXED\s*\(|NOT_ACTIVE|ACCUMULATION/);
    });

    it('renders distinct safe labels for multiple unknown assessment details', () => {
      const domain = selectOverviewViewModel(createProductAnalysis()).career;
      const assessment = buildUserFacingAssessment({
        details: [
          { label: 'FUTURE_DIMENSION_A', status: 'UNKNOWN_STATUS' },
          { label: 'FUTURE_DIMENSION_B', status: 'UNKNOWN_STATUS' }
        ]
      });

      render(<DomainSummaryCard domain={{ ...domain, assessment }} domainKey="career" />);
      fireEvent.click(screen.getByText('More assessment detail'));

      expect(screen.getByText('Additional assessment (1)')).toBeInTheDocument();
      expect(screen.getByText('Additional assessment (2)')).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/FUTURE_DIMENSION|UNKNOWN_STATUS/);
    });
  });

  describe('KeyFindingsCard', () => {
    it('renders cross-domain findings with evidence role and direction badges', () => {
      render(<KeyFindingsCard findings={vm.findings} />);

      expect(screen.getByText('Key Cross-Domain Findings')).toBeInTheDocument();
      expect(vm.findings.length).toBeGreaterThan(0);
      expect(screen.getAllByText(vm.findings[0].title).length).toBeGreaterThan(0);
    });

    it('renders empty finding state when no findings present', () => {
      render(<KeyFindingsCard findings={[]} />);
      expect(screen.getByText(/no prominent findings generated/i)).toBeInTheDocument();
    });
  });

  describe('QualificationsCard', () => {
    it('renders qualifications with severity badges', () => {
      render(<QualificationsCard qualifications={vm.qualifications} />);

      expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
      expect(screen.getByText('COMBUSTION')).toBeInTheDocument();
      expect(screen.getByText('Low Impact')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('renders empty qualification state when none exist', () => {
      render(<QualificationsCard qualifications={[]} />);
      expect(
        screen.getByText(/no adverse astrological qualifications or mitigating constraints/i)
      ).toBeInTheDocument();
    });
  });

  describe('EvidencePreview', () => {
    it('renders reasoning graph link with evidence counter', () => {
      const onOpenReasoning = vi.fn();
      render(
        <EvidencePreview
          totalEvidenceCount={5}
          onOpenReasoning={onOpenReasoning}
        />
      );

      expect(screen.getByText('Deterministic Evidence Framework & Evidence Trace')).toBeInTheDocument();
      expect(screen.getByText('5 evidence items indexed')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /explore reasoning graph/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });

    it('renders correct badge count for larger evidence indexes', () => {
      render(
        <EvidencePreview
          totalEvidenceCount={14}
        />
      );

      expect(screen.getByText('14 evidence items indexed')).toBeInTheDocument();
    });
  });

  describe('States: Empty, Loading, Error', () => {
    it('OverviewEmptyState renders empty card with action', () => {
      const onRetry = vi.fn();
      render(<OverviewEmptyState onRetry={onRetry} />);

      expect(screen.getByText('Chart Overview Unavailable')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /recalculate analysis/i });
      fireEvent.click(btn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('OverviewLoadingState renders animated skeleton', () => {
      render(<OverviewLoadingState />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Synthesizing Life Overview')).toBeInTheDocument();
    });

    it('OverviewErrorState renders error message and retry action', () => {
      const onRetry = vi.fn();
      render(<OverviewErrorState errorMessage="Database connection error" onRetry={onRetry} />);

      expect(screen.getByText('Overview Computation Error')).toBeInTheDocument();
      expect(screen.getByText('Database connection error')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /recalculate analysis/i });
      fireEvent.click(btn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
