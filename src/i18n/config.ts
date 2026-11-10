export const DEFAULT_LANGUAGE = 'en' as const;
export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'coreastro.language';
export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN'
};

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'en' || value === 'hi';
}
