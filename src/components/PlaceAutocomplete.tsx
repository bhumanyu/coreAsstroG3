import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { searchPlacesDetailed } from '../services/geocoding';
import type { PlaceResult } from '../services/geocoding';

interface PlaceAutocompleteProps {
  onSelect: (place: PlaceResult) => void;
  initialValue?: string;
  placeholder?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  onSelect,
  initialValue = '',
  placeholder = 'Search city (e.g., Muzaffarpur, London, New York)...'
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestTokenRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const token = ++requestTokenRef.current;
    const abortController = new AbortController();
    setLoading(false);
    setSearchError(null);
    setNoResults(false);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return () => {
        abortController.abort();
        if (requestTokenRef.current === token) requestTokenRef.current += 1;
      };
    }

    setResults([]);
    setOpen(false);
    setLoading(true);
    const handler = setTimeout(() => {
      void searchPlacesDetailed(query, { signal: abortController.signal }).then((outcome) => {
        if (abortController.signal.aborted || token !== requestTokenRef.current) return;

        setLoading(false);
        switch (outcome.status) {
          case 'SUCCESS':
            setResults([...outcome.places]);
            setOpen(true);
            break;
          case 'NO_RESULTS':
            setResults([]);
            setOpen(true);
            setNoResults(true);
            break;
          case 'ABORTED':
            setResults([]);
            setOpen(false);
            setSearchError(null);
            break;
          default:
            setResults([]);
            setOpen(true);
            setSearchError('Place search is temporarily unavailable. Please try again.');
            break;
        }
      }).catch(() => {
        if (abortController.signal.aborted || token !== requestTokenRef.current) return;
        setLoading(false);
        setResults([]);
        setOpen(true);
        setSearchError('Place search is temporarily unavailable. Please try again.');
      });
    }, 300);

    return () => {
      clearTimeout(handler);
      abortController.abort();
      if (requestTokenRef.current === token) requestTokenRef.current += 1;
    };
  }, [query, retryCount]);
  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (place: PlaceResult) => {
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    const label = parts.join(', ');
    setQuery(label);
    setOpen(false);
    onSelect(place);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open && e.target.value.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (results.length > 0 && query.trim().length >= 2) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-300 absolute right-3 px-1"
          >
            ✕
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 text-slate-600 absolute right-3 pointer-events-none" />
        )}
      </div>

      {loading && (
        <div role="status" aria-live="polite" className="mt-1 text-xs text-slate-400">
          Searching places…
        </div>
      )}
      {!loading && noResults && (
        <div role="status" aria-live="polite" className="mt-1 text-xs text-slate-400">
          No places found. You can still enter coordinates and time zone manually.
        </div>
      )}
      {!loading && searchError && (
        <div role="alert" aria-live="polite" className="mt-1 flex items-center gap-2 text-xs text-rose-400">
          <span>{searchError}</span>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="underline underline-offset-2 hover:text-rose-300"
          >
            Retry
          </button>
        </div>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-800 text-sm">
          {results.map((place, idx) => {
            const subtitle = [place.admin1, place.country].filter(Boolean).join(', ');
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800 transition-colors flex flex-col justify-center cursor-pointer group"
                >
                  <span className="font-semibold text-slate-200 group-hover:text-indigo-400">
                    {place.name}
                  </span>
                  {subtitle && (
                    <span className="text-xs text-slate-400 mt-0.5">
                      {subtitle} ({place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°) • {place.timezone}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
