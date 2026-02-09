import type { InternalAxiosRequestConfig } from 'axios';
import { createRequestInterceptor } from './create-request-interceptor';
import { DelayState } from './rate-limiter.types';

describe('createRequestInterceptor', () => {
  const mockConfig = { url: '/test' } as InternalAxiosRequestConfig;

  it('should return the config immediately when there is no pending delay', async () => {
    const state: DelayState = { pending: null };
    const interceptor = createRequestInterceptor(state);

    const result = await interceptor(mockConfig);

    expect(result).toBe(mockConfig);
  });

  it('should wait for the pending delay before returning the config', async () => {
    let resolveDelay!: () => void;
    const state: DelayState = {
      pending: new Promise((resolve) => {
        resolveDelay = resolve;
      }),
    };
    const interceptor = createRequestInterceptor(state);

    let resolved = false;
    const resultPromise = interceptor(mockConfig).then((config) => {
      resolved = true;
      return config;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    resolveDelay();
    const result = await resultPromise;

    expect(resolved).toBe(true);
    expect(result).toBe(mockConfig);
  });

  it('should make multiple concurrent requests wait for the same delay', async () => {
    let resolveDelay!: () => void;
    const state: DelayState = {
      pending: new Promise((resolve) => {
        resolveDelay = resolve;
      }),
    };
    const interceptor = createRequestInterceptor(state);

    const configA = { url: '/a' } as InternalAxiosRequestConfig;
    const configB = { url: '/b' } as InternalAxiosRequestConfig;

    const promiseA = interceptor(configA);
    const promiseB = interceptor(configB);

    resolveDelay();

    const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

    expect(resultA).toBe(configA);
    expect(resultB).toBe(configB);
  });
});
