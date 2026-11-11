import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Globe, Compass, Sparkles, Clock } from 'lucide-react';
import { BirthDetails, AyanamsaType } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { DateTimeSelector } from './DateTimeSelector';
import { PlaceResult } from '../services/geocoding';
import { validateBirthDetails, type BirthValidationError } from '../core/validation/birthDetailsValidation';
import { getTimeZoneResolutionStatus, isValidIanaTimeZone, resolveLocalDateTime, type TimeZoneResolutionStatus } from '../core/time/timeZoneResolution';
import { ChartProfileService, type ChartProfileOperationError } from '../features/chart-profiles/chartProfileService';
import type { ChartProfile } from '../features/chart-profiles/chartProfileSchema';
import { useTranslation } from 'react-i18next';

interface BirthFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDetails: BirthDetails;
  onSave: (details: BirthDetails) => void;
  service?: ChartProfileService;
}

const PROFILE_SAVE_WARNING_CLOSE_DELAY_MS = 1600;

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

export const BirthFormModal: React.FC<BirthFormModalProps> = ({
  isOpen,
  onClose,
  currentDetails,
  onSave,
  service: suppliedService
}) => {
  const { t: tBirth } = useTranslation('birthForm');
  const { t: tDateTime } = useTranslation('dateTime');
  const { t: tProfiles } = useTranslation('profiles');
  const { t: tValidation } = useTranslation('validation');
  const { t: tCommon } = useTranslation('common');
  const profileService = useMemo(
    () => suppliedService ?? new ChartProfileService(),
    [suppliedService]
  );
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
  const [savedProfiles, setSavedProfiles] = useState<readonly ChartProfile[]>([]);
  const [profileListError, setProfileListError] = useState<ChartProfileOperationError | ''>('');
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [profileSaveWarning, setProfileSaveWarning] = useState<ChartProfileOperationError | ''>('');
  const timeZoneStatus: TimeZoneResolutionStatus = getTimeZoneResolutionStatus(timeZone, timeZoneSource);
  const localDateTimeResolution = resolveLocalDateTime(dateTimeStr, timeZone);
  const validationMessage = (error?: BirthValidationError) => {
    if (!error) return '';
    const value = error.field === 'latitude' ? latitude
      : error.field === 'longitude' ? longitude
        : error.field === 'timeZone' ? timeZone
          : error.field === 'ayanamsa' ? ayanamsa : '';
    return tValidation(error.code, { value });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const refreshProfiles = useCallback(() => {
    let result = profileService.listProfiles();
    if (!result.ok && result.error === 'MIGRATION_REQUIRED') {
      result = profileService.migrateProfileStore();
    }
    if (result.ok) {
      setSavedProfiles(result.value);
      setProfileListError('');
    } else {
      setSavedProfiles([]);
      setProfileListError(result.error);
    }
  }, [profileService]);

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
      setSaveAsProfile(false);
      setProfileSaveWarning('');
      refreshProfiles();
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, currentDetails, refreshProfiles]);

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

    let profileSaveFailed = false;
    if (saveAsProfile) {
      const saved = profileService.saveProfile(
        candidateBirthDetails.name ?? 'Custom Horoscope',
        candidateBirthDetails
      );
      if (saved.ok) {
        setSavedProfiles((previous) => [...previous, saved.value]);
        setProfileSaveWarning('');
      } else {
        profileSaveFailed = true;
        setProfileSaveWarning(saved.error);
      }
    }

    onSave(candidateBirthDetails);
    if (profileSaveFailed) {
      window.setTimeout(onClose, PROFILE_SAVE_WARNING_CLOSE_DELAY_MS);
    } else {
      onClose();
    }
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

  const applyBirthDetails = (details: BirthDetails) => {
    setName(details.name || 'Preset');
    setPlaceOfBirth(details.placeOfBirth || '');
    const tz = details.timeZone;
    setTimeZone(tz);
    setTimeZoneSource('USER');
    setDateTimeStr(utcISOToZonedWallClock(details.dateTimeStr, tz));
    setLatitude(details.latitude.toString());
    setLongitude(details.longitude.toString());
    setAyanamsa(details.ayanamsa);
    setSelectedAmbiguousInstant('');
    setValidationErrors([]);
  };

  const handleDeleteProfile = (profile: ChartProfile) => {
    const result = profileService.deleteProfile(profile.id);
    if (result.ok) {
      refreshProfiles();
    } else {
      setProfileListError(result.error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:pt-[env(safe-area-inset-top)] sm:pb-[env(safe-area-inset-bottom)] overflow-y-auto"
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
                  {tBirth('title')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={tBirth('close')}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-7rem)] overflow-y-auto scrollbar-none">
              {/* Saved Chart Profiles */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2 font-mono-code">
                  {tBirth('profilesTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-500 mb-2">
                  {tBirth('profilePrivacy')}
                </p>
                {profileListError && (
                  <p role="alert" className="mb-2 text-xs text-rose-400">{tProfiles(`errors.${profileListError}`)}</p>
                )}
                {savedProfiles.length > 0 ? (
                  <ul className="space-y-1.5">
                    {savedProfiles.map((profile) => (
                      <li key={profile.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => applyBirthDetails(profile.birthDetails)}
                          className="flex-1 min-w-0 rounded-lg border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-750 light:hover:bg-slate-100 hover:border-indigo-500/50 px-3 py-2 text-left text-xs font-medium text-slate-200 dark:text-slate-200 light:text-slate-800 transition-colors cursor-pointer truncate"
                        >
                          {profile.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(profile)}
                          aria-label={tBirth('deleteProfile', { name: profile.label })}
                          className="shrink-0 rounded-lg border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors cursor-pointer"
                        >
                          {tBirth('delete')}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !profileListError ? (
                  <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-500">
                    {tBirth('noProfiles')}
                  </p>
                ) : null}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Chart Title & Place of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      {tBirth('chartName')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={tBirth('namePlaceholder')}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>{tBirth('place')}</span>
                    </label>
                    <PlaceAutocomplete
                      initialValue={placeOfBirth}
                      onSelect={handleSelectPlace}
                      placeholder={tBirth('placePlaceholder')}
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>{tBirth('dateTime')}</span>
                    </label>
                    <DateTimeSelector dateTimeStr={dateTimeStr} onChange={(value) => { setDateTimeStr(value); setSelectedAmbiguousInstant(''); }} />
                    {validationErrors.some((e) => e.field === 'dateTimeStr') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationMessage(validationErrors.find((e) => e.field === 'dateTimeStr'))}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>{tBirth('timeZone')}</span>
                    </label>
                    <input
                      id="birth-time-zone"
                      list="birth-time-zone-options"
                      required
                      value={timeZone}
                      onChange={(e) => { setTimeZone(e.target.value); setTimeZoneSource('USER'); setSelectedAmbiguousInstant(''); }}
                      placeholder={tBirth('timeZonePlaceholder')}
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
                        {tDateTime('timeZoneUnresolved')}
                      </p>
                    )}
                    {timeZoneStatus === 'INVALID' && <p role="alert" className="mt-1 text-xs text-rose-400">{tDateTime('timeZoneInvalid')}</p>}
                    {validationErrors.some((e) => e.field === 'timeZone') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationMessage(validationErrors.find((e) => e.field === 'timeZone'))}
                      </p>
                    )}
                  </div>
                </div>

                {localDateTimeResolution.status === 'UNIQUE' && (
                  <p className="text-xs text-slate-400" aria-live="polite">
                    {tDateTime('resolvedInstant')} <span className="font-mono text-slate-200">{localDateTimeResolution.candidates[0].instant}</span>
                    {' '}({localDateTimeResolution.candidates[0].offsetLabel})
                  </p>
                )}
                {localDateTimeResolution.status === 'AMBIGUOUS' && selectedAmbiguousInstant && (
                  <p className="text-xs text-slate-400" aria-live="polite">
                    {tDateTime('selectedInstant')} <span className="font-mono text-slate-200">{selectedAmbiguousInstant}</span>
                  </p>
                )}
                {localDateTimeResolution.status === 'AMBIGUOUS' && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <label htmlFor="birth-time-ambiguity" className="block text-xs font-semibold text-amber-200 mb-1">
                      {tDateTime('ambiguous')}
                    </label>
                    <select
                      id="birth-time-ambiguity"
                      value={selectedAmbiguousInstant}
                      onChange={(event) => setSelectedAmbiguousInstant(event.target.value)}
                      className="w-full rounded-lg border border-amber-500/40 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="">{tDateTime('chooseOccurrence')}</option>
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
                    {tDateTime('nonexistent')}
                  </p>
                )}

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>{tBirth('latitude')}</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      placeholder={tBirth('latitudePlaceholder')}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                    />
                    {validationErrors.some((e) => e.field === 'latitude') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationMessage(validationErrors.find((e) => e.field === 'latitude'))}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" aria-hidden="true" />
                      <span>{tBirth('longitude')}</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      placeholder={tBirth('longitudePlaceholder')}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono-code"
                    />
                    {validationErrors.some((e) => e.field === 'longitude') && (
                      <p className="mt-1 text-xs text-rose-400">
                        {validationMessage(validationErrors.find((e) => e.field === 'longitude'))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ayanamsa Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    {tBirth('ayanamsa')}
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
                      {validationMessage(validationErrors.find((e) => e.field === 'ayanamsa'))}
                    </p>
                  )}
                </div>

                {/* Save as profile + Submit */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsProfile}
                      onChange={(e) => setSaveAsProfile(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{tBirth('saveAsProfile')}</span>
                  </label>
                  {profileSaveWarning && (
                    <p role="alert" className="text-xs text-amber-300 sm:order-first sm:w-full">
                      {tBirth('profileSaveWarning', { message: tProfiles(`errors.${profileSaveWarning}`) })}
                    </p>
                  )}
                  <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-colors cursor-pointer"
                  >
                    {tCommon('cancel')}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center space-x-1.5 border border-indigo-400/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tBirth('calculate')}</span>
                  </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
