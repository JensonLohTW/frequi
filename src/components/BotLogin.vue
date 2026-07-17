<script setup lang="ts">
import type { AuthPayload, AuthStorageWithBotId } from '@/types';

import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const props = withDefaults(
  defineProps<{
    inModal?: boolean;
    existingAuth?: AuthStorageWithBotId;
  }>(),
  {
    inModal: false,
    existingAuth: undefined,
  },
);
const emit = defineEmits<{ loginResult: [value: boolean] }>();

const defaultURL = window.location.origin || 'http://localhost:3000';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const botStore = useBotStore();

const nameState = ref<boolean>();
const pwdState = ref<boolean>();
const urlState = ref<boolean>();
const errorMessage = ref<string>('');
const errorMessageCORS = ref<boolean>(false);
const formRef = ref<HTMLFormElement>();
const botEdit = ref<boolean>(false);
const auth = ref<AuthPayload>({
  botName: '',
  url: defaultURL,
  username: '',
  password: '',
});

function emitLoginResult(value: boolean) {
  emit('loginResult', value);
}

const urlDuplicate = computed<boolean>(() => {
  const bots = Object.values(botStore.availableBots).find((bot) => bot.botUrl === auth.value.url);
  return !botEdit.value && bots !== undefined;
});

function checkFormValidity() {
  const valid = formRef.value?.checkValidity();
  nameState.value = valid || auth.value.username !== '';
  pwdState.value = valid || auth.value.password !== '';
  urlState.value = valid || auth.value.url !== '';
  return valid;
}

function resetLogin() {
  auth.value.botName = '';
  auth.value.url = defaultURL;
  auth.value.username = '';
  auth.value.password = '';
  nameState.value = undefined;
  pwdState.value = undefined;
  urlState.value = undefined;
  errorMessage.value = '';
  botEdit.value = false;
}

function handleReset(evt) {
  evt.preventDefault();
  resetLogin();
}

async function handleSubmit() {
  // Exit when the form isn't valid
  if (!checkFormValidity()) {
    return;
  }
  errorMessage.value = '';
  // Push the name to submitted names
  try {
    const botId =
      botEdit.value && props.existingAuth ? props.existingAuth.botId : botStore.nextBotId;
    const { login } = useLoginInfo(botId);
    await login(auth.value);
    if (botEdit.value) {
      // Bot editing ...
      const thisBot = botStore.botStores[botId];
      if (thisBot) {
        thisBot.isBotLoggedIn = true;
        thisBot.isBotOnline = true;
      }
      // botStore.allRefreshFull();
      emitLoginResult(true);
    } else {
      // Add new bot
      const sortId = Object.keys(botStore.availableBots).length + 1;
      botStore.addBot({
        botName: auth.value.botName,
        botId,
        botUrl: auth.value.url,
        sortId: sortId,
      });
      // switch to newly added bot
      botStore.selectBot(botId);
      emitLoginResult(true);
      botStore.allRefreshFull();
    }

    if (props.inModal === false) {
      if (typeof route?.query.redirect === 'string') {
        const resolved = router.resolve({ path: route.query.redirect });
        if (resolved.name === '404') {
          router.push('/');
        } else {
          router.push(resolved.path);
        }
      } else {
        router.push('/');
      }
    }
  } catch (error) {
    errorMessageCORS.value = false;
    // this.nameState = false;
    console.error(error);
    if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
      nameState.value = false;
      pwdState.value = false;
      errorMessage.value = 'Connected to bot, however Login failed, Username or Password wrong.';
    } else {
      urlState.value = false;
      errorMessage.value = `Please verify that the bot is running, the Bot API is enabled and the URL is reachable.
You can verify this by navigating to ${auth.value.url}/api/v1/ping to make sure the bot API is reachable`;
      if (auth.value.url !== window.location.origin) {
        errorMessageCORS.value = true;
      }
    }
    console.error(errorMessage.value);
    emitLoginResult(false);
  }
}

function handleOk(evt) {
  evt.preventDefault();
  handleSubmit();
}

function reset() {
  resetLogin();
  console.log('reset ', props.existingAuth);
  if (props.existingAuth) {
    botEdit.value = true;
    auth.value.botName = props.existingAuth.botName;
    auth.value.url = props.existingAuth.apiUrl;
    auth.value.username = props.existingAuth.username ?? '';
  }
}

defineExpose({
  reset,
});

onMounted(() => {
  reset();
});
</script>

<template>
  <form
    ref="formRef"
    class="text-left"
    novalidate
    @submit.stop.prevent="handleSubmit"
    @reset="handleReset"
  >
    <UFormField class="mb-4" :label="t('auth.botName')">
      <UInput
        v-model="auth.botName"
        :placeholder="t('auth.botName')"
        class="mt-1 block w-full"
        @keydown.enter="handleOk"
      />
    </UFormField>
    <UFormField
      class="mb-4"
      :label="t('auth.apiUrl')"
      :error="urlState === false ? t('auth.apiUrlRequired') : undefined"
    >
      <UInput
        id="url-input"
        v-model="auth.url"
        required
        trim
        class="mt-1 block w-full"
        @keydown.enter="handleOk"
      />
      <UAlert
        v-if="urlDuplicate"
        class="mt-2"
        color="warning"
        :title="t('auth.urlInUse')"
      >
      </UAlert>
    </UFormField>
    <UFormField
      class="mb-4"
      :label="t('auth.username')"
      :error="nameState === false ? t('auth.namePasswordRequired') : undefined"
    >
      <UInput
        v-model="auth.username"
        required
        :placeholder="t('auth.usernamePlaceholder')"
        class="w-full"
        @keydown.enter="handleOk"
      />
    </UFormField>
    <UFormField
      class="mb-4"
      :label="t('auth.password')"
      :error="pwdState === false ? t('auth.invalidPassword') : undefined"
    >
      <UInput
        v-model="auth.password"
        required
        type="password"
        class="w-full"
        @keydown.enter="handleOk"
      />
    </UFormField>
    <div>
      <UAlert
        v-if="errorMessage"
        class="mt-2 whitespace-pre-line"
        color="warning"
        :title="t('auth.loginFailed')"
      >
        <template #description>
          {{ errorMessage }}
          <span v-if="errorMessageCORS">
            {{ t('auth.corsHint') }}
            <a
              href="https://www.freqtrade.io/en/latest/rest-api/#cors"
              class="text-primary underline underline-offset-2"
              >{{ t('auth.corsDocs') }}</a
            >
          </span>
        </template>
      </UAlert>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <UButton :label="t('common.reset')" color="error" type="reset" />
      <UButton
        v-if="inModal"
        :label="t('common.cancel')"
        color="neutral"
        type="button"
        @click="emitLoginResult(true)"
      />
      <UButton :label="t('common.submit')" color="primary" type="submit" icon="mdi:login" />
    </div>
  </form>
</template>
