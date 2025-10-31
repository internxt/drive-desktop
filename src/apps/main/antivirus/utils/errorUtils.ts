import { isPermissionError } from './isPermissionError';
import NodeClamError from '@internxt/scan/lib/NodeClamError';

/**
 * Type guard to check if an unknown object is an Error
 * @param error The unknown object to check
 * @returns A type predicate indicating if the object is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type definition for ClamAV errors
 */
export interface ClamAVError extends Error {
  message: string;
  isClamAVError?: boolean;
}

/**
 * Type guard to check if an error is a ClamAV error
 * @param error The error to check
 * @returns A type predicate indicating if the error is a ClamAV error
 */
export function isClamAVError(error: Error): error is ClamAVError {
  return error.message.includes('ClamAV') || error instanceof NodeClamError || 'isClamAVError' in error;
}

/**
 * Type definition for critical errors that should terminate processes
 */
export interface CriticalError extends Error {
  isCritical?: boolean;
}

/**
 * Type guard to check if an error is critical
 * @param error The error to check
 * @returns A type predicate indicating if the error is critical
 */
export function isCriticalError(error: Error): error is CriticalError {
  if ('isCritical' in error) return true;

  if (isClamAVError(error)) return true;

  return error.message.toLowerCase().includes('critical');
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

/**
 * Determines if an error should be rethrown based on its criticality
 * @param error The error to check
 * @returns Boolean indicating if the error should be rethrown
 */
export function shouldRethrowError(error: unknown): boolean {
  if (!isError(error)) return false;

  if (isPermissionError(error)) return false;

  return isCriticalError(error);
}
