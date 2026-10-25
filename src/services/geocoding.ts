export interface PlaceResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type GeocodingOutcome =
  | { readonly status: 'SUCCESS'; readonly places: readonly PlaceResult[] }
  | { readonly status: 'NO_RESULTS'; readonly places: readonly [] }
  | { readonly status: 'NETWORK_ERROR'; readonly message?: string }
  | { readonly status: 'HTTP_ERROR'; readonly statusCode: number }
  | { readonly status: 'TIMEOUT' }
  | { readonly status: 'ABORTED' }
  | { readonly status: 'INVALID_RESPONSE' };

export interface SearchPlacesOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TIMEOUT_MS = 15000;

export class GeocodingError extends Error {
  constructor(readonly outcome: Exclude<GeocodingOutcome, { status: 'SUCCESS' | 'NO_RESULTS' }>) {
    super(outcome.status === 'HTTP_ERROR'
      ? `Place search failed with HTTP status ${outcome.statusCode}.`
      : `Place search failed: ${outcome.status.toLowerCase().replace('_', ' ')}.`);
    this.name = 'GeocodingError';
  }
}

export async function searchPlacesDetailed(
  query: string,
  options: SearchPlacesOptions = {}
): Promise<GeocodingOutcome> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { status: 'NO_RESULTS', places: [] };
  }
  if (options.signal?.aborted) {
    return { status: 'ABORTED' };
  }

  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const abortController = new AbortController();
  let timedOut = false;
  let callerAborted = false;
  let resolveTermination!: (outcome: GeocodingOutcome) => void;
  const termination = new Promise<GeocodingOutcome>((resolve) => {
    resolveTermination = resolve;
  });
  const abortFromCaller = () => {
    callerAborted = true;
    abortController.abort();
    resolveTermination({ status: 'ABORTED' });
  };
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    abortController.abort();
    resolveTermination({ status: 'TIMEOUT' });
  }, timeoutMs);

  try {
    const request = async (): Promise<GeocodingOutcome> => {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
      const response = await fetch(url, { signal: abortController.signal });
      if (timedOut) return { status: 'TIMEOUT' };
      if (callerAborted || options.signal?.aborted) return { status: 'ABORTED' };
      if (!response.ok) {
        return { status: 'HTTP_ERROR', statusCode: response.status };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        if (timedOut) return { status: 'TIMEOUT' };
        if (callerAborted || options.signal?.aborted) return { status: 'ABORTED' };
        return { status: 'INVALID_RESPONSE' };
      }
      if (timedOut) return { status: 'TIMEOUT' };
      if (callerAborted || options.signal?.aborted) return { status: 'ABORTED' };

      const places = parsePlaces(payload);
      if (!places) return { status: 'INVALID_RESPONSE' };
      return places.length === 0
        ? { status: 'NO_RESULTS', places: [] }
        : { status: 'SUCCESS', places };
    };

    return await Promise.race([request(), termination]);
  } catch (error) {
    if (timedOut) return { status: 'TIMEOUT' };
    if (callerAborted || options.signal?.aborted) return { status: 'ABORTED' };
    return {
      status: 'NETWORK_ERROR',
      ...(error instanceof Error ? { message: error.message } : {})
    };
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function searchPlaces(
  query: string,
  options?: SearchPlacesOptions
): Promise<PlaceResult[]> {
  const outcome = await searchPlacesDetailed(query, options);
  if (outcome.status === 'SUCCESS' || outcome.status === 'NO_RESULTS') {
    return [...outcome.places];
  }
  throw new GeocodingError(outcome);
}

function normalizeTimeout(timeoutMs?: number): number {
  if (timeoutMs === undefined || !Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS;
  return Math.max(1, Math.min(Math.floor(timeoutMs), MAX_TIMEOUT_MS));
}

function parsePlaces(payload: unknown): PlaceResult[] | undefined {
  if (typeof payload !== 'object' || payload === null || !('results' in payload)) return undefined;
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) return undefined;

  const places: PlaceResult[] = [];
  for (const item of results) {
    if (typeof item !== 'object' || item === null) return undefined;
    const place = item as Record<string, unknown>;
    if (typeof place.name !== 'string' || place.name.trim().length === 0
      || typeof place.latitude !== 'number' || !Number.isFinite(place.latitude)
      || typeof place.longitude !== 'number' || !Number.isFinite(place.longitude)
      || (place.admin1 !== undefined && typeof place.admin1 !== 'string')
      || (place.country !== undefined && typeof place.country !== 'string')
      || (place.timezone !== undefined && typeof place.timezone !== 'string')) {
      return undefined;
    }
    places.push({
      name: place.name,
      ...(typeof place.admin1 === 'string' ? { admin1: place.admin1 } : {}),
      ...(typeof place.country === 'string' ? { country: place.country } : {}),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: typeof place.timezone === 'string' && place.timezone.length > 0
        ? place.timezone
        : 'UTC'
    });
  }
  return places;
}
