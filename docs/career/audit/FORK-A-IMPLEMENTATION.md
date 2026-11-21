# Fork A Implementation Verification

## Node

- Ephemeris files are resolved through
  `createRequire(import.meta.url).resolve('@kuntay/swisseph-data/<file>')`.
- Resolution was verified while the process working directory was
  `C:\`, which resolves the package manifest and `semo_18.se1` independently
  of repository or process working directory.
- The Node loader reads all five required files, validates file size and
  SHA-256 against `@kuntay/swisseph-data@0.2.2/manifest.json`, and throws for
  missing, unreadable, empty, wrong-size, or wrong-content files.
- The Node path never falls back to Moshier or a network fetch.

## Vite production browser

- `npm run build` produces `dist/ephe/manifest.json` and all five required
  `.se1`/text assets in the same origin.
- `npm run preview -- --host 127.0.0.1 --port 4173` returned HTTP 200 for
  `/ephe/manifest.json` and `/ephe/semo_18.se1`.
- The browser loader fetches only same-origin `/ephe/*` assets, verifies the
  manifest version and Swiss Ephemeris core version, verifies each byte length,
  and verifies SHA-256 using Web Crypto.
- There is no CDN fallback or external network dependency.

## Capacitor Android

- `npx cap sync android` copied `dist/ephe/*` into
  `android/app/src/main/assets/public/ephe/`.
- `android/gradlew assembleDebug` completed successfully.
- The APK bundle contains the same-origin WebView asset set, so cold start does
  not require ephemeris network access.
- No Android emulator/device was available in the verification environment,
  so physical airplane-mode launch was not executed; the asset packaging and
  Gradle bundle proof are recorded.

## Missing-file behavior

Any missing manifest entry, missing asset, unreadable asset, empty asset,
wrong length, or wrong SHA-256 throws a clear adapter error. The adapter does
not silently fall back to Moshier and does not fetch a remote ephemeris.

## Asset integrity

The package and public manifests are pinned to
`@kuntay/swisseph-data@0.2.2`, Swiss Ephemeris core `2.10.03`,
DE441-derived data, coverage 1800-2399 CE.

| File | Bytes | SHA-256 |
|---|---:|---|
| `sepl_18.se1` | 484061 | `ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66` |
| `semo_18.se1` | 1304771 | `1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7` |
| `seas_18.se1` | 223004 | `a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2` |
| `sefstars.txt` | 136618 | `18b0dcafbe5b7240773daba2c038a325f5b3fc4163f61e0a7f4e92abd4f517c6` |
| `seorbel.txt` | 6063 | `97b454ff78f4f4716b5cc987a93ca8f33e44ef4b524a165a155a8a4885fd2e18` |
