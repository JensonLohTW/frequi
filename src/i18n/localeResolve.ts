export type AppLocale = 'en' | 'zh-CN';
export type LocalePreference = 'auto' | AppLocale;

export function detectBrowserLocale(lang: string | undefined | null): AppLocale {
  if (!lang) return 'en';
  const normalized = lang.toLowerCase().replace('_', '-');
  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }
  return 'en';
}

export function resolveLocale(
  preference: LocalePreference,
  browserLang?: string | null,
): AppLocale {
  if (preference === 'auto') {
    return detectBrowserLocale(browserLang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'));
  }
  return preference;
}
