import React, { useEffect, useState } from 'react';
import type { BirthDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { chartShareResultToBirthDetails, decodeChartShareUrlFragment } from './chartShareService';
import type { ChartShareCodecError } from './chartShareCodec';
import { useTranslation } from 'react-i18next';

export interface ChartShareControlsProps {
  readonly onLoadBirthDetails: (birthDetails: BirthDetails) => void;
}

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
  const { t } = useTranslation('chartSharing');
  const [pendingBirth, setPendingBirth] = useState<BirthDetails>();
  const [error, setError] = useState<ChartShareCodecError | ''>('');

  useEffect(() => {
    const fragment = globalThis.location?.hash ?? '';
    if (!fragment.includes('chart=')) return;
    const decoded = decodeChartShareUrlFragment(fragment);
    const birth = chartShareResultToBirthDetails(decoded);
    if (birth) {
      setPendingBirth(birth);
      setError('');
    } else if (!decoded.ok) {
      setError(decoded.error);
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
      <h2 id="shared-chart-heading" className="text-lg font-semibold">{t('heading')}</h2>
      {pendingBirth && (
        <div className="mt-3 rounded-lg border border-slate-700 p-3">
          <p role="status">{t('available')}</p>
          <Button type="button" className="mt-2" onClick={loadShared}>{t('load')}</Button>
        </div>
      )}
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-rose-300">{t(`errors.${error}`)}</p>
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>{t('dismiss')}</Button>
        </div>
      )}
    </section>
  );
};
