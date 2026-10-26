# Local chart profiles

## Scope and storage

Chart profiles are stored only in this browser/device using `localStorage` under
`coreastro.chartProfiles`. The version 1 envelope stores a profile identifier,
user-provided label, creation/update timestamps, and a copy of canonical
`BirthDetails`. It never stores `ProductAnalysis`, report output, or derived
astrology. The app does not upload, sync, or back up profiles.

Browser storage is available to scripts executing on this origin and may be
removed by the user, browser settings, private browsing behavior, or storage
pressure. Do not use this feature on a shared device for inputs the user does
not want persisted.

## Validation and recovery

Every saved/restored input set is checked by `validateBirthDetails`; restore
passes a defensive copy through the existing AppShell birth-details state seam,
which triggers the normal analysis lifecycle. Profile labels are trimmed and
limited to 80 characters, with at most 50 profiles.

Malformed data is reported as corrupt and left untouched. Storage access
failures are reported as unavailable; quota failures are reported separately.
Writes fail softly and do not report success when persistence fails. An
unrecognized future schema version is never parsed as version 1 or overwritten
with an empty store. The recognized version 0 migration is explicit and only
accepts its documented legacy `birth` field.

Deleting a profile removes it from this app's local profile store. Deleting all
profiles is supported by the service. Neither operation can promise forensic
erasure from browser-managed backups, snapshots, or storage media.
