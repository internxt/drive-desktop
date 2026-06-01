import { type Mock } from 'vitest';
import { call } from 'tests/vitest/utils.helper';
import { attachAuthInterceptors } from './attach-auth-interceptors';
import { createRequestInterceptor } from './create-request-interceptor';
import { createResponseInterceptor } from './create-response-interceptor';
import { AxiosInstance } from 'axios';

vi.mock('./create-request-interceptor');
vi.mock('./create-response-interceptor');

describe('attachAuthInterceptors', () => {
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
  } as unknown as AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    (createRequestInterceptor as Mock).mockReturnValue(mockRequestInterceptor);
    (createResponseInterceptor as Mock).mockReturnValue({
      onFulfilled: mockOnFulfilled,
      onRejected: mockOnRejected,
    });
  });

  it('should register request and response interceptors when both options are provided', () => {
    const authHeadersProvider = vi.fn(() => ({ Authorization: 'Bearer token' }));
    const onUnauthorized = vi.fn();

    attachAuthInterceptors(instance, { authHeadersProvider, onUnauthorized });

    call(createRequestInterceptor).toMatchObject(authHeadersProvider);
    call(mockRequestUse).toMatchObject(mockRequestInterceptor);

    call(createResponseInterceptor).toMatchObject(onUnauthorized);
    call(mockResponseUse).toMatchObject([mockOnFulfilled, mockOnRejected]);
  });

  it('should only register request interceptor when only authHeadersProvider is provided', () => {
    const authHeadersProvider = vi.fn(() => ({ Authorization: 'Bearer token' }));

    attachAuthInterceptors(instance, { authHeadersProvider });

    call(createRequestInterceptor).toMatchObject(authHeadersProvider);
    call(mockRequestUse).toMatchObject(mockRequestInterceptor);
    expect(createResponseInterceptor).not.toBeCalled();
    expect(mockResponseUse).not.toBeCalled();
  });

  it('should only register response interceptor when only onUnauthorized is provided', () => {
    const onUnauthorized = vi.fn();

    attachAuthInterceptors(instance, { onUnauthorized });

    expect(createRequestInterceptor).not.toBeCalled();
    expect(mockRequestUse).not.toBeCalled();
    call(createResponseInterceptor).toMatchObject(onUnauthorized);
    call(mockResponseUse).toMatchObject([mockOnFulfilled, mockOnRejected]);
  });
});
