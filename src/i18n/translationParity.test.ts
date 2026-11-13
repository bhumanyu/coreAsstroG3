import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resources } from './resources';

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      return flattenKeys(child as Record<string, unknown>, path);
    }
    return [path];
  }).sort();
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.(ts|tsx)$/.test(entry.name)
      ? [path]
      : [];
  });
}

function hasTranslationKey(language: 'en' | 'hi', namespace: string, key: string): boolean {
  let value: unknown = (resources[language] as Record<string, unknown>)[namespace];
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object' || !(segment in value)) return false;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string';
}

describe('English/Hindi localization resource parity', () => {
  it.each(Object.keys(resources.en) as Array<keyof typeof resources.en>)('has matching non-empty %s keys', (namespace) => {
    const en = resources.en[namespace] as Record<string, unknown>;
    const hi = resources.hi[namespace] as Record<string, unknown>;
    expect(flattenKeys(hi)).toEqual(flattenKeys(en));

    const assertNonEmptyStrings = (value: Record<string, unknown>) => {
      for (const child of Object.values(value)) {
        if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
          assertNonEmptyStrings(child as Record<string, unknown>);
        } else if (typeof child === 'string') {
          expect(child).not.toBe('');
        }
      }
    };
    assertNonEmptyStrings(hi);
  });

  it('resolves every statically referenced translation key in both languages', () => {
    const sourceDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
    const missing: string[] = [];

    for (const file of listSourceFiles(sourceDirectory)) {
      const source = readFileSync(file, 'utf8');
      const namespacesByTranslator = new Map<string, string>();
      const translationHooks = /\{([^}]+)\}\s*=\s*useTranslation\(\s*['"]([^'"]+)['"]\s*\)/gs;
      for (const match of source.matchAll(translationHooks)) {
        const namespace = match[2];
        for (const binding of match[1].split(',')) {
          const [original, alias] = binding.trim().split(/\s*:\s*/);
          if (original === 't') namespacesByTranslator.set(alias ?? original, namespace);
        }
      }

      for (const [translator, defaultNamespace] of namespacesByTranslator) {
        const calls = new RegExp(`\\b${translator}\\(\\s*['"]([^'"]+)['"]`, 'g');
        for (const match of source.matchAll(calls)) {
          const [explicitNamespace, key] = match[1].includes(':')
            ? match[1].split(/:(.*)/s).filter(Boolean)
            : [defaultNamespace, match[1]];
          if (!key || !hasTranslationKey('en', explicitNamespace, key) || !hasTranslationKey('hi', explicitNamespace, key)) {
            missing.push(`${relative(sourceDirectory, file)}: ${match[1]}`);
          }
        }
      }

      const singletonCalls = /\bi18n\.t\(\s*['"]([^'"]+)['"]/g;
      for (const match of source.matchAll(singletonCalls)) {
        const [namespace, key] = match[1].split(/:(.*)/s).filter(Boolean);
        if (!key || !hasTranslationKey('en', namespace, key) || !hasTranslationKey('hi', namespace, key)) {
          missing.push(`${relative(sourceDirectory, file)}: ${match[1]}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
