import React, { useEffect, useState } from 'react';
import type { BirthDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { chartShareResultToBirthDetails, createChartShareUrl, decodeChartShareUrlFragment } from './chartShareService';
import type { ChartShareCodecError } from './chartShareCodec';

export interface ChartShareControlsProps {
  readonly currentBirthDetails: BirthDetails;
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

export const ChartShareControls: React.FC<ChartShareControlsProps> = ({
  currentBirthDetails,
  onLoadBirthDetails
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [pendingBirth, setPendingBirth] = useState<BirthDetails>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const createLink = () => {
    const baseUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;
    const result = createChartShareUrl(baseUrl, currentBirthDetails);
    if (!result.ok) {
      setError(SAFE_ERROR[result.error]);
      setShareUrl('');
      setMessage('');
      return;
    }
    setShareUrl(result.value);
    setError('');
    setMessage('Share link created. It has not been added to the address bar.');
  };

  const clearLink = () => {
    setShareUrl('');
    setPendingBirth(undefined);
    setMessage('Share link cleared from this view.');
    setError('');
    if (globalThis.location?.hash.includes('chart=')) {
      const url = new URL(globalThis.location.href);
      const fragment = new URLSearchParams(url.hash.slice(1));
      fragment.delete('chart');
      const remainingFragment = fragment.toString();
      url.hash = remainingFragment ? `#${remainingFragment}` : '';
      globalThis.history.replaceState(null, '', url.toString());
    }
  };

  const loadShared = () => {
    if (!pendingBirth) return;
    onLoadBirthDetails(pendingBirth);
    setPendingBirth(undefined);
    setMessage('Shared inputs loaded. Analysis will run from these inputs.');
    setError('');
  };

  return (
    <section aria-labelledby="chart-share-heading" className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
      <h2 id="chart-share-heading" className="text-lg font-semibold">Share chart inputs</h2>
      <p className="mt-1 text-sm text-amber-200">
        Privacy warning: a share link contains birth date/time, time zone, coordinates, and ayanamsa. Anyone with the link may see them;
        links can be exposed through browser history, screenshots, or copying/pasting. Your name and place of birth are excluded.
        The link is encoded for transport, not encrypted or tamper-proof.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={createLink}>Create share link</Button>
        <Button type="button" variant="outline" onClick={clearLink}>Clear share link</Button>
      </div>
      {shareUrl && (
        <label className="mt-3 block text-sm">
          Created share link
          <input readOnly aria-label="Created share link" value={shareUrl} onFocus={(event) => event.currentTarget.select()}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" />
        </label>
      )}
      {pendingBirth && (
        <div className="mt-3 rounded-lg border border-slate-700 p-3">
          <p role="status">A shared chart is available to load. Current chart inputs will be replaced only if you choose to load them.</p>
          <Button type="button" className="mt-2" onClick={loadShared}>Load shared chart inputs</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-emerald-300">{message}</p>}
    </section>
  );
};
