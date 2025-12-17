import { AxiosError, isAxiosError } from 'axios';
import { mapError } from './mapError';
import { vi } from 'vitest';

vi.mock('axios', () => ({
  isAxiosError: vi.fn()
}));

describe('mapError', () => {
  it('should return an Error with message from Axios error response.data.message', () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { message: 'Invalid token' } },
      message: 'Some axios error',
      config: {},
      toJSON: () => ({}),
      name: 'AxiosError',
    } as AxiosError;

    vi.mocked(isAxiosError).mockReturnValueOnce(true);

    const err = mapError(axiosError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Invalid token');
    expect((err as any).cause).toBe(axiosError);
  });

  it('should fall back to Axios error message if response.data.message is missing', () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: {} },
      message: 'Fallback message',
      config: {},
      toJSON: () => ({}),
      name: 'AxiosError',
    } as AxiosError;

    vi.mocked(isAxiosError).mockReturnValueOnce(true);

    const err = mapError(axiosError);
    expect(err.message).toBe('Fallback message');
  });

  it('should fall back to "Unexpected error" if no message available', () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: {} },
      config: {},
      toJSON: () => ({}),
      name: 'AxiosError',
    } as AxiosError;

    vi.mocked(isAxiosError).mockReturnValueOnce(true);

    const err = mapError(axiosError);
    expect(err.message).toBe('Unexpected error');
  });

  it('should return Error as-is if already an instance of Error', () => {
    const original = new Error('Existing error');
    vi.mocked(isAxiosError).mockReturnValueOnce(false);
    const result = mapError(original);
    expect(result).toBe(original);
  });

  it('should convert unknown non-error types to Error', () => {
    vi.mocked(isAxiosError).mockReturnValueOnce(false);
    const result = mapError('Some string error');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Some string error');
  });
});
