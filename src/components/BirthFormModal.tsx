import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Globe, Compass, Sparkles, Clock } from 'lucide-react';
import { BirthDetails, AyanamsaType } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { PlaceResult } from '../services/geocoding';

interface BirthFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDetails: BirthDetails;
  onSave: (details: BirthDetails) => void;
}

function getZonedParts(date: Date, timeZone: string) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23'
    });
    const parts = dtf.formatToParts(date);
    const getPart = (type: string) => {
      const p = parts.find((pt) => pt.type === type)?.value || '0';
      return parseInt(p, 10);
    };
    let hour = getPart('hour');
    if (hour === 24) hour = 0;
    return {
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
      hour,
      minute: getPart('minute'),
      second: getPart('second')
    };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds()
    };
  }
}

function getOffsetMs(ms: number, timeZone: string): number {
  const parts = getZonedParts(new Date(ms), timeZone);
  const zonedMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return zonedMs - ms;
}

export function zonedWallClockToUtcISO(dateTimeStr: string, timeZone: string): string {
  if (!dateTimeStr) return new Date().toISOString();

  const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return new Date(dateTimeStr).toISOString();
  }
  const [, yr, mo, da, hr, mi, se] = match;
  const year = parseInt(yr, 10);
  const month = parseInt(mo, 10);
  const day = parseInt(da, 10);
  const hour = parseInt(hr, 10);
  const minute = parseInt(mi, 10);
  const second = se ? parseInt(se, 10) : 0;

  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  const offsetMs1 = getOffsetMs(guessUtcMs, timeZone);
  const targetUtcMs = guessUtcMs - offsetMs1;
  const offsetMs2 = getOffsetMs(targetUtcMs, timeZone);
  const finalUtcMs = guessUtcMs - offsetMs2;

  return new Date(finalUtcMs).toISOString();
}

