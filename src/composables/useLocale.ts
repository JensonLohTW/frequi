import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AppLocale, LocalePreference } from '@/i18n';
import { resolveLocale } from '@/i18n';

export function useLocale() {
  const settingsStore = useSettingsStore();
  const { locale } = useI18n();

  const localePreference = computed(() => settingsStore.localePreference);

  const resolvedLocale = computed<AppLocale>(() =>
    resolveLocale(settingsStore.localePreference, navigator.language),
  );

  function applyLocale() {
    const next = resolveLocale(settingsStore.localePreference, navigator.language);
    locale.value = next;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }

  function setLocalePreference(pref: LocalePreference) {
    settingsStore.localePreference = pref;
    applyLocale();
  }

  return {
    localePreference,
    resolvedLocale,
    setLocalePreference,
    applyLocale,
  };
}
