import type { BirthDetails } from '../../types';
import { validateBirthDetails } from '../../core/validation/birthDetailsValidation';
import {
  chartSharePayloadToBirthDetails,
  validateChartSharePayload,
  type ChartSharePayloadV1
} from './chartShareSchema';

export const MAX_SHARE_TOKEN_LENGTH = 2048;
export type ChartShareCodecError = 'MISSING' | 'TOO_LARGE' | 'BAD_ENCODING' | 'BAD_JSON' | 'UNSUPPORTED_VERSION' | 'INVALID_INPUT';

export type ChartShareCodecResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ChartShareCodecError };

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error('Invalid Base64URL token');
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (encodeBase64Url(decoded) !== value) throw new Error('Non-canonical Base64URL token');
  return decoded;
}

function toPayload(birthDetails: BirthDetails): ChartSharePayloadV1 {
  return {
    version: 1,
    dateTimeStr: birthDetails.dateTimeStr,
    timeZone: birthDetails.timeZone,
    latitude: birthDetails.latitude,
    longitude: birthDetails.longitude,
    ayanamsa: birthDetails.ayanamsa
  };
}

export function encodeChartShare(birthDetails: BirthDetails): ChartShareCodecResult<string> {
  if (validateBirthDetails(birthDetails).length > 0) return { ok: false, error: 'INVALID_INPUT' };
  try {
    const token = `v1.${encodeBase64Url(JSON.stringify(toPayload(birthDetails)))}`;
    return token.length > MAX_SHARE_TOKEN_LENGTH
      ? { ok: false, error: 'TOO_LARGE' }
      : { ok: true, value: token };
  } catch {
    return { ok: false, error: 'BAD_ENCODING' };
  }
}

export function decodeChartShare(token: string | null | undefined): ChartShareCodecResult<ChartSharePayloadV1> {
  if (!token) return { ok: false, error: 'MISSING' };
  if (token.length > MAX_SHARE_TOKEN_LENGTH) return { ok: false, error: 'TOO_LARGE' };
  if (!token.startsWith('v1.')) {
    return { ok: false, error: /^[a-zA-Z0-9]+\./.test(token) ? 'UNSUPPORTED_VERSION' : 'BAD_ENCODING' };
  }
  const encoded = token.slice(3);
  let decoded: string;
  try {
    decoded = decodeBase64Url(encoded);
  } catch {
    return { ok: false, error: 'BAD_ENCODING' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return { ok: false, error: 'BAD_JSON' };
  }
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && parsed.version !== 1) {
    return { ok: false, error: 'UNSUPPORTED_VERSION' };
  }
  const validated = validateChartSharePayload(parsed);
  if (!validated.ok) return { ok: false, error: 'INVALID_INPUT' };
  const birth = chartSharePayloadToBirthDetails(validated.value);
  if (validateBirthDetails(birth).length > 0) return { ok: false, error: 'INVALID_INPUT' };
  return validated;
}
