import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Globe, Compass, Sparkles, Clock } from 'lucide-react';
import { BirthDetails, AyanamsaType } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { PlaceResult } from '../services/geocoding';
import { validateBirthDetails, type BirthValidationError } from '../core/validation/birthDetailsValidation';

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
  if (!dateTimeStr) {
    throw new Error('Birth datetime is required');
  }

  const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    throw new Error('Invalid datetime format');
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
  const [validationErrors, setValidationErrors] = useState<readonly BirthValidationError[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

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
      setValidationErrors([]); // Clear errors when modal opens
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, currentDetails]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    const candidateBirthDetails: BirthDetails = {
      name: name.trim() || 'Custom Horoscope',
      placeOfBirth: placeOfBirth.trim() || 'Custom Location',
      dateTimeStr: zonedWallClockToUtcISO(dateTimeStr, timeZone),
      timeZone,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      ayanamsa
    };

    // Validate birth details before saving
    const errors = validateBirthDetails(candidateBirthDetails);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSave(candidateBirthDetails);
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
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="birth-modal-title"
        >
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/85 light:bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative w-full max-w-xl z-10 my-8 overflow-hidden rounded-2xl glass-surface border border-indigo-500/30 dark:border-indigo-500/30 light:border-slate-200/90 shadow-2xl shadow-indigo-950/60 light:shadow-slate-300/60 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Compass className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2
                  id="birth-modal-title"
                  className="text-lg font-bold font-serif-astro text-slate-100 dark:text-slate-100 light:text-slate-900"
                >
                  Calculate Horoscope & Positions
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-7rem)] overflow-y-auto scrollbar-none">
              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2 font-mono-code">
                  Select Preset Test Profile
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_PROFILES.map((preset, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-750 light:hover:bg-slate-100 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 hover:border-indigo-500/50 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-indigo-400 light:group-hover:text-indigo-600">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1 line-clamp-2">
                        {preset.desc}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800 dark:border-slate-800 light:border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono-code">
                  Or Customize Details
                </span>
                <div className="flex-grow border-t border-slate-800 dark:border-slate-800 light:border-slate-200"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Chart Title & Place of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Chart Name / Subject
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. CoreAstro Test Vector 1"
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
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
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>Date & Time (local)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateTimeStr}
                      onChange={(e) => setDateTimeStr(e.target.value)}
                      required
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                    />
                    {validationErrors.some((e) => e.field === 'dateTimeStr') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationErrors.find((e) => e.field === 'dateTimeStr')?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>Time Zone</span>
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    {validationErrors.some((e) => e.field === 'timeZone') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationErrors.find((e) => e.field === 'timeZone')?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>Latitude (°N)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      placeholder="e.g. 23.1793"
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                    />
                    {validationErrors.some((e) => e.field === 'latitude') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationErrors.find((e) => e.field === 'latitude')?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>Longitude (°E)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      placeholder="e.g. 75.7849"
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                    />
                    {validationErrors.some((e) => e.field === 'longitude') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationErrors.find((e) => e.field === 'longitude')?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ayanamsa Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Ayanamsa System
                  </label>
                  <select
                    value={ayanamsa}
                    onChange={(e) => setAyanamsa(e.target.value as AyanamsaType)}
                    className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-purple-300 dark:text-purple-300 light:text-purple-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={AyanamsaType.LAHIRI}>Lahiri (Chitra Paksha - Standard Vedic)</option>
                    <option value={AyanamsaType.RAMAN}>B.V. Raman</option>
                    <option value={AyanamsaType.KRISHNAMURTI}>Krishnamurti (KP)</option>
                    <option value={AyanamsaType.TROPICAL}>Tropical (Sayana / Western)</option>
                    <option value={AyanamsaType.FAGAN_BRADLEY}>Fagan-Bradley (Western Sidereal)</option>
                  </select>
                  {validationErrors.some((e) => e.field === 'ayanamsa') && (
                    <p className="mt-1 text-xs text-rose-400">
                      {validationErrors.find((e) => e.field === 'ayanamsa')?.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center space-x-1.5 border border-indigo-400/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Calculate Chart</span>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
