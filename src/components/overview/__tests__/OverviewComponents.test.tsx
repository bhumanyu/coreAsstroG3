import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OverviewHeader,
  OverallAssessmentCard,
  DomainSummaryCard,
  CurrentDashaCard,
  KeyFindingsCard,
  QualificationsCard,
  EvidencePreview,
  OverviewEmptyState,
  OverviewLoadingState,
  OverviewErrorState
} from '../index';
import { selectOverviewViewModel } from '../../../product/analysis/overviewViewModel';
import { createProductAnalysis } from '../../../product/analysis/__tests__/testHelpers';

describe('Overview Component Library (P-UI-03)', () => {
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
  });

  describe('CurrentDashaCard', () => {
    it('renders MD/AD/PD hierarchy and handles missing periods gracefully', () => {
      const onOpenDasha = vi.fn();
      render(<CurrentDashaCard dasha={vm.dasha} onOpenDasha={onOpenDasha} />);

      expect(screen.getByText('Current Planetary Timing (Vimshottari Dasha)')).toBeInTheDocument();
      expect(screen.getByText('Jupiter → Saturn → Mercury')).toBeInTheDocument();
      expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
      expect(screen.getByText('Antardasha (AD)')).toBeInTheDocument();
      expect(screen.getByText('Pratyantardasha (PD)')).toBeInTheDocument();

      const viewBtn = screen.getByRole('button', { name: /view complete dasha timeline/i });
      fireEvent.click(viewBtn);
      expect(onOpenDasha).toHaveBeenCalledTimes(1);
    });

    it('renders Timing Unavailable when periods are missing', () => {
      render(
        <CurrentDashaCard
          dasha={{
            periods: [],
            status: 'UNAVAILABLE',
            availability: false,
            currentPeriodLabel: 'Timing Unavailable'
          }}
        />
      );

      expect(screen.getAllByText('Timing Unavailable').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Unavailable').length).toBe(3);
    });

    it('renders Partial badge when dasha status is PARTIAL', () => {
      render(
        <CurrentDashaCard
          dasha={{
            periods: [vm.dasha.periods[0]],
            md: vm.dasha.md,
            status: 'PARTIAL',
            availability: true,
            currentPeriodLabel: 'Jupiter'
          }}
        />
      );

      expect(screen.getByText('Partial')).toBeInTheDocument();
      expect(screen.getAllByText('Jupiter').length).toBeGreaterThan(0);
    });
  });

  describe('KeyFindingsCard', () => {
    it('renders cross-domain findings with evidence role and direction badges', () => {
      render(<KeyFindingsCard findings={vm.findings} />);

      expect(screen.getByText('Key Cross-Domain Findings')).toBeInTheDocument();
      expect(vm.findings.length).toBeGreaterThan(0);
      expect(screen.getByText(vm.findings[0].title)).toBeInTheDocument();
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

      expect(screen.getByText('Deterministic Reasoning Hierarchy & Evidence Trace')).toBeInTheDocument();
      expect(screen.getByText('5 rules indexed')).toBeInTheDocument();

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

      expect(screen.getByText('14 rules indexed')).toBeInTheDocument();
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
