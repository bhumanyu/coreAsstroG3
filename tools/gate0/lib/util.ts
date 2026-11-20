/**
 * Shared utilities for the Gate-0 offline capture harness.
 *
 * ISOLATION: everything under tools/gate0/ is offline fixture-generation
 * tooling. Nothing in src/, workers/, scripts/ or any other runtime path may
 * import from here (enforced by check-import-boundary.mjs).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GATE0_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Repository root: walk up from this file until the repo package.json is found. */
export function repoRoot(): string {
  let dir = GATE0_ROOT;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string };
      if (pkg.name === 'coreastro-gpt') return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('repoRoot: could not locate repository root package.json');
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/** Deterministic JSON serialization (sorted object keys) for stable hashing. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function gitCommitSha(root: string): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

/** Normalize a longitude to [0, 360). */
export function normDeg(deg: number): number {
  const v = deg % 360;
  return v < 0 ? v + 360 : v === 360 ? 0 : v;
}

/**
 * Convert a UTC instant + IANA timezone into a local wall-clock representation
 * `YYYY-MM-DDTHH:mm:ss±HH:MM` using the platform ICU data. Throws when the
 * zone is unknown — captures must never silently fall back.
 */
export function localRepresentationFor(utcIso: string, ianaTimeZone: string): string {
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) throw new Error(`bad utcIso: ${utcIso}`);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  // Determine the zone offset at this instant by comparing local-as-UTC to UTC.
  const asUtc = Date.UTC(
    Number(get('year')), Number(get('month')) - 1, Number(get('day')),
    Number(get('hour')), Number(get('minute')), Number(get('second'))
  );
  const offsetSeconds = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 1000);
  const sign = offsetSeconds < 0 ? '-' : '+';
  const abs = Math.abs(offsetSeconds);
  const oh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const om = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  const os = abs % 60;
  const offsetText = os === 0 ? `${oh}:${om}` : `${oh}:${om}:${String(os).padStart(2, '0')}`;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${sign}${offsetText}`;
}

/** Verify that a claimed local representation is consistent with utcInstant+zone. */
export function assertInstantConsistency(caseDef: {
  utcInstant: string;
  localRepresentation: string;
  ianaTimeZone: string;
}): void {
  const computed = localRepresentationFor(caseDef.utcInstant, caseDef.ianaTimeZone);
  if (computed !== caseDef.localRepresentation) {
    throw new Error(
      `instant inconsistency for ${caseDef.utcInstant} @ ${caseDef.ianaTimeZone}: ` +
      `declared local '${caseDef.localRepresentation}' != computed '${computed}'`
    );
  }
}
