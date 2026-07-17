import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zhCN from './locales/zh-CN';
import type { AppLocale } from './localeResolve';

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'zh-CN'];

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
  },
});

export type { AppLocale, LocalePreference } from './localeResolve';
export { detectBrowserLocale, resolveLocale } from './localeResolve';
