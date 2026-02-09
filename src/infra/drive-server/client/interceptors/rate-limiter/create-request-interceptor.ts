import type { InternalAxiosRequestConfig } from 'axios';
import { DelayState } from './rate-limiter.types';

export function createRequestInterceptor(
  delayState: DelayState,
): (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> {
  return async (config: InternalAxiosRequestConfig) => {
    if (delayState.pending) {
      await delayState.pending;
    }

    return config;
  };
}
