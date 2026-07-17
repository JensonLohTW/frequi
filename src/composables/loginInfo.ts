import type { AxiosResponse } from 'axios';
import axios from 'axios';

import type {
  AuthPayload,
  AuthResponse,
  BotDescriptors,
  AuthStorage,
  AuthStorageMulti,
  BotDescriptor,
} from '@/types';
import { AUTH_LOGIN_INFO_KEY, createAuthStorageAdapter } from '@/platform/authStorage';
import { API_BASE_PATH, normalizeApiBase } from '@/platform/apiBase';
import { isPlatformSingleOrigin } from '@/platform/flags';
import { createRefreshCoordinator } from '@/platform/refreshCoordinator';

const platformSingleOrigin = isPlatformSingleOrigin();
const authStorageAdapter = createAuthStorageAdapter(platformSingleOrigin);

// Global state for all login infos — storage backend selected by platform flag
const allLoginInfos = useStorage<AuthStorageMulti>(AUTH_LOGIN_INFO_KEY, {}, authStorageAdapter);

/**
 * Get available bots with their descriptors
 */
export const loggedInBots = computed<BotDescriptors>(() => {
  const allInfo = allLoginInfos.value;
  const response: BotDescriptors = {};
  Object.keys(allInfo)
    .sort((a, b) => (allInfo[a]?.sortId ?? 0) - (allInfo[b]?.sortId ?? 0))
    .forEach((k, idx) => {
      const bot = allInfo[k];
      if (!bot) return;
      response[k] = {
        botId: k,
        botName: bot.botName,
        botUrl: bot.apiUrl,
        sortId: bot.sortId ?? idx,
      };
    });

  return response;
});

export function useLoginInfo(botId: string) {
  const currentInfo = computed({
    get: () => allLoginInfos.value[botId]!,
    set: (val) => (allLoginInfos.value[botId] = val),
  });

  const autoRefresh = computed({
    get: () => currentInfo.value.autoRefresh,
    set: (val) => (currentInfo.value.autoRefresh = val),
  });
  const accessToken = computed(() => currentInfo.value.accessToken);

  const baseUrl = computed<string>(() =>
    normalizeApiBase(
      platformSingleOrigin ? undefined : currentInfo.value?.apiUrl,
      platformSingleOrigin,
    ),
  );

  const baseWsUrl = computed<string>(() => {
    const baseURL = baseUrl.value;
    if (baseURL.startsWith('http://')) {
      return baseURL.replace('http://', 'ws://');
    }
    if (baseURL.startsWith('https://')) {
      return baseURL.replace('https://', 'wss://');
    }
    // Relative API base under platform same-origin — derive from page origin
    if (platformSingleOrigin && typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      if (origin.startsWith('https://')) {
        return `${origin.replace('https://', 'wss://')}${API_BASE_PATH}`;
      }
      if (origin.startsWith('http://')) {
        return `${origin.replace('http://', 'ws://')}${API_BASE_PATH}`;
      }
    }
    return '';
  });

  /**
   * Get login info for current bot
   */
  function getLoginInfo(): AuthStorage {
    const allLoginBot = allLoginInfos.value[botId];
    if (allLoginBot && 'apiUrl' in allLoginBot && 'refreshToken' in allLoginBot) {
      return allLoginBot;
    }
    return {
      botName: '',
      apiUrl: '',
      username: '',
      refreshToken: '',
      accessToken: '',
      autoRefresh: false,
    };
  }

  function updateBot(newValues: Partial<BotDescriptor>): void {
    Object.assign(currentInfo.value, newValues);
  }

  function setRefreshTokenExpired(): void {
    if (currentInfo.value) {
      currentInfo.value.refreshToken = '';
      currentInfo.value.accessToken = '';
    }
  }

  function logout(): void {
    delete allLoginInfos.value[botId];
  }

  async function loginCall(auth: AuthPayload): Promise<AuthStorage> {
    const loginBase = platformSingleOrigin
      ? normalizeApiBase(undefined, true)
      : `${auth.url.replace(/\/+$/, '')}${API_BASE_PATH}`;

    const { data } = await axios.post<Record<string, never>, AxiosResponse<AuthResponse>>(
      `${loginBase}/token/login`,
      {},
      {
        auth: { ...auth },
        withCredentials: true,
      },
    );
    if (data.access_token && data.refresh_token) {
      const obj: AuthStorage = {
        botName: auth.botName,
        apiUrl: platformSingleOrigin
          ? typeof window !== 'undefined'
            ? window.location.origin
            : auth.url
          : auth.url,
        username: auth.username,
        accessToken: data.access_token || '',
        refreshToken: data.refresh_token || '',
        autoRefresh: true,
      };
      return Promise.resolve(obj);
    }
    return Promise.reject(new Error('login failed'));
  }

  async function login(auth: AuthPayload) {
    const loginInfo = await loginCall(auth);
    currentInfo.value = loginInfo;
  }

  async function performRefresh(): Promise<string> {
    const token = currentInfo.value?.refreshToken;
    if (!token) {
      throw new Error('No refresh token');
    }

    const response = await axios.post<Record<string, never>, AxiosResponse<AuthResponse>>(
      `${baseUrl.value}/token/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      },
    );

    if (!response.data.access_token) {
      throw new Error('Refresh response missing access_token');
    }
    currentInfo.value.accessToken = response.data.access_token;
    return response.data.access_token;
  }

  const refreshCoordinator = createRefreshCoordinator({
    refresh: performRefresh,
    clearSession: setRefreshTokenExpired,
  });

  function refreshToken(): Promise<string> {
    return refreshCoordinator.runRefresh();
  }

  return {
    updateBot,
    getLoginInfo,
    autoRefresh,
    accessToken,
    logout,
    login,
    refreshToken,
    baseUrl,
    baseWsUrl,
    refreshCoordinator,
  };
}
