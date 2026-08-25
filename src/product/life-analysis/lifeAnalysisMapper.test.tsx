import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { CareerAnalysisCard } from '../../components/lifeAnalysis/CareerAnalysisCard';
import { WealthAnalysisCard } from '../../components/lifeAnalysis/WealthAnalysisCard';
import {
  DomainInterpretation,
  createDomainInterpretation,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createDomainConclusion
} from '../../domain/interpretation';
import { Planet } from '../../types';
import type { CareerManifestationSynthesis } from '../../domain/career/manifestation/careerManifestationSynthesisTypes';
import type { WealthManifestationSynthesis } from '../../domain/wealth/manifestation/wealthManifestationTypes';

describe('lifeAnalysisMapper & CW-04 View Models', () => {
  const mockCareerManifestations: readonly CareerManifestationSynthesis[] = [
    {
      reasoningVersion: 'CW-04',
      mode: 'LEADERSHIP',
      status: 'STRONGLY_SUPPORTED',
      confidence: 'HIGH',
      natalSupport: 'SUPPORT',
      dashaSupport: 'SUPPORT',
      transitSupport: 'SUPPORT',
      d10Support: 'SUPPORT',
      factors: [],
      summary: 'Executive leadership is strongly supported.'
    },
    {
      reasoningVersion: 'CW-04',
      mode: 'MANAGEMENT',
      status: 'SUPPORTED',
      confidence: 'MEDIUM',
      natalSupport: 'SUPPORT',
      dashaSupport: 'SUPPORT',
      transitSupport: 'NEUTRAL',
      d10Support: 'SUPPORT',
      factors: [],
      summary: 'Operational management is supported.'
    }
  ];

  const mockWealthManifestations: WealthManifestationSynthesis = {
    reasoningVersion: 'CW-04',
    dimensions: {
      ACCUMULATION: {
        reasoningVersion: 'CW-04',
        dimension: 'ACCUMULATION',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        natalSupport: 'SUPPORT',
        dashaSupport: 'SUPPORT',
        transitSupport: 'SUPPORT',
        d2Support: 'SUPPORT',
        factors: [],
        summary: 'Asset accumulation is reinforced by D2 confirmation.'
      },
      GAINS: {
        reasoningVersion: 'CW-04',
        dimension: 'GAINS',
        status: 'SUPPORTED',
        confidence: 'MEDIUM',
        natalSupport: 'SUPPORT',
        dashaSupport: 'SUPPORT',
        transitSupport: 'NEUTRAL',
        d2Support: 'NEUTRAL',
        factors: [],
        summary: 'Income and profit streams are active.'
      },
      FORTUNE: {
        reasoningVersion: 'CW-04',
        dimension: 'FORTUNE',
        status: 'MIXED',
        confidence: 'MEDIUM',
        natalSupport: 'SUPPORT',
        dashaSupport: 'CHALLENGE',
        transitSupport: 'NEUTRAL',
        d2Support: 'NEUTRAL',
        factors: [],
        summary: 'Fortune experiences mixed dasha activation.'
      },
      SPECULATION: {
        reasoningVersion: 'CW-04',
        dimension: 'SPECULATION',
        status: 'INSUFFICIENT_DATA',
        confidence: 'LOW',
        natalSupport: 'NEUTRAL',
        dashaSupport: 'CHALLENGE',
        transitSupport: 'CHALLENGE',
        d2Support: 'NEUTRAL',
        factors: [],
        summary: 'Speculative investments lack natal backing.'
      }
    },
    summary: 'Wealth synthesis across all four classical dimensions.'
  };

  it('correctly maps careerManifestationSynthesis into CareerDetailViewModel', () => {
    const careerInterp: DomainInterpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', statement: 'Strong career promise' }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', statement: 'Sun activates' }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', statement: 'Jupiter triggers' }),
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: createDomainConclusion({ strength: 'STRONG', confidence: 'HIGH', statement: 'Strong career' }),
      conclusionData: {
        careerManifestationSynthesis: mockCareerManifestations
      }
    });

    const wealthInterp: DomainInterpretation = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({ strength: 'STRONG', statement: 'Strong wealth promise' }),
      dashaActivation: createDashaActivation({ domain: 'WEALTH', effect: 'ACTIVATES', statement: 'Jupiter activates' }),
      transitTrigger: createTransitTrigger({ domain: 'WEALTH', effect: 'TRIGGER', statement: 'Jupiter triggers' }),
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: createDomainConclusion({ strength: 'STRONG', confidence: 'HIGH', statement: 'Strong wealth' })
    });

    const analysis = buildLifeAnalysis([careerInterp, wealthInterp]);
    const viewModel = buildLifeAnalysisViewModel(analysis, careerInterp, wealthInterp, []);

    expect(viewModel.careerDetail?.manifestationSynthesis).toBeDefined();
    expect(viewModel.careerDetail?.manifestationSynthesis).toEqual(mockCareerManifestations);
  });

  it('correctly maps wealthManifestationSynthesis into WealthDetailViewModel', () => {
    const careerInterp: DomainInterpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', statement: 'Strong career promise' }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', statement: 'Sun activates' }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', statement: 'Jupiter triggers' }),
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: createDomainConclusion({ strength: 'STRONG', confidence: 'HIGH', statement: 'Strong career' })
    });

    const wealthInterp: DomainInterpretation = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({ strength: 'STRONG', statement: 'Strong wealth promise' }),
      dashaActivation: createDashaActivation({ domain: 'WEALTH', effect: 'ACTIVATES', statement: 'Jupiter activates' }),
      transitTrigger: createTransitTrigger({ domain: 'WEALTH', effect: 'TRIGGER', statement: 'Jupiter triggers' }),
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: createDomainConclusion({ strength: 'STRONG', confidence: 'HIGH', statement: 'Strong wealth' }),
      conclusionData: {
        wealthManifestationSynthesis: mockWealthManifestations
      }
    });

    const analysis = buildLifeAnalysis([careerInterp, wealthInterp]);
    const viewModel = buildLifeAnalysisViewModel(analysis, careerInterp, wealthInterp, []);

    expect(viewModel.wealthDetail?.manifestationSynthesis).toBeDefined();
    expect(viewModel.wealthDetail?.manifestationSynthesis).toEqual(mockWealthManifestations);
  });

  it('renders CW-04 synthesis in CareerAnalysisCard and hides legacy dominant manifestations block', () => {
    const detailWithSynthesis = {
      headline: 'Career Trajectory',
      statement: 'Comprehensive vocational analysis.',
      natalPromise: 'STRONG' as const,
      d10Relationship: 'CONFIRMS' as const,
      currentDashaEffect: 'ACTIVATES' as const,
      currentTransitEffect: 'TRIGGERING' as const,
      dominantManifestations: ['LEADERSHIP' as const, 'MANAGEMENT' as const],
      manifestationSynthesis: mockCareerManifestations
    };

    render(<CareerAnalysisCard detail={detailWithSynthesis} />);

    // Synthesis section is rendered
    expect(screen.getByText('Manifestation Modes (CW-04 Synthesis):')).toBeInTheDocument();
    expect(screen.getByText('Executive leadership is strongly supported.')).toBeInTheDocument();
    expect(screen.getByText('Operational management is supported.')).toBeInTheDocument();

    // Legacy dominant manifestations block must NOT be rendered when synthesis is present
    expect(screen.queryByText('Dominant Career Archetypes & Manifestations:')).not.toBeInTheDocument();
  });

  it('renders legacy dominant manifestations block in CareerAnalysisCard when synthesis is absent', () => {
    const detailWithoutSynthesis = {
      headline: 'Career Trajectory',
      statement: 'Comprehensive vocational analysis.',
      natalPromise: 'STRONG' as const,
      d10Relationship: 'CONFIRMS' as const,
      currentDashaEffect: 'ACTIVATES' as const,
      currentTransitEffect: 'TRIGGERING' as const,
      dominantManifestations: ['LEADERSHIP' as const, 'MANAGEMENT' as const],
      manifestationSynthesis: undefined
    };

    render(<CareerAnalysisCard detail={detailWithoutSynthesis} />);

    // Legacy section is rendered
    expect(screen.getByText('Dominant Career Archetypes & Manifestations:')).toBeInTheDocument();
    // Synthesis heading is NOT rendered
    expect(screen.queryByText('Manifestation Modes (CW-04 Synthesis):')).not.toBeInTheDocument();
  });

  it('renders wealth dimensions with CW-04 status and summaries in WealthAnalysisCard', () => {
    const wealthDetail = {
      headline: 'Wealth & Assets',
      statement: 'Multi-dimensional wealth analysis.',
      overallStatus: 'SUPPORTED' as const,
      natalPromise: 'STRONG' as const,
      d2Relationship: 'CONFIRMS' as const,
      currentDashaEffect: 'ACTIVATES' as const,
      currentTransitEffect: 'TRIGGERING' as const,
      accumulationStatus: 'SUPPORTED' as const,
      gainsStatus: 'SUPPORTED' as const,
      fortuneStatus: 'SUPPORTED' as const,
      speculationStatus: 'CHALLENGED' as const,
      manifestationSynthesis: mockWealthManifestations
    };

    render(<WealthAnalysisCard detail={wealthDetail} />);

    expect(screen.getByText('4 Classical Wealth Dimensions (CW-04 Manifestation):')).toBeInTheDocument();
    expect(screen.getByText('Asset accumulation is reinforced by D2 confirmation.')).toBeInTheDocument();
    expect(screen.getByText('Income and profit streams are active.')).toBeInTheDocument();
    expect(screen.getByText('Fortune experiences mixed dasha activation.')).toBeInTheDocument();
    expect(screen.getByText('Speculative investments lack natal backing.')).toBeInTheDocument();
  });
});

