import type { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

type UserServiceType = ReturnType<typeof useLoginInfo>;

export function useApi(userService: UserServiceType, botId: string) {
  const api = axios.create({
    baseURL: userService.baseUrl.value,
    timeout: 20000,
    withCredentials: true,
  });

  const coordinator = userService.refreshCoordinator;

  // Sent auth headers interceptor — never set Bearer undefined/null
  api.interceptors.request.use(
    (request) => {
      const token = userService.accessToken.value;
      const header = coordinator.buildAuthorizationHeader(token);
      if (header) {
        request.headers = request.headers as AxiosHeaders;
        request.headers.set('Authorization', header);
      }
      return request;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    async (err) => {
      const config = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (err.response && err.response.status === 401 && coordinator.shouldRetry(config)) {
        coordinator.markRetry(config);
        try {
          const token = await userService.refreshToken();
          const header = coordinator.buildAuthorizationHeader(token);
          if (!header) {
            throw new Error('No access token after refresh');
          }
          // Retry original request once with the new token only
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', header);
          } else {
            config.headers = config.headers ?? {};
            (config.headers as Record<string, string>).Authorization = header;
          }
          return await axios.request(config);
        } catch (error) {
          const botStore = useBotStore();
          if (botStore.botStores[botId]) {
            botStore.botStores[botId].setIsBotOnline(false);
            botStore.botStores[botId].isBotLoggedIn = false;
          }
          return Promise.reject(error);
        }
      }

      if ((err.response && err.response.status === 500) || err.message === 'Network Error') {
        const botStore = useBotStore();
        botStore.botStores[botId]?.setIsBotOnline(false);
      }

      return Promise.reject(err);
    },
  );

  return {
    api,
  };
}
