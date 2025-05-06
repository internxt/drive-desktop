import { isAxiosError } from 'axios';

export function mapError(error: unknown): Error {
  if (isAxiosError(error)) {
    const msg = error.response?.data.message
      ?? error.message
      ?? 'Unexpected error';
    return new Error(msg, { cause: error });
  }
  return error instanceof Error ? error : new Error(String(error));
}
