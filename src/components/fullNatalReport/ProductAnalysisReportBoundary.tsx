import React from 'react';
import { useTranslation } from 'react-i18next';

export interface ProductAnalysisReportBoundaryProps {
  readonly resetKey?: string;
  readonly children: React.ReactNode;
}

interface ProductAnalysisReportBoundaryState {
  readonly error?: Error;
  readonly resetKey?: string;
}

interface ProductAnalysisReportErrorCopy {
  readonly label: string;
  readonly unavailable: string;
  readonly renderFailed: (message: string) => string;
  readonly unexpectedError: string;
  readonly preserved: string;
  readonly retry: string;
}

interface BoundaryClassProps extends ProductAnalysisReportBoundaryProps {
  readonly copy: ProductAnalysisReportErrorCopy;
}

/** Isolates report rendering failures from the canonical analysis lifecycle. */
class ProductAnalysisReportBoundaryClass extends React.Component<
  BoundaryClassProps,
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
          aria-label={this.props.copy.label}
          role="alert"
          className="mt-8 rounded-xl border border-rose-700/50 bg-rose-950/20 p-5 print:border-slate-300 print:bg-white"
        >
          <h2 className="text-lg font-semibold text-slate-100 print:text-black">{this.props.copy.unavailable}</h2>
          <p className="mt-2 text-sm text-rose-200 print:text-slate-700">
            {this.props.copy.renderFailed(this.state.error.message || this.props.copy.unexpectedError)}
          </p>
          <p className="mt-1 text-xs text-slate-300 print:text-slate-700">
            {this.props.copy.preserved}
          </p>
          <button
            type="button"
            onClick={this.retryReport}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white print:hidden"
          >
            {this.props.copy.retry}
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export const ProductAnalysisReportBoundary: React.FC<ProductAnalysisReportBoundaryProps> = (props) => {
  const { t } = useTranslation('errors');
  const copy: ProductAnalysisReportErrorCopy = {
    label: t('careerWealthReport'),
    unavailable: t('reportUnavailable'),
    renderFailed: (message) => t('renderFailed', { message }),
    unexpectedError: t('unexpectedRenderError'),
    preserved: t('reportPreserved'),
    retry: t('retryReport')
  };
  return <ProductAnalysisReportBoundaryClass {...props} copy={copy} />;
};
