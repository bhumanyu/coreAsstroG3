import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Globe, Compass, Sparkles, Clock } from 'lucide-react';
import { BirthDetails, AyanamsaType } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { DateTimeSelector } from './DateTimeSelector';
import { PlaceResult } from '../services/geocoding';
import { validateBirthDetails, type BirthValidationError } from '../core/validation/birthDetailsValidation';
import { getTimeZoneResolutionStatus, isValidIanaTimeZone, resolveLocalDateTime, type TimeZoneResolutionStatus } from '../core/time/timeZoneResolution';

interface BirthFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDetails: BirthDetails;
  onSave: (details: BirthDetails) => void;
}

export function zonedWallClockToUtcISO(dateTimeStr: string, timeZone: string): string {
  const resolution = resolveLocalDateTime(dateTimeStr, timeZone);
  if (resolution.status === 'UNIQUE') return resolution.candidates[0].instant;
  if (resolution.status === 'AMBIGUOUS') {
    throw new Error('This local time occurs twice because of a daylight-saving transition. Select the intended UTC offset.');
  }
  if (resolution.status === 'NONEXISTENT') {
    throw new Error('This local time does not exist because the clock moves forward. Enter a different time.');
  }
  throw new Error(resolution.reason);
}

export function utcISOToZonedWallClock(iso: string, timeZone: string): string {
  if (!iso || !isValidIanaTimeZone(timeZone)) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return [value('year'), '-', value('month'), '-', value('day'), 'T', value('hour'), ':', value('minute')].join('');
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
  const [timeZone, setTimeZone] = useState(currentDetails.timeZone || '');
  const [dateTimeStr, setDateTimeStr] = useState(() =>
    utcISOToZonedWallClock(
      currentDetails.dateTimeStr,
      currentDetails.timeZone || ''
    )
  );
  const [latitude, setLatitude] = useState(currentDetails.latitude.toString());
  const [longitude, setLongitude] = useState(currentDetails.longitude.toString());
  const [ayanamsa, setAyanamsa] = useState<AyanamsaType>(currentDetails.ayanamsa || AyanamsaType.LAHIRI);
  const [validationErrors, setValidationErrors] = useState<readonly BirthValidationError[]>([]);
  const [selectedAmbiguousInstant, setSelectedAmbiguousInstant] = useState('');
  const [timeZoneSource, setTimeZoneSource] = useState<'PROVIDER' | 'USER'>('PROVIDER');
  const timeZoneStatus: TimeZoneResolutionStatus = getTimeZoneResolutionStatus(timeZone, timeZoneSource);
  const localDateTimeResolution = resolveLocalDateTime(dateTimeStr, timeZone);

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
      const tz = currentDetails.timeZone || '';
      setTimeZone(tz);
      setTimeZoneSource('PROVIDER');
      setDateTimeStr(
        utcISOToZonedWallClock(
          currentDetails.dateTimeStr,
          tz
        )
      );
      setLatitude(currentDetails.latitude.toString());
      setLongitude(currentDetails.longitude.toString());
      setAyanamsa(currentDetails.ayanamsa || AyanamsaType.LAHIRI);
      setValidationErrors([]); // Clear errors when modal opens
      setSelectedAmbiguousInstant('');
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

    const resolution = resolveLocalDateTime(dateTimeStr, timeZone);
    let resolvedInstant: string | undefined;
    if (resolution.status === 'UNIQUE') {
      resolvedInstant = resolution.candidates[0].instant;
    } else if (resolution.status === 'AMBIGUOUS' && resolution.candidates.some(candidate => candidate.instant === selectedAmbiguousInstant)) {
      resolvedInstant = selectedAmbiguousInstant;
    } else {
      const error: BirthValidationError = resolution.status === 'INVALID' && !isValidIanaTimeZone(timeZone)
        ? { field: 'timeZone', code: 'TIMEZONE_UNRESOLVED', message: 'Select or enter a valid IANA timezone before calculating the chart.' }
        : {
          field: 'dateTimeStr',
          code: resolution.status === 'NONEXISTENT' ? 'NONEXISTENT_LOCAL_TIME'
            : resolution.status === 'AMBIGUOUS' ? 'AMBIGUOUS_LOCAL_TIME' : 'INVALID_LOCAL_DATETIME',
          message: resolution.status === 'NONEXISTENT'
            ? 'This local time does not exist because of a daylight-saving clock change. Choose another time.'
            : resolution.status === 'AMBIGUOUS'
              ? 'This local time occurs twice. Select which UTC offset matches the recorded birth time.'
              : resolution.status === 'INVALID'
                ? resolution.reason
                : 'Enter a valid local date and time.'
        };
      setValidationErrors([error]);
      return;
    }

    const candidateBirthDetails: BirthDetails = {
      name: name.trim() || 'Custom Horoscope',
      placeOfBirth: placeOfBirth.trim() || 'Custom Location',
      dateTimeStr: resolvedInstant,
      timeZone,
      latitude: Number(latitude),
      longitude: Number(longitude),
      ayanamsa
    };

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
    // A new location invalidates the prior timezone unless the provider supplies one.
    setTimeZone(place.timezone ?? '');
    setTimeZoneSource('PROVIDER');
    setSelectedAmbiguousInstant('');
  };

  const handleApplyPreset = (preset: typeof PRESET_PROFILES[0]) => {
    setName(preset.details.name || 'Preset');
    setPlaceOfBirth(preset.details.placeOfBirth || '');
    const tz = preset.details.timeZone;
    setTimeZone(tz);
    setTimeZoneSource('USER');
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
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>Date & Time (local)</span>
                    </label>
                    <DateTimeSelector dateTimeStr={dateTimeStr} onChange={(value) => { setDateTimeStr(value); setSelectedAmbiguousInstant(''); }} />
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
                    <input
                      id="birth-time-zone"
                      list="birth-time-zone-options"
                      required
                      value={timeZone}
                      onChange={(e) => { setTimeZone(e.target.value); setTimeZoneSource('USER'); setSelectedAmbiguousInstant(''); }}
                      placeholder="Enter IANA timezone, e.g. Asia/Kolkata"
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <datalist id="birth-time-zone-options">
                      <option value="UTC" />
                      <option value="Asia/Kolkata" />
                      <option value="America/New_York" />
                      <option value="Europe/London" />
                      <option value="Asia/Tokyo" />
                      <option value="Australia/Sydney" />
                      <option value="Pacific/Auckland" />
                    </datalist>
                    {timeZoneStatus === 'UNRESOLVED' && (
                      <p role="alert" className="mt-1 text-xs text-amber-300">
                        Timezone is unresolved. Enter a valid IANA timezone; the chart cannot be calculated until it is resolved.
                      </p>
                    )}
                    {timeZoneStatus === 'INVALID' && <p role="alert" className="mt-1 text-xs text-rose-400">The timezone identifier is invalid. Enter a valid IANA timezone.</p>}
                    {validationErrors.some((e) => e.field === 'timeZone') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationErrors.find((e) => e.field === 'timeZone')?.message}
                      </p>
                    )}
                  </div>
                </div>

                {localDateTimeResolution.status === 'UNIQUE' && (
                  <p className="text-xs text-slate-400" aria-live="polite">
                    Resolved instant: <span className="font-mono text-slate-200">{localDateTimeResolution.candidates[0].instant}</span>
                    {' '}({localDateTimeResolution.candidates[0].offsetLabel})
                  </p>
                )}
                {localDateTimeResolution.status === 'AMBIGUOUS' && selectedAmbiguousInstant && (
                  <p className="text-xs text-slate-400" aria-live="polite">
                    Selected instant: <span className="font-mono text-slate-200">{selectedAmbiguousInstant}</span>
                  </p>
                )}
                {localDateTimeResolution.status === 'AMBIGUOUS' && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <label htmlFor="birth-time-ambiguity" className="block text-xs font-semibold text-amber-200 mb-1">
                      This local time occurs twice. Select the recorded offset.
                    </label>
                    <select
                      id="birth-time-ambiguity"
                      value={selectedAmbiguousInstant}
                      onChange={(event) => setSelectedAmbiguousInstant(event.target.value)}
                      className="w-full rounded-lg border border-amber-500/40 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="">Choose the correct occurrence</option>
                      {localDateTimeResolution.candidates.map((candidate) => (
                        <option key={candidate.instant} value={candidate.instant}>
                          {candidate.offsetLabel} — {candidate.instant}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {localDateTimeResolution.status === 'NONEXISTENT' && (
                  <p role="alert" className="text-xs text-rose-400">
                    This local time does not exist in the selected timezone because the clock moves forward. Choose a valid time.
                  </p>
                )}

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
