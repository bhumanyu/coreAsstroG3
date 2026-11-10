import React from 'react';

export interface ProductAnalysisReportBoundaryProps {
  readonly resetKey?: string;
  readonly children: React.ReactNode;
}

interface ProductAnalysisReportBoundaryState {
  readonly error?: Error;
  readonly resetKey: string;
}

/** Isolates report rendering failures from the canonical analysis lifecycle. */
export class ProductAnalysisReportBoundary extends React.Component<
  ProductAnalysisReportBoundaryProps,
  ProductAnalysisReportBoundaryState
> {
  state: ProductAnalysisReportBoundaryState = {};

  static getDerivedStateFromError(error: Error): ProductAnalysisReportBoundaryState {
    return { error };
  }

  static getDerivedStateFromProps(
    props: ProductAnalysisReportBoundaryProps,
    state: ProductAnalysisReportBoundaryState
  ): Partial<ProductAnalysisReportBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { resetKey: props.resetKey, error: undefined };
    }
    return null;
  }

  private retryReport = (): void => {
    this.setState({ error: undefined });
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <section
          aria-label="Career and Wealth report rendering error"
          role="alert"
          className="mt-8 rounded-xl border border-rose-700/50 bg-rose-950/20 p-5 print:border-slate-300 print:bg-white"
        >
          <h2 className="text-lg font-semibold text-slate-100 print:text-black">Report unavailable</h2>
          <p className="mt-2 text-sm text-rose-200 print:text-slate-700">
            The report could not be rendered: {this.state.error.message || 'An unexpected rendering error occurred.'}
          </p>
          <p className="mt-1 text-xs text-slate-300 print:text-slate-700">
            Your canonical chart analysis has been preserved. Retrying the report does not rerun astrology calculations.
          </p>
          <button
            type="button"
            onClick={this.retryReport}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white print:hidden"
          >
            Retry report
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
