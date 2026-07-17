<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const botStore = useBotStore();
const { t } = useI18n();
</script>

<template>
  <footer class="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-default">
    <!-- Only visible on xs (phone) viewport! -->
    <div class="flex gap-1 justify-between px-2 py-1">
      <UButton
        v-if="!botStore.canRunBacktest"
        variant="ghost"
        color="neutral"
        class="flex flex-col gap-0.5 min-h-11"
        to="/open_trades"
        :label="t('nav.openTrades')"
        icon="mdi:folder-open"
      />
      <UButton
        v-if="!botStore.canRunBacktest"
        variant="ghost"
        color="neutral"
        class="flex flex-col gap-0.5 min-h-11"
        to="/trade_history"
        :label="t('nav.tradeHistory')"
        icon="mdi:folder-lock"
      />
      <UButton
        v-if="!botStore.canRunBacktest"
        variant="ghost"
        color="neutral"
        class="flex flex-col gap-0.5 min-h-11"
        to="/pairlist"
        :label="t('nav.pairlist')"
        icon="mdi:format-list-group"
      />
      <UButton
        v-if="!botStore.canRunBacktest"
        variant="ghost"
        color="neutral"
        class="flex flex-col gap-0.5 min-h-11"
        to="/balance"
        :label="t('nav.balance')"
        icon="mdi:bank"
      />
      <UButton
        v-if="!botStore.canRunBacktest"
        variant="ghost"
        color="neutral"
        class="flex flex-col gap-0.5 min-h-11"
        to="/dashboard"
        :label="t('nav.dashboard')"
        icon="mdi:view-dashboard-outline"
      />
    </div>
  </footer>
</template>
