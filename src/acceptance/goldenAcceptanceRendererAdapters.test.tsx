import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerConclusionSection } from '../components/career/CareerConclusionSection';
import { SelectedPeriodReport } from '../components/dasha/SelectedPeriodReport';
import { FullNatalReportView } from '../components/fullNatalReport/FullNatalReportView';
import { WealthConclusionSection } from '../components/wealth/WealthConclusionSection';
import {
  createGoldenAcceptanceProductionPipeline,
  GOLDEN_ACCEPTANCE_SURFACE_STATUS_BASELINES
} from './goldenAcceptanceProductionHarness';
import type { GoldenAcceptanceProductionResult } from './goldenAcceptanceProductionHarness';
import {
  projectCareerReportRenderer,
  projectFullNatalReportRenderer,
  projectSelectedPeriodReportRenderer,
  projectWealthReportRenderer
} from './goldenAcceptanceRendererAdapters';

describe('acceptance adapters for rendered report consumers', () => {
  let productionResult: GoldenAcceptanceProductionResult;

  beforeAll(() => {
    const pipeline = createGoldenAcceptanceProductionPipeline('CAREER');
    productionResult = pipeline.run() as GoldenAcceptanceProductionResult;
  });

  it('projects and renders the real full-natal report summary', () => {
    const report = productionResult.horoscope.fullNatalAnalysis;
    const projection = projectFullNatalReportRenderer(report);

    render(<FullNatalReportView report={report} />);

    expect(screen.getAllByText(projection.conclusion).length).toBeGreaterThan(0);
    expect(projection.status).toBe(report.overallSynthesis.status);
    expect(projection.evidenceReferences).toEqual(
      report.overallSynthesis.keyObservations.flatMap(observation => observation.evidenceReferences)
    );
  });

  it('projects and renders the product selected-period report', () => {
    const selectedPeriod = productionResult.productAnalysis.selectedPeriod;
    if (!selectedPeriod || selectedPeriod.status !== 'OK') {
      throw new Error('Production fixture emitted no selected-period report input.');
    }
    const projection = projectSelectedPeriodReportRenderer(selectedPeriod.synthesis);

    render(<SelectedPeriodReport synthesis={selectedPeriod.synthesis} />);

    expect(screen.getByText(projection.temporalRelation)).toBeInTheDocument();
    expect(projection.interval).toEqual(selectedPeriod.synthesis.period.interval);
    expect(projection.evidenceIds).toEqual(selectedPeriod.synthesis.evidence.flatMap(reference =>
      reference.referenceKind === 'RULE' || reference.evidenceId === undefined
        ? []
        : [reference.evidenceId]
    ));
    expect(projection.wealthDimensions).toHaveLength(4);
  });

  it('projects the Career conclusion section inputs from its real view model', () => {
    const projection = projectCareerReportRenderer(productionResult.careerView);
    render(<CareerConclusionSection conclusion={productionResult.careerView.conclusion} />);

    expect(projection.status).toBe(GOLDEN_ACCEPTANCE_SURFACE_STATUS_BASELINES.CAREER['career-ui']);
    expect(projection.evidenceIds).toEqual(productionResult.careerView.evidence.map(item => item.id));
    expect(screen.getByText(`${projection.primaryEvidenceCount} Primary Drivers`)).toBeInTheDocument();
  });

  it('projects the Wealth conclusion section inputs from its real view model', () => {
    const projection = projectWealthReportRenderer(productionResult.wealthView);
    render(<WealthConclusionSection conclusion={productionResult.wealthView.conclusion} />);

    expect(projection.status).toBe(GOLDEN_ACCEPTANCE_SURFACE_STATUS_BASELINES.WEALTH['wealth-ui']);
    expect(projection.evidenceIds).toEqual(productionResult.wealthView.evidence.map(item => item.id));
    expect(screen.getByText('Primary Drivers')).toBeInTheDocument();
  });
});
