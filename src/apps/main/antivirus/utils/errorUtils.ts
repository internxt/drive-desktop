/**
 * Type guard to check if an unknown object is an Error
 * @param error The unknown object to check
 * @returns A type predicate indicating if the object is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

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
      const data = (error as any).data;
      if (data && data.err) {
        return `ClamAV Error: ${getErrorMessage(data.err)}`;
      }
    }

    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
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
