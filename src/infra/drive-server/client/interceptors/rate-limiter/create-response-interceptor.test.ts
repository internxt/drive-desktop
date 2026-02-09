import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { call } from 'tests/vitest/utils.helper';
import { createResponseInterceptor } from './create-response-interceptor';
import { DelayState, RateLimitState } from './rate-limiter.types';
import { RETRY_CONFIG_KEY, MAX_RETRIES } from '../../drive-server.constants';

vi.unmock('axios');

vi.mock('@internxt/drive-desktop-core/build/backend/core/logger/logger', () => ({
  logger: { warn: vi.fn() },
}));

vi.mock('./update-state-from-headers', () => ({
  updateStateFromHeaders: vi.fn(),
}));

vi.mock('./wait-for-delay', () => ({
  waitForDelay: vi.fn(),
}));

vi.mock('./add-jitter', () => ({
  addJitter: vi.fn((ms: number) => ms),
}));

import { updateStateFromHeaders } from './update-state-from-headers';
import { waitForDelay } from './wait-for-delay';
import { addJitter } from './add-jitter';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';

function makeResponse(headers: Record<string, string> = {}): AxiosResponse {
  return {
    data: {},
    status: 200,
    statusText: 'OK',
    headers,
    config: {} as InternalAxiosRequestConfig,
  };
}

function makeConfig(): InternalAxiosRequestConfig {
  return {} as InternalAxiosRequestConfig;
}

function make429Error(config?: InternalAxiosRequestConfig, headers: Record<string, string> = {}): AxiosError {
  const error = new AxiosError('Rate limited', '429', config);
  error.response = {
    status: 429,
    statusText: 'Too Many Requests',
    headers,
    data: {},
    config: config ?? makeConfig(),
  };
  return error;
}

function makeNon429Error(status: number): AxiosError {
  const error = new AxiosError('Server error', String(status));
  error.response = {
    status,
    statusText: 'Error',
    headers: {},
    data: {},
    config: makeConfig(),
  };
  return error;
}

describe('createResponseInterceptor', () => {
  let state: RateLimitState;
  let delayState: DelayState;
  let instance: AxiosInstance;
  let retryResponse: AxiosResponse;

  beforeEach(() => {
    state = { limit: null, remaining: null, reset: null };
    delayState = { pending: null };
    retryResponse = makeResponse();
    instance = { request: vi.fn().mockResolvedValue(retryResponse) } as unknown as AxiosInstance;
  });

  describe('onFulfilled', () => {
    it('should update state from response headers and return the response', () => {
      const { onFulfilled } = createResponseInterceptor(instance, state, delayState);
      const response = makeResponse({ 'x-internxt-ratelimit-remaining': '10' });

      const result = onFulfilled(response);

      call(updateStateFromHeaders).toMatchObject([state, response.headers]);
      expect(result).toBe(response);
    });
  });

  describe('onRejected', () => {
    it('should reject non-429 errors without retrying', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const error = makeNon429Error(500);

      await expect(onRejected(error)).rejects.toBe(error);
      expect(instance.request).not.toHaveBeenCalled();
    });

    it('should reject if error has no config', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const error = make429Error(undefined);
      error.config = undefined;

      await expect(onRejected(error)).rejects.toBe(error);
      expect(instance.request).not.toHaveBeenCalled();
    });

    it('should update state from 429 response headers', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const headers = { 'x-internxt-ratelimit-reset': '5000' };
      const config = makeConfig();
      const error = make429Error(config, headers);

      await onRejected(error);

      call(updateStateFromHeaders).toMatchObject([state, headers]);
    });

    it('should wait using the reset value from state with jitter and retry', async () => {
      state.reset = 3000;
      vi.mocked(addJitter).mockReturnValue(3050);

      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const config = makeConfig();
      const error = make429Error(config);

      const result = await onRejected(error);

      call(addJitter).toStrictEqual(3000);
      call(waitForDelay).toMatchObject([delayState, 3050]);
      call(instance.request).toMatchObject(config);
      expect(result).toBe(retryResponse);
    });

    it('should default to 5000ms when state.reset is null', async () => {
      state.reset = null;

      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const config = makeConfig();
      const error = make429Error(config);

      await onRejected(error);

      call(addJitter).toStrictEqual(5000);
    });

    it('should increment the retry count on the config', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const config = makeConfig();
      const error = make429Error(config);

      await onRejected(error);

      expect(config[RETRY_CONFIG_KEY]).toBe(1);
    });

    it('should reject when retry count reaches MAX_RETRIES', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const config = { ...makeConfig(), [RETRY_CONFIG_KEY]: MAX_RETRIES } as InternalAxiosRequestConfig;
      const error = make429Error(config);

      await expect(onRejected(error)).rejects.toBe(error);
      call(logger.warn).toMatchObject({ msg: '[RATE LIMITER] Max retries exceeded for 429 response' });
      expect(instance.request).not.toBeCalled();
    });

    it('should reject errors without a response status', async () => {
      const { onRejected } = createResponseInterceptor(instance, state, delayState);
      const error = new AxiosError('Network error');

      await expect(onRejected(error)).rejects.toBe(error);
      expect(updateStateFromHeaders).not.toBeCalled();
      expect(addJitter).not.toBeCalled();
      expect(waitForDelay).not.toBeCalled();
      expect(instance.request).not.toBeCalled();
    });
  });
});
