<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FtWsMessageTypes } from '@/types/wsMessageTypes';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const colorStore = useColorStore();
const layoutStore = useLayoutStore();

const timezoneOptions = ['UTC', Intl.DateTimeFormat().resolvedOptions().timeZone];
const openTradesOptions = computed(() => [
  { value: OpenTradeVizOptions.showPill, text: t('settings.openTradesPill') },
  { value: OpenTradeVizOptions.asTitle, text: t('settings.openTradesTitle') },
  { value: OpenTradeVizOptions.noOpenTrades, text: t('settings.openTradesHide') },
]);

const colorPreferenceOptions = computed(() => [
  { value: ColorPreferences.GREEN_UP, text: t('settings.colorGreenUp') },
  { value: ColorPreferences.RED_UP, text: t('settings.colorRedUp') },
]);

const chartScaleOptions = computed(() => [
  { label: t('settings.chartScaleLeft'), value: 'left' },
  { label: t('settings.chartScaleRight'), value: 'right' },
]);

const resetDynamicLayout = () => {
  layoutStore.resetTradingLayout();
  layoutStore.resetDashboardLayout();
  showAlert(t('settings.layoutsResetAlert'));
};
</script>

<template>
  <UCard class="mx-auto mt-4 mb-8 p-4 max-w-4xl text-left">
    <template #header>
      <span class="text-2xl font-semibold tracking-tight">{{ t('settings.title') }}</span>
    </template>
    <div class="flex flex-col gap-4 text-start dark:text-neutral-300">
      <p class="text-left">
        {{ t('common.uiVersion', { version: settingsStore.uiVersion }) }}
      </p>

      <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h4 class="text-xl font-semibold">{{ t('settings.sectionUi') }}</h4>

        <div class="space-y-1">
          <label class="block text-sm font-medium">{{ t('settings.languageLabel') }}</label>
          <LocaleSelect show-text class="w-full max-w-xs" />
          <small class="text-sm text-neutral-600 dark:text-neutral-400">{{
            t('settings.languageHint')
          }}</small>
        </div>
        <USeparator />

        <BaseCheckbox v-model="layoutStore.layoutLocked" class="space-y-1">
          {{ t('settings.lockLayouts') }}
          <template #hint>
            {{ t('settings.lockLayoutsHint') }}
          </template>
        </BaseCheckbox>

        <div class="flex flex-row items-center gap-2 space-y-2">
          <UButton color="neutral" size="md" class="mb-0" @click="resetDynamicLayout">{{
            t('settings.resetLayout')
          }}</UButton>
          <small class="text-sm block text-neutral-600 dark:text-neutral-400">{{
            t('settings.resetLayoutHint')
          }}</small>
        </div>

        <USeparator />

        <div class="space-y-1">
          <label class="block text-sm">{{ t('settings.openTradesHeader') }}</label>
          <USelect
            v-model="settingsStore.openTradesInTitle"
            :items="openTradesOptions"
            label-key="text"
            value-key="value"
            class="w-full"
          />
          <small class="text-sm text-neutral-600 dark:text-neutral-400">{{
            t('settings.openTradesHeaderHint')
          }}</small>
        </div>

        <div class="space-y-1">
          <label class="block text-sm">{{ t('settings.timezone') }}</label>
          <USelect v-model="settingsStore.timezone" :items="timezoneOptions" class="w-full" />
          <small class="text-sm text-neutral-600 dark:text-neutral-400">{{
            t('settings.timezoneHint')
          }}</small>
        </div>

        <BaseCheckbox v-model="settingsStore.backgroundSync" class="space-y-1">
          {{ t('settings.backgroundSync') }}
          <template #hint>{{ t('settings.backgroundSyncHint') }}</template>
        </BaseCheckbox>

        <BaseCheckbox v-model="settingsStore.confirmDialog" class="space-y-1">
          {{ t('settings.confirmDialog') }}
          <template #hint>{{ t('settings.confirmDialogHint') }}</template>
        </BaseCheckbox>

        <BaseCheckbox v-model="settingsStore.multiPaneButtonsShowText" class="space-y-1">
          {{ t('settings.multiPaneButtons') }}
          <template #hint>{{ t('settings.multiPaneButtonsHint') }}</template>
        </BaseCheckbox>
      </div>

      <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h4 class="text-lg font-semibold">{{ t('settings.sectionChart') }}</h4>

        <div class="space-y-1">
          <label class="block text-sm">{{ t('settings.chartScaleSide') }}</label>
          <URadioGroup
            v-model="settingsStore.chartLabelSide"
            :items="chartScaleOptions"
            orientation="horizontal"
          />
          <small class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t('settings.chartScaleHint') }}
          </small>
        </div>

        <BaseCheckbox v-model="settingsStore.useHeikinAshiCandles" class="space-y-1">
          {{ t('settings.heikinAshi') }}
          <template #hint>{{ t('settings.heikinAshiHint') }}</template>
        </BaseCheckbox>

        <BaseCheckbox v-model="settingsStore.useReducedPairCalls" class="space-y-1">
          {{ t('settings.reducedPairCalls') }}
          <template #hint>{{ t('settings.reducedPairCallsHint') }}</template>
        </BaseCheckbox>

        <div>
          <p>{{ t('settings.defaultCandles') }}</p>
          <div class="flex flex-row gap-5 w-full items-center">
            <USlider
              v-model="settingsStore.chartDefaultCandleCount"
              class="flex-1"
              :step="50"
              :min="100"
              :max="2000"
            />
            <UInputNumber
              v-model="settingsStore.chartDefaultCandleCount"
              :step="50"
              :min="100"
              :max="2000"
              size="sm"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="block">{{ t('settings.candleColorPreference') }}</label>
          <div class="flex flex-row gap-5 items-center">
            <URadioGroup
              v-model="colorStore.colorPreference"
              :items="colorPreferenceOptions"
              label-key="text"
              value-key="value"
              orientation="horizontal"
            >
              <template #label="{ item }">
                <div class="flex items-center">
                  <span class="mr-2">{{ item.text }}</span>
                  <UIcon
                    name="mdi:arrow-up-thin"
                    :color="
                      item.value === ColorPreferences.GREEN_UP
                        ? colorStore.colorProfit
                        : colorStore.colorLoss
                    "
                    class="-ml-2 size-5"
                  />
                  <UIcon
                    name="mdi:arrow-down-thin"
                    :color="
                      item.value === ColorPreferences.GREEN_UP
                        ? colorStore.colorLoss
                        : colorStore.colorProfit
                    "
                    class="-ml-2 size-5"
                  />
                </div>
              </template>
            </URadioGroup>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h4 class="text-lg font-semibold">{{ t('settings.sectionNotifications') }}</h4>
        <div class="space-y-2">
          <BaseCheckbox v-model="settingsStore.notifications[FtWsMessageTypes.entryFill]">
            {{ t('settings.notifyEntry') }}
          </BaseCheckbox>
          <BaseCheckbox v-model="settingsStore.notifications[FtWsMessageTypes.exitFill]">
            {{ t('settings.notifyExit') }}
          </BaseCheckbox>
          <BaseCheckbox v-model="settingsStore.notifications[FtWsMessageTypes.entryCancel]">
            {{ t('settings.notifyEntryCancel') }}
          </BaseCheckbox>
          <BaseCheckbox v-model="settingsStore.notifications[FtWsMessageTypes.exitCancel]">
            {{ t('settings.notifyExitCancel') }}
          </BaseCheckbox>
        </div>
      </div>

      <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h4 class="text-lg font-semibold">{{ t('settings.sectionBacktesting') }}</h4>
        <div>
          <label for="backtestMetrics" class="block">{{ t('settings.backtestMetrics') }}</label>
          <USelectMenu
            multiple
            id="backtestMetrics"
            v-model="settingsStore.backtestAdditionalMetrics"
            :items="availableBacktestMetrics"
            label-key="header"
            value-key="field"
            class="w-full"
            display="chip"
          />
          <small class="text-sm text-neutral-600 dark:text-neutral-400">{{
            t('settings.backtestMetricsHint')
          }}</small>
        </div>
      </div>
    </div>
  </UCard>
</template>
