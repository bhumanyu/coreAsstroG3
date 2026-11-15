import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registeredNamespaces } from './i18n';
import { resources } from './resources';
import { ENUM_LABEL_KEYS, type EnumLabelFamily } from './enumLabels';

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
  it('registers every namespace provided by the translation resources', () => {
    const registered = new Set<string>(registeredNamespaces);
    expect(Object.keys(resources.en).filter((namespace) => !registered.has(namespace))).toEqual([]);
    expect(registeredNamespaces).toContain('enums');
  });

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

  it('covers every typed enum-label registry key in both locales', () => {
    for (const family of Object.keys(ENUM_LABEL_KEYS) as EnumLabelFamily[]) {
      for (const key of Object.values(ENUM_LABEL_KEYS[family])) {
        expect(hasTranslationKey('en', 'enums', key), `en:enums:${key}`).toBe(true);
        expect(hasTranslationKey('hi', 'enums', key), `hi:enums:${key}`).toBe(true);
      }
    }
  });

  it('provides both locales for computed career and wealth translation key families', () => {
    const careerStatusKeys = [
      'ui.axes.available',
      'ui.axes.partial',
      'ui.axes.blocked',
      'ui.axes.insufficient',
      'ui.axes.notApplicable',
      'ui.axes.unavailableStatus'
    ];
    const professionStatusKeys = ['complete', 'partial', 'insufficient'].flatMap((status) => [
      `ui.profession.${status}Label`,
      `ui.profession.${status}Explanation`
    ]);
    const professionMissingKeys = [
      'ui.profession.noResolvedMechanismsExplanation',
      'ui.profession.missingInputs',
      'ui.profession.missingInputsAria',
      'ui.profession.missingCareer10H',
      'ui.profession.missingCareer10L',
      'ui.profession.missingD10',
      'ui.profession.missingDomainEvidence'
    ];
    const careerJourneyStateKeys = [
      'available',
      'partial',
      'unavailable',
      'absent',
      'notAssessed',
      'executedNoCandidates',
      'qualificationBlocked'
    ].flatMap((state) => [
      `ui.journey.${state}`
    ]);
    const dashaLevelKeys = ['MD', 'AD', 'PD'].map((level) => `ui.dasha.levels.${level}`);
    const careerDynamicKeys = [
      ...careerStatusKeys,
      ...professionStatusKeys,
      ...professionMissingKeys,
      'ui.hero.notices',
      'ui.hero.noticePlural',
      'ui.axes.partialConditionAssessment',
      'ui.axes.expressionAnalysisUnavailable',
      'ui.axes.provenanceIncomplete',
      'ui.axes.nonActivationOccurrences',
      'ui.expression.executedNoCandidatesTitle',
      'ui.expression.executedNoCandidatesDescription',
      'ui.expression.executedNoCandidatesMessage',
      'ui.expression.noMechanismCandidates',
      'ui.expression.noPatternsDiscovered',
      'ui.expression.qualificationResultsMissing',
      'ui.expression.noPatternsQualified',
      'ui.expression.participantRoleAssignmentFailed',
      'ui.expression.participantRoleAssignmentSkipped',
      'ui.expression.missingNetworkEvidence',
      'ui.expression.incompleteNetworkEvidence',
      'ui.expression.mechanismsNotResolved',
      'ui.expression.noMechanismRuleMatched',
      'ui.dasha.partialAssessment',
      ...careerJourneyStateKeys,
      ...dashaLevelKeys
    ];
    const wealthJourneyStateKeys = ['available', 'partial', 'unavailable'].map((state) => `ui.journey.${state}`);
    const wealthDynamicKeys = [
      ...wealthJourneyStateKeys,
      ...dashaLevelKeys
    ];

    for (const key of careerDynamicKeys) {
      expect(hasTranslationKey('en', 'career', key), `en:career:${key}`).toBe(true);
      expect(hasTranslationKey('hi', 'career', key), `hi:career:${key}`).toBe(true);
    }
    for (const key of wealthDynamicKeys) {
      expect(hasTranslationKey('en', 'wealth', key), `en:wealth:${key}`).toBe(true);
      expect(hasTranslationKey('hi', 'wealth', key), `hi:wealth:${key}`).toBe(true);
    }
  });
});
