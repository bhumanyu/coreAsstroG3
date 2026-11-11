import React, { useEffect, useMemo, useState } from 'react';
import type { BirthDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { ChartProfileService, type ChartProfileOperationError } from './chartProfileService';
import type { ChartProfile } from './chartProfileSchema';
import { useTranslation } from 'react-i18next';

export interface ChartProfileManagerProps {
  readonly currentBirthDetails: BirthDetails;
  readonly onRestoreBirthDetails: (birthDetails: BirthDetails) => void;
  readonly service?: ChartProfileService;
}

const ERROR_MESSAGES: Record<ChartProfileOperationError, string> = {
  DUPLICATE_ID: 'errors.DUPLICATE_ID',
  LIMIT_REACHED: 'errors.LIMIT_REACHED',
  INVALID_LABEL: 'errors.INVALID_LABEL',
  NOT_FOUND: 'errors.NOT_FOUND',
  INVALID_BIRTH_DETAILS: 'errors.INVALID_BIRTH_DETAILS',
  CORRUPT: 'errors.CORRUPT',
  UNAVAILABLE: 'errors.UNAVAILABLE',
  QUOTA: 'errors.QUOTA',
  UNSUPPORTED_VERSION: 'errors.UNSUPPORTED_VERSION',
  MIGRATION_REQUIRED: 'errors.MIGRATION_REQUIRED',
  INVALID_IMPORT: 'errors.INVALID_IMPORT'
};

export const ChartProfileManager: React.FC<ChartProfileManagerProps> = ({
  currentBirthDetails,
  onRestoreBirthDetails,
  service: suppliedService
}) => {
  const { t } = useTranslation('profiles');
  const service = useMemo(() => suppliedService ?? new ChartProfileService(), [suppliedService]);
  const [profiles, setProfiles] = useState<readonly ChartProfile[]>([]);
  const [label, setLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importStrategy, setImportStrategy] = useState<'SKIP_DUPLICATES' | 'RENAME_DUPLICATES'>('SKIP_DUPLICATES');
  const [editingProfile, setEditingProfile] = useState<ChartProfile | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deletingProfile, setDeletingProfile] = useState<ChartProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ key: string; values?: Record<string, string | number> } | null>(null);
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
      setStatusMessage(null);
      return;
    }
    setLabel('');
    setStatusMessage({ key: 'messages.saved', values: { name: result.value.label } });
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
      setStatusMessage(null);
      return;
    }
    setStatusMessage({ key: 'messages.renamed', values: { name: result.value.label } });
    setErrorMessage('');
    setEditingProfile(null);
    refresh();
  };

  const handleRestore = (profile: ChartProfile) => {
    const result = service.restoreProfile(profile.id);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage(null);
      return;
    }
    onRestoreBirthDetails(result.value);
    setStatusMessage({ key: 'messages.restored', values: { name: profile.label } });
    setErrorMessage('');
  };

  const handleConfirmDelete = () => {
    if (!deletingProfile) return;
    const result = service.deleteProfile(deletingProfile.id);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage(null);
      return;
    }
    setStatusMessage({ key: 'messages.deleted', values: { name: deletingProfile.label } });
    setErrorMessage('');
    setDeletingProfile(null);
    refresh();
  };

  const handleExport = () => {
    const result = service.exportProfiles();
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error]);
      setStatusMessage(null);
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
      setStatusMessage({ key: 'messages.exported' });
      setErrorMessage('');
    } catch {
      setErrorMessage('errors.exportFileFailed');
      setStatusMessage(null);
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
        setStatusMessage(null);
      } else {
        setStatusMessage({
          key: 'messages.imported',
          values: {
            importedCount: result.value.importedCount,
            skippedCount: result.value.skippedCount,
            renamedCount: result.value.renamedCount
          }
        });
        setErrorMessage('');
        refresh();
      }
    } catch {
      setErrorMessage(ERROR_MESSAGES.INVALID_IMPORT);
      setStatusMessage(null);
    } finally {
      input.value = '';
    }
  };

  return (
    <section aria-labelledby="chart-profile-heading" className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
      <h2 id="chart-profile-heading" className="text-lg font-semibold">{t('savedTitle')}</h2>
      <p className="mt-1 text-sm text-slate-300">{t('privacy')}</p>
      <p className="mt-1 text-xs text-amber-200">{t('privacyExport')}</p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-col gap-1 text-sm">
          {t('name')}
          <input
            aria-label={t('name')}
            maxLength={80}
            value={label}
            onChange={event => setLabel(event.currentTarget.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          />
        </label>
        <Button type="button" onClick={handleSave} disabled={!label.trim()}>{t('saveCurrent')}</Button>
        <Button type="button" variant="outline" onClick={() => {
          const result = service.migrateProfileStore();
          if (result.ok) {
            setProfiles(result.value);
            setErrorMessage('');
            setStatusMessage({ key: 'messages.refreshed' });
          } else {
            setErrorMessage(ERROR_MESSAGES[result.error]);
            setStatusMessage(null);
          }
        }}>{t('refresh')}</Button>
        <Button type="button" variant="outline" onClick={handleExport}>{t('export')}</Button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-col gap-1 text-sm">
          {t('duplicateHandling')}
          <select
            aria-label={t('duplicateHandling')}
            value={importStrategy}
            onChange={event => setImportStrategy(event.target.value as typeof importStrategy)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          >
            <option value="SKIP_DUPLICATES">{t('skipDuplicates')}</option>
            <option value="RENAME_DUPLICATES">{t('renameDuplicates')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('importJson')}
          <input
            aria-label={t('importJson')}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="max-w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs"
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="flex max-w-sm flex-col gap-1 text-sm">
          {t('search')}
          <input
            aria-label={t('search')}
            value={searchTerm}
            onChange={event => setSearchTerm(event.currentTarget.value)}
            placeholder={t('filterPlaceholder')}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2"
          />
        </label>
      </div>

      {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{t(errorMessage)}</p>}
      {statusMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{t(statusMessage.key, statusMessage.values)}</p>}
      {visibleProfiles.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-700/70">
          {visibleProfiles.map(profile => (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>{profile.label}</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleRestore(profile)}>{t('restore')}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => openRenameDialog(profile)}>{t('rename')}</Button>
                <Button type="button" size="sm" variant="danger" onClick={() => setDeletingProfile(profile)}>{t('delete')}</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : !errorMessage ? <p className="mt-3 text-sm text-slate-400">{t(profiles.length === 0 ? 'noProfiles' : 'noMatches')}</p> : null}

      {editingProfile && (
        <div role="dialog" aria-modal="true" aria-labelledby="rename-profile-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <form onSubmit={handleConfirmRename} className="w-full max-w-md space-y-4 rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <h3 id="rename-profile-title" className="text-lg font-semibold">{t('renameTitle')}</h3>
            <label className="flex flex-col gap-1 text-sm">
              {t('newName')}
              <input autoFocus maxLength={80} value={editLabel} onChange={event => setEditLabel(event.currentTarget.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2" />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProfile(null)}>{t('cancel', { ns: 'common' })}</Button>
              <Button type="submit" disabled={!editLabel.trim()}>{t('saveName')}</Button>
            </div>
          </form>
        </div>
      )}

      {deletingProfile && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <h3 id="delete-profile-title" className="text-lg font-semibold">{t('deleteTitle')}</h3>
            <p className="text-sm text-slate-300">{t('deleteConfirmation', { name: deletingProfile.label })}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingProfile(null)}>{t('cancel', { ns: 'common' })}</Button>
              <Button type="button" variant="danger" onClick={handleConfirmDelete}>{t('deleteProfile')}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