export function utcISOToZonedWallClock(iso: string, timeZone: string): string {
  if (!iso) return '2024-05-15T12:00';
  const isoClean = (iso.includes('Z') || iso.includes('+') || (iso.length > 10 && iso.slice(10).includes('-')))
    ? iso
    : iso + 'Z';
  const date = new Date(isoClean);
  if (isNaN(date.getTime())) {
    return iso.slice(0, 16) || '2024-05-15T12:00';
  }
  const parts = getZonedParts(date, timeZone);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export const PRESET_PROFILES: { name: string; details: BirthDetails; desc: string }[] = [
  {
    name: 'Standard CoreAstro Test Vector',
    desc: 'Default test epoch (2024-05-15 12:00 UTC, Ujjain 23.17° N, 75.78° E)',
    details: {
      name: 'CoreAstro Test Chart',
      placeOfBirth: 'Ujjain, MP, India',
      dateTimeStr: '2024-05-15T12:00:00Z',
      timeZone: 'UTC',
      latitude: 23.1793,
      longitude: 75.7849,
      ayanamsa: AyanamsaType.LAHIRI
    }
  },
  {
    name: 'J2000 Astronomical Epoch',
    desc: 'Standard astronomical reference epoch (2000-01-01 12:00 UTC, Greenwich)',
    details: {
      name: 'J2000 Epoch',
      placeOfBirth: 'Greenwich, London, UK',
      dateTimeStr: '2000-01-01T12:00:00Z',
      timeZone: 'UTC',
      latitude: 51.4769,
      longitude: 0.0005,
      ayanamsa: AyanamsaType.LAHIRI
    }
  },
  {
    name: 'New Delhi Birth Chart',
    desc: 'Sample chart generated for New Delhi, India (28.61° N, 77.20° E)',
    details: {
      name: 'Sample New Delhi',
      placeOfBirth: 'New Delhi, India',
      dateTimeStr: '1995-10-24T06:30:00Z',
      timeZone: 'Asia/Kolkata',
      latitude: 28.6139,
      longitude: 77.2090,
      ayanamsa: AyanamsaType.LAHIRI
    }
  }
];

export const BirthFormModal: React.FC<BirthFormModalProps> = ({
  isOpen,
  onClose,
  currentDetails,
  onSave
}) => {
  const [name, setName] = useState(currentDetails.name || 'Custom Horoscope');
  const [placeOfBirth, setPlaceOfBirth] = useState(currentDetails.placeOfBirth || 'Ujjain, India');
  const [timeZone, setTimeZone] = useState(currentDetails.timeZone || 'UTC');
  const [dateTimeStr, setDateTimeStr] = useState(() =>
    utcISOToZonedWallClock(
      currentDetails.dateTimeStr || '2024-05-15T12:00:00Z',
      currentDetails.timeZone || 'UTC'
    )
  );
  const [latitude, setLatitude] = useState(currentDetails.latitude.toString());
  const [longitude, setLongitude] = useState(currentDetails.longitude.toString());
  const [ayanamsa, setAyanamsa] = useState<AyanamsaType>(currentDetails.ayanamsa || AyanamsaType.LAHIRI);

  useEffect(() => {
    if (isOpen) {
      setName(currentDetails.name || 'Custom Horoscope');
      setPlaceOfBirth(currentDetails.placeOfBirth || 'Ujjain, India');
      const tz = currentDetails.timeZone || 'UTC';
      setTimeZone(tz);
      setDateTimeStr(
        utcISOToZonedWallClock(
          currentDetails.dateTimeStr || '2024-05-15T12:00:00Z',
          tz
        )
      );
      setLatitude(currentDetails.latitude.toString());
      setLongitude(currentDetails.longitude.toString());
      setAyanamsa(currentDetails.ayanamsa || AyanamsaType.LAHIRI);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Custom Horoscope',
      placeOfBirth: placeOfBirth.trim() || 'Custom Location',
      dateTimeStr: zonedWallClockToUtcISO(dateTimeStr, timeZone),
      timeZone,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      ayanamsa
    });
    onClose();
  };

  const handleSelectPlace = (place: PlaceResult) => {
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    const label = parts.join(', ');
    setPlaceOfBirth(label);
    setLatitude(place.latitude.toString());
    setLongitude(place.longitude.toString());
    if (place.timezone) {
      setTimeZone(place.timezone);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_PROFILES[0]) => {
    setName(preset.details.name || 'Preset');
    setPlaceOfBirth(preset.details.placeOfBirth || '');
    const tz = preset.details.timeZone;
    setTimeZone(tz);
    setDateTimeStr(utcISOToZonedWallClock(preset.details.dateTimeStr, tz));
    setLatitude(preset.details.latitude.toString());
    setLongitude(preset.details.longitude.toString());
    setAyanamsa(preset.details.ayanamsa);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold font-serif-astro text-slate-100">
              Calculate Horoscope & Positions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Preset Test Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_PROFILES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                    {preset.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-widest text-slate-500 font-mono-code">
              Or Customize Details
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chart Title & Place of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chart Name / Subject
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CoreAstro Test Vector 1"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Place of Birth (Search city)</span>
                </label>
                <PlaceAutocomplete
                  initialValue={placeOfBirth}
                  onSelect={handleSelectPlace}
                  placeholder="e.g. Ujjain, Muzaffarpur, London..."
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Date & Time (local to selected zone)</span>
                </label>
                <input
                  type="datetime-local"
                  value={dateTimeStr}
                  onChange={(e) => setDateTimeStr(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Time Zone</span>
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC (+00:00)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata IST (+05:30)</option>
                  <option value="America/New_York">America/New_York EST (-05:00)</option>
                  <option value="Europe/London">Europe/London GMT (+00:00)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo JST (+09:00)</option>
                  {!['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].includes(timeZone) && (
                    <option value={timeZone}>{timeZone}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Latitude (°N)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  placeholder="e.g. 23.1793"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Longitude (°E)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  placeholder="e.g. 75.7849"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                />
              </div>
            </div>

            {/* Ayanamsa Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ayanamsa System
              </label>
              <select
                value={ayanamsa}
                onChange={(e) => setAyanamsa(e.target.value as AyanamsaType)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-purple-300 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={AyanamsaType.LAHIRI}>Lahiri (Chitra Paksha - Standard Vedic)</option>
                <option value={AyanamsaType.RAMAN}>B.V. Raman</option>
                <option value={AyanamsaType.KRISHNAMURTI}>Krishnamurti (KP)</option>
                <option value={AyanamsaType.TROPICAL}>Tropical (Sayana / Western)</option>
                <option value={AyanamsaType.FAGAN_BRADLEY}>Fagan-Bradley (Western Sidereal)</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Calculate Chart</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

