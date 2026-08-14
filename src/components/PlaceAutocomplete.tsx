import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { searchPlaces, PlaceResult } from '../services/geocoding';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      const res = await searchPlaces(query);
      setResults(res);
      setLoading(false);
      setOpen(res.length > 0);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

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
