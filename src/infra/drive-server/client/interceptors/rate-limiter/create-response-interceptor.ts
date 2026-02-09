import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { DelayState, RateLimitState, ResponseInterceptor } from './rate-limiter.types';
import { updateStateFromHeaders } from './update-state-from-headers';
import { waitForDelay } from './wait-for-delay';
import { addJitter } from './add-jitter';
import { MAX_RETRIES, RETRY_CONFIG_KEY } from '../../drive-server.constants';

export function createResponseInterceptor(
  instance: AxiosInstance,
  state: RateLimitState,
  delayState: DelayState,
): ResponseInterceptor {
  const onFulfilled = (response: AxiosResponse): AxiosResponse => {
    updateStateFromHeaders(state, response.headers);
    return response;
  };

  const onRejected = async (error: AxiosError): Promise<AxiosResponse | never> => {
    if (error.response?.status !== 429) {
      return Promise.reject(error);
    }

    const config = error.config;
    if (!config) {
      return Promise.reject(error);
    }

    updateStateFromHeaders(state, error.response.headers);

    const retryCount = config[RETRY_CONFIG_KEY] ?? 0;

    if (retryCount >= MAX_RETRIES) {
      logger.warn({
        msg: '[RATE LIMITER] Max retries exceeded for 429 response',
        url: config.url,
        retryCount,
      });
      return Promise.reject(error);
    }

    const waitMs = addJitter(state.reset ?? 5000);

    logger.warn({
      msg: '[RATE LIMITER] Rate limit exceeded (429), waiting and retrying',
      url: config.url,
      waitMs,
      retryCount: retryCount + 1,
      maxRetries: MAX_RETRIES,
    });

    await waitForDelay(delayState, waitMs);

    config[RETRY_CONFIG_KEY] = retryCount + 1;
    return instance.request(config);
  };

  return { onFulfilled, onRejected };
}
