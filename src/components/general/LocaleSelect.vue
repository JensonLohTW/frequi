<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { LocalePreference } from '@/i18n';

withDefaults(defineProps<{ showText?: boolean }>(), { showText: false });

const { t } = useI18n();
const { localePreference, setLocalePreference } = useLocale();

const items = computed(() => [
  { label: t('settings.languageAuto'), value: 'auto' as LocalePreference },
  { label: t('settings.languageEn'), value: 'en' as LocalePreference },
  { label: t('settings.languageZhCN'), value: 'zh-CN' as LocalePreference },
]);
</script>

<template>
  <div class="flex items-center gap-2">
    <span v-if="showText" class="text-sm text-muted">{{ t('nav.language') }}</span>
    <USelect
      :model-value="localePreference"
      :items="items"
      value-key="value"
      label-key="label"
      class="min-w-28"
      size="sm"
      :aria-label="t('nav.language')"
      @update:model-value="(v: LocalePreference) => setLocalePreference(v)"
    />
  </div>
</template>
