import { AxiosResponse } from 'axios';
import { RateLimitState } from './rate-limiter.types';

export function updateStateFromHeaders(state: RateLimitState, headers: AxiosResponse['headers']): void {
  const limitHeader = headers['x-internxt-ratelimit-limit'];
  const remainingHeader = headers['x-internxt-ratelimit-remaining'];
  const resetHeader = headers['x-internxt-ratelimit-reset'];

  if (limitHeader) {
    state.limit = parseInt(limitHeader, 10);
  }
  if (remainingHeader) {
    state.remaining = parseInt(remainingHeader, 10);
  }
  if (resetHeader) {
    state.reset = parseInt(resetHeader, 10);
  }
}
