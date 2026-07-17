<script setup lang="ts">
const settingsStore = useSettingsStore();
const colorStore = useColorStore();
const { applyLocale } = useLocale();
onMounted(() => {
  setTimezone(settingsStore.timezone);
  colorStore.updateProfitLossColor();
  applyLocale();
});
watch(
  () => settingsStore.timezone,
  (tz) => {
    console.log('timezone changed', tz);
    setTimezone(tz);
  },
);
</script>

<template>
  <UApp>
    <div id="app" class="flex flex-col h-dvh text-left" :style="colorStore.cssVars">
      <NavBar />
      <BodyLayout class="grow overflow-auto" />
      <NavFooter />
    </div>
  </UApp>
</template>
