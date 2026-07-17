<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="mt-8 mb-10 px-4 flex flex-col items-center text-center">
    <div class="flex justify-center w-full">
      <BotList class="max-w-xl w-full" />
    </div>
    <USeparator class="my-6 max-w-xl w-full" />
    <AppIcon class="my-4 sm:w-72 sm:h-72 w-56 h-56 opacity-95" />

    <h1 class="font-semibold tracking-tight text-2xl sm:text-4xl mb-3">
      {{ t('home.welcomePrefix') }}
      <AppText class="text-2xl! sm:text-4xl!" />
    </h1>
    <p class="text-muted max-w-xl">{{ t('home.controlHint') }}</p>
    <USeparator class="my-6 max-w-xl w-full" />
    <p class="mb-2 text-sm text-muted max-w-xl">
      {{ t('home.helpPrefix') }}
      <a
        class="text-primary underline underline-offset-2 cursor-pointer"
        href="https://www.freqtrade.io/en/latest/"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('home.documentation') }}
      </a>
      {{ t('home.helpSuffix') }}
    </p>
    <p class="mb-5 text-sm text-muted">{{ t('home.footerWish') }}</p>
  </div>
</template>
