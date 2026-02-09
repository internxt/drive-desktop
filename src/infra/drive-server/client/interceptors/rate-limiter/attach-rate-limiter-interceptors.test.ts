import { type Mock } from 'vitest';
import { call } from 'tests/vitest/utils.helper';
import { attachRateLimiterInterceptors } from './attach-rate-limiter-interceptors';
import { createRequestInterceptor } from './create-request-interceptor';
import { createResponseInterceptor } from './create-response-interceptor';

vi.mock('./create-request-interceptor');
vi.mock('./create-response-interceptor');

describe('attachRateLimiterInterceptors', () => {
  const mockRequestInterceptor = vi.fn();
  const mockOnFulfilled = vi.fn();
  const mockOnRejected = vi.fn();

  const mockRequestUse = vi.fn();
  const mockResponseUse = vi.fn();

  const instance = {
    interceptors: {
      request: { use: mockRequestUse },
      response: { use: mockResponseUse },
    },
  } as any;

  beforeEach(() => {
    (createRequestInterceptor as Mock).mockReturnValue(mockRequestInterceptor);
    (createResponseInterceptor as Mock).mockReturnValue({
      onFulfilled: mockOnFulfilled,
      onRejected: mockOnRejected,
    });
  });

  it('should create a request interceptor with a fresh delay state', () => {
    attachRateLimiterInterceptors(instance);

    call(createRequestInterceptor).toMatchObject({ pending: null });
  });

  it('should register the request interceptor on the instance', () => {
    attachRateLimiterInterceptors(instance);

    call(mockRequestUse).toMatchObject(mockRequestInterceptor);
  });

  it('should create a response interceptor with the instance, fresh rate limit state, and delay state', () => {
    attachRateLimiterInterceptors(instance);

    call(createResponseInterceptor).toMatchObject([
      instance,
      { limit: null, remaining: null, reset: null },
      { pending: null },
    ]);
  });

  it('should register the response interceptor on the instance', () => {
    attachRateLimiterInterceptors(instance);

    call(mockResponseUse).toMatchObject([mockOnFulfilled, mockOnRejected]);
  });

  it('should share the same delay state between request and response interceptors', () => {
    const delayState = { pending: null };

    attachRateLimiterInterceptors(instance);

    call(createRequestInterceptor).toMatchObject(delayState);
    call(createResponseInterceptor).toMatchObject([expect.anything(), expect.anything(), delayState]);
  });
});
