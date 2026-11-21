import React from 'react';
import i18n from '../i18n/i18n';

interface AppErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface AppErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * Top-level render guard: any uncaught render/lifecycle error inside the app
 * shell is replaced by a visible fallback instead of a blank page.
 */
export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 shadow-xl" role="alert">
          <h1 className="text-lg font-semibold text-rose-300">
            {i18n.t('common:error')}
          </h1>
          <p className="mt-2 text-sm text-slate-400 break-words">{error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {i18n.t('common:retry')}
          </button>
        </div>
      </div>
    );
  }
}
