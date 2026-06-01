import { isError } from '../../../../shared/errors/is-error';

/**
 * Safely gets the error message from any error object
 * @param error The error object (can be any type)
 * @returns A string representation of the error
 */
export function getErrorMessage(error: unknown): string {
  if (error === null) {
    return 'NULL error object (possibly ClamAV issue)';
  }

  if (isError(error)) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    if ('data' in error) {
      const data = (error as Record<string, unknown>).data;
      if (data && typeof data === 'object' && 'err' in data) {
        return `ClamAV Error: ${getErrorMessage(data.err)}`;
      }
    }

    if ('message' in error && typeof (error as Record<string, unknown>).message === 'string') {
      return (error as Record<string, unknown>).message as string;
    }

    try {
      const jsonStr = JSON.stringify(error);
      if (jsonStr && jsonStr !== '{}') {
        return `Error object: ${jsonStr.substring(0, 200)}${jsonStr.length > 200 ? '...' : ''}`;
      }
    } catch (_) {
      return String(error);
    }
  }

  return String(error);
}
