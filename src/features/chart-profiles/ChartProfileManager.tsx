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
  LIMIT_REACHED: 'The browser profile limit has been reached. Delete a profile before saving or importing more.',
  INVALID_LABEL: 'Enter a name of 1-80 characters.',
  NOT_FOUND: 'That saved profile is no longer available. Refresh the list and try again.',
  INVALID_BIRTH_DETAILS: 'The saved chart inputs are invalid and cannot be restored.',
  CORRUPT: 'Saved chart data is damaged. It has been left unchanged; delete the browser data only if you choose to start over.',
  UNAVAILABLE: 'Browser storage is unavailable. Your chart is unchanged; try again in a browser that allows local storage.',
  QUOTA: 'Browser storage is full. Delete an unused profile or free browser storage and try again.',
  UNSUPPORTED_VERSION: 'These saved profiles were created by a newer app version and were left unchanged.',
  MIGRATION_REQUIRED: 'Saved profiles need a format update. Use the profile refresh action before changing them.',
  INVALID_IMPORT: 'The selected file is not a valid supported CoreAstroG3 profile export. Existing profiles were not changed.'
};

export const ChartProfileManager: React.FC<ChartProfileManagerProps> = ({
  currentBirthDetails,
  onRestoreBirthDetails,
  service: suppliedService
}) => {
  const service = useMemo(() => suppliedService ?? new ChartProfileService(), [suppliedService]);
  const [profiles, setProfiles] = useState<readonly ChartProfile[]>([]);
  const [label, setLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importStrategy, setImportStrategy] = useState<'SKIP_DUPLICATES' | 'RENAME_DUPLICATES'>('SKIP_DUPLICATES');
  const [editingProfile, setEditingProfile] = useState<ChartProfile | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deletingProfile, setDeletingProfile] = useState<ChartProfile | null>(null);
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

  const visibleProfiles = useMemo(() => profiles
    .filter(profile => profile.label.toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase()))
    .sort((left, right) => left.label.localeCompare(right.label)), [profiles, searchTerm]);

  const refresh = () => setRefreshKey(value => value + 1);

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

  const openRenameDialog = (profile: ChartProfile) => {
    setEditingProfile(profile);
    setEditLabel(profile.label);
    setErrorMessage('');
  };

  const handleConfirmRename = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProfile) return;
    const result = service.renameProfile(editingProfile.id, editLabel);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    setStatusMessage(`Renamed profile to "${result.value.label}".`);
    setErrorMessage('');
    setEditingProfile(null);
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

  const handleConfirmDelete = () => {
    if (!deletingProfile) return;
    const result = service.deleteProfile(deletingProfile.id);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    setStatusMessage(`Deleted "${deletingProfile.label}" from this browser/device.`);
    setErrorMessage('');
    setDeletingProfile(null);
    refresh();
  };

  const handleExport = () => {
    const result = service.exportProfiles();
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage('');
      return;
    }
    try {
      const blob = new Blob([result.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'coreastro-chart-profiles.json';
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Exported saved profiles to a JSON file. The file contains the birth details in those profiles; store it securely.');
      setErrorMessage('');
    } catch {
      setErrorMessage('The browser could not create the profile export file. Your saved profiles are unchanged.');
      setStatusMessage('');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const contents = await file.text();
      const result = service.importProfiles(contents, importStrategy);
      if (!result.ok) {
        setErrorMessage(ERROR_MESSAGES[result.error]);
        setStatusMessage('');
      } else {
        setStatusMessage(`Imported ${result.value.importedCount} profile(s); skipped ${result.value.skippedCount}; renamed ${result.value.renamedCount} duplicate(s).`);
        setErrorMessage('');
        refresh();
      }
    } catch {
      setErrorMessage(ERROR_MESSAGES.INVALID_IMPORT);
      setStatusMessage('');
    } finally {
      input.value = '';
    }
  };

  return (
    <section aria-labelledby="chart-profile-heading" className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
      <h2 id="chart-profile-heading" className="text-lg font-semibold">Saved chart profiles</h2>
      <p className="mt-1 text-sm text-slate-300">Saved on this browser/device only. These profiles are not backed up or synced.</p>
      <p className="mt-1 text-xs text-amber-200">Import/export files contain saved birth details (date, time, timezone and coordinates). Keep exported files private.</p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-col gap-1 text-sm">
          Profile name
          <input
            aria-label="Profile name"
            maxLength={80}
            value={label}
            onChange={event => setLabel(event.currentTarget.value)}
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
        <Button type="button" variant="outline" onClick={handleExport}>Export JSON</Button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-col gap-1 text-sm">
          Import duplicate handling
          <select
            aria-label="Import duplicate handling"
            value={importStrategy}
            onChange={event => setImportStrategy(event.target.value as typeof importStrategy)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          >
            <option value="SKIP_DUPLICATES">Skip duplicate IDs or names</option>
            <option value="RENAME_DUPLICATES">Rename duplicate IDs or names</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Import profile JSON
          <input
            aria-label="Import profile JSON"
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="max-w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs"
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="flex max-w-sm flex-col gap-1 text-sm">
          Search saved profiles
          <input
            aria-label="Search saved profiles"
            value={searchTerm}
            onChange={event => setSearchTerm(event.currentTarget.value)}
            placeholder="Filter by profile name"
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          />
        </label>
      </div>

      {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
      {statusMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{statusMessage}</p>}
      {visibleProfiles.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-700/70">
          {visibleProfiles.map(profile => (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>{profile.label}</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleRestore(profile)}>Restore</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => openRenameDialog(profile)}>Rename</Button>
                <Button type="button" size="sm" variant="danger" onClick={() => setDeletingProfile(profile)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : !errorMessage ? <p className="mt-3 text-sm text-slate-400">{profiles.length === 0 ? 'No saved profiles on this browser/device.' : 'No profiles match this search.'}</p> : null}

      {editingProfile && (
        <div role="dialog" aria-modal="true" aria-labelledby="rename-profile-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleConfirmRename} className="w-full max-w-md space-y-4 rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <h3 id="rename-profile-title" className="text-lg font-semibold">Rename saved profile</h3>
            <label className="flex flex-col gap-1 text-sm">
              New profile name
              <input autoFocus maxLength={80} value={editLabel} onChange={event => setEditLabel(event.currentTarget.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
              <Button type="submit" disabled={!editLabel.trim()}>Save name</Button>
            </div>
          </form>
        </div>
      )}

      {deletingProfile && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <h3 id="delete-profile-title" className="text-lg font-semibold">Delete saved profile?</h3>
            <p className="text-sm text-slate-300">Delete "{deletingProfile.label}" from this browser/device? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingProfile(null)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={handleConfirmDelete}>Delete profile</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
