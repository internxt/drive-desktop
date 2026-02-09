import type { AxiosInstance } from 'axios';
import { DelayState, RateLimitState } from './rate-limiter.types';
import { createRequestInterceptor } from './create-request-interceptor';
import { createResponseInterceptor } from './create-response-interceptor';

export function attachRateLimiterInterceptors(instance: AxiosInstance): void {
  const state: RateLimitState = { limit: null, remaining: null, reset: null };
  const delayState: DelayState = { pending: null };

  instance.interceptors.request.use(createRequestInterceptor(delayState));

  const { onFulfilled, onRejected } = createResponseInterceptor(instance, state, delayState);
  instance.interceptors.response.use(onFulfilled, onRejected);
}
