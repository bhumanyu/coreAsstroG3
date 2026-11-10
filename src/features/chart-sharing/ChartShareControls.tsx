import React, { useEffect, useState } from 'react';
import type { BirthDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { chartShareResultToBirthDetails, decodeChartShareUrlFragment } from './chartShareService';
import type { ChartShareCodecError } from './chartShareCodec';

export interface ChartShareControlsProps {
  readonly onLoadBirthDetails: (birthDetails: BirthDetails) => void;
}

const SAFE_ERROR: Record<ChartShareCodecError, string> = {
  MISSING: 'No share data was found in this link.',
  TOO_LARGE: 'This share link is too large to process.',
  BAD_ENCODING: 'This share link is malformed.',
  BAD_JSON: 'This share link contains unreadable data.',
  UNSUPPORTED_VERSION: 'This share link uses a version this app does not support.',
  INVALID_INPUT: 'This share link contains invalid chart inputs.'
};

const stripChartFragmentParam = () => {
  if (!globalThis.location?.hash.includes('chart=')) return;
  const url = new URL(globalThis.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.delete('chart');
  const remainingFragment = fragment.toString();
  url.hash = remainingFragment ? `#${remainingFragment}` : '';
  globalThis.history.replaceState(null, '', url.toString());
};

export const ChartShareControls: React.FC<ChartShareControlsProps> = ({
  onLoadBirthDetails
}) => {
  const [pendingBirth, setPendingBirth] = useState<BirthDetails>();
  const [error, setError] = useState('');

  useEffect(() => {
    const fragment = globalThis.location?.hash ?? '';
    if (!fragment.includes('chart=')) return;
    const decoded = decodeChartShareUrlFragment(fragment);
    const birth = chartShareResultToBirthDetails(decoded);
    if (birth) {
      setPendingBirth(birth);
      setError('');
    } else if (!decoded.ok) {
      setError(SAFE_ERROR[decoded.error]);
    }
  }, []);

  const loadShared = () => {
    if (!pendingBirth) return;
    onLoadBirthDetails(pendingBirth);
    setPendingBirth(undefined);
    setError('');
    stripChartFragmentParam();
  };

  const dismiss = () => {
    setError('');
    setPendingBirth(undefined);
    stripChartFragmentParam();
  };

  if (!pendingBirth && !error) return null;

  return (
    <section aria-labelledby="shared-chart-heading" className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
      <h2 id="shared-chart-heading" className="text-lg font-semibold">Shared chart</h2>
      {pendingBirth && (
        <div className="mt-3 rounded-lg border border-slate-700 p-3">
          <p role="status">A shared chart is available to load. Current chart inputs will be replaced only if you choose to load them.</p>
          <Button type="button" className="mt-2" onClick={loadShared}>Load shared chart inputs</Button>
        </div>
      )}
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-rose-300">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>Dismiss</Button>
        </div>
      )}
    </section>
  );
};
