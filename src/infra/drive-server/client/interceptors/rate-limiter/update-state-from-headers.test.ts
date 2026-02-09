import { RateLimitState } from './rate-limiter.types';
import { updateStateFromHeaders } from './update-state-from-headers';

describe('updateStateFromHeaders', () => {
  it('should update all state fields when all headers are present', () => {
    const state: RateLimitState = { limit: null, remaining: null, reset: null };

    updateStateFromHeaders(state, {
      'x-internxt-ratelimit-limit': '100',
      'x-internxt-ratelimit-remaining': '50',
      'x-internxt-ratelimit-reset': '3000',
    });

    expect(state.limit).toBe(100);
    expect(state.remaining).toBe(50);
    expect(state.reset).toBe(3000);
  });

  it('should not change state when no rate limit headers are present', () => {
    const state: RateLimitState = { limit: 100, remaining: 50, reset: 3000 };

    updateStateFromHeaders(state, { 'content-type': 'application/json' });

    expect(state.limit).toBe(100);
    expect(state.remaining).toBe(50);
    expect(state.reset).toBe(3000);
  });

  it('should only update the headers that are present', () => {
    const state: RateLimitState = { limit: null, remaining: null, reset: null };

    updateStateFromHeaders(state, {
      'x-internxt-ratelimit-remaining': '25',
    });

    expect(state.limit).toBeNull();
    expect(state.remaining).toBe(25);
    expect(state.reset).toBeNull();
  });

  it('should overwrite existing state values with new header values', () => {
    const state: RateLimitState = { limit: 100, remaining: 50, reset: 3000 };

    updateStateFromHeaders(state, {
      'x-internxt-ratelimit-limit': '200',
      'x-internxt-ratelimit-remaining': '199',
      'x-internxt-ratelimit-reset': '5000',
    });

    expect(state.limit).toBe(200);
    expect(state.remaining).toBe(199);
    expect(state.reset).toBe(5000);
  });
});
