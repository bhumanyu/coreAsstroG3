import React, { useEffect, useMemo, useState } from 'react';
import type { BirthDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { ChartProfileService, type ChartProfileOperationError } from './chartProfileService';
import type { ChartProfile } from './chartProfileSchema';

export interface ChartProfileManagerProps {
  readonly currentBirthDetails: BirthDetails;
  readonly onRestoreBirthDetails: (birthDetails: BirthDetails) => void;
  readonly service?: ChartProfileService;
}

const ERROR_MESSAGES: Record<ChartProfileOperationError, string> = {
  DUPLICATE_ID: 'A profile with this identifier already exists.',
  LIMIT_REACHED: 'The browser profile limit has been reached. Delete a profile before saving another.',
  INVALID_LABEL: 'Enter a name of 1-80 characters.',
  NOT_FOUND: 'That saved profile is no longer available. Refresh the list and try again.',
  INVALID_BIRTH_DETAILS: 'The saved chart inputs are invalid and cannot be restored.',
  CORRUPT: 'Saved chart data is damaged. It has been left unchanged; delete the browser data only if you choose to start over.',
  UNAVAILABLE: 'Browser storage is unavailable. Your chart is unchanged; try again in a browser that allows local storage.',
  QUOTA: 'Browser storage is full. Delete an unused profile or free browser storage and try again.',
  UNSUPPORTED_VERSION: 'These saved profiles were created by a newer app version and were left unchanged.',
  MIGRATION_REQUIRED: 'Saved profiles need a format update. Use the profile refresh action before changing them.'
};

export const ChartProfileManager: React.FC<ChartProfileManagerProps> = ({
  currentBirthDetails,
  onRestoreBirthDetails,
  service: suppliedService
}) => {
  const service = useMemo(() => suppliedService ?? new ChartProfileService(), [suppliedService]);
  const [profiles, setProfiles] = useState<readonly ChartProfile[]>([]);
  const [label, setLabel] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const result = service.listProfiles();
    if (result.ok) {
      setProfiles(result.value);
      setErrorMessage('');
    } else {
      setProfiles([]);
      setErrorMessage(ERROR_MESSAGES[result.error]);
    }
  }, [service, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const handleSave = () => {
    const result = service.saveProfile(label, currentBirthDetails);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    setLabel('');
    setStatusMessage(`Saved "${result.value.label}" on this browser/device.`);
    setErrorMessage('');
    refresh();
  };

  const handleRename = (profile: ChartProfile) => {
    const nextLabel = globalThis.prompt('New profile name', profile.label);
    if (nextLabel === null) return;
    const result = service.renameProfile(profile.id, nextLabel);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    setStatusMessage(`Renamed profile to "${result.value.label}".`);
    setErrorMessage('');
    refresh();
  };

  const handleRestore = (profile: ChartProfile) => {
    const result = service.restoreProfile(profile.id);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    onRestoreBirthDetails(result.value);
    setStatusMessage(`Restored "${profile.label}". Analysis will run from these inputs.`);
    setErrorMessage('');
  };

  const handleDelete = (profile: ChartProfile) => {
    if (!globalThis.confirm(`Delete the saved profile "${profile.label}" from this browser/device?`)) return;
    const result = service.deleteProfile(profile.id);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    setStatusMessage(`Deleted "${profile.label}" from this browser/device.`);
    setErrorMessage('');
    refresh();
  };

  return (
    <section aria-labelledby="chart-profile-heading" className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
      <h2 id="chart-profile-heading" className="text-lg font-semibold">Saved chart profiles</h2>
      <p className="mt-1 text-sm text-slate-300">Saved on this browser/device only. These profiles are not backed up or synced.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-col gap-1 text-sm">
          Profile name
          <input
            aria-label="Profile name"
            maxLength={80}
            value={label}
            onChange={(event) => setLabel(event.currentTarget.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          />
        </label>
        <Button type="button" onClick={handleSave} disabled={!label.trim()}>Save current chart</Button>
        <Button type="button" variant="outline" onClick={() => {
          const result = service.migrateProfileStore();
          if (result.ok) {
            setProfiles(result.value);
            setErrorMessage('');
            setStatusMessage('Saved profile list refreshed.');
          } else {
            setErrorMessage(ERROR_MESSAGES[result.error]);
            setStatusMessage('');
          }
        }}>Refresh profile list</Button>
      </div>
      {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
      {statusMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{statusMessage}</p>}
      {profiles.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-700/70">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>{profile.label}</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleRestore(profile)}>Restore</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => handleRename(profile)}>Rename</Button>
                <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(profile)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : !errorMessage ? <p className="mt-3 text-sm text-slate-400">No saved profiles on this browser/device.</p> : null}
    </section>
  );
};
