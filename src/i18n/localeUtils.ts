import { LANGUAGE_LOCALES, type AppLanguage } from './config';

export function getLocale(language: AppLanguage): string {
  return LANGUAGE_LOCALES[language];
}

export function formatNumber(
  value: number,
  language: AppLanguage,
  options?: Intl.NumberFormatOptions
): string {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(getLocale(language), {
    ...options,
    numberingSystem: 'latn'
  }).format(value);
}

export function formatDate(value: Date | string | number, language: AppLanguage): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(getLocale(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn'
  }).format(date);
}

export function formatCurrencyINR(value: number, language: AppLanguage): string {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'INR',
    numberingSystem: 'latn',
    maximumFractionDigits: 2
  }).format(value);
}
