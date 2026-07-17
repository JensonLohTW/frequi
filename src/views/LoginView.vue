<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="max-w-xl mx-auto p-4 my-5">
    <DraggableContainer :header="t('auth.pageHeader')" class="px-4 py-2">
      <BotLogin />
    </DraggableContainer>
  </div>
</template>
