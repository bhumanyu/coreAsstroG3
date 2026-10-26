import type { BirthDetails } from '../../types';
import { chartSharePayloadToBirthDetails } from './chartShareSchema';
import { decodeChartShare, encodeChartShare, type ChartShareCodecResult } from './chartShareCodec';

export function createChartShareUrl(baseUrl: string, birthDetails: BirthDetails): ChartShareCodecResult<string> {
  const encoded = encodeChartShare(birthDetails);
  if (!encoded.ok) return encoded;
  try {
    const url = new URL(baseUrl);
    url.hash = `chart=${encoded.value}`;
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: 'INVALID_INPUT' };
  }
}

export function decodeChartShareUrlFragment(fragment: string): ReturnType<typeof decodeChartShare> {
  if (!fragment || fragment === '#') return { ok: false, error: 'MISSING' };
  const query = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(query);
  const token = params.get('chart');
  return decodeChartShare(token);
}

export function chartShareResultToBirthDetails(
  result: ReturnType<typeof decodeChartShare>
): BirthDetails | undefined {
  return result.ok ? chartSharePayloadToBirthDetails(result.value) : undefined;
}
