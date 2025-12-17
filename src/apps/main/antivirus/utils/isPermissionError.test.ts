import { isPermissionError } from './isPermissionError';
import NodeClamError from '@internxt/scan/lib/NodeClamError';

vi.mock('@internxt/scan/lib/NodeClamError');

describe('isPermissionError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false for null or undefined', () => {
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });

  it('should return false for non-object values', () => {
    expect(isPermissionError('string error')).toBe(false);
    expect(isPermissionError(123)).toBe(false);
    expect(isPermissionError(true)).toBe(false);
  });

  it('should return true for errors with permission error codes', () => {
    const permissionCodes = ['EACCES', 'EPERM', 'EBUSY', 'ENOENT', 'ENOFILE', 'EISDIR'];

    permissionCodes.forEach((code) => {
      const error = new Error('Some error') as NodeJS.ErrnoException;
      error.code = code;
      expect(isPermissionError(error)).toBe(true);
    });
  });

  it('should return true for errors with permission error messages', () => {
    const permissionMessages = ['Operation not permitted', 'Access denied', 'Access is denied'];

    permissionMessages.forEach((message) => {
      const error = new Error(message);
      expect(isPermissionError(error)).toBe(true);
    });
  });

  it('should return false for errors without permission error codes or messages', () => {
    const error = new Error('Some other error') as NodeJS.ErrnoException;
    error.code = 'UNKNOWN';
    expect(isPermissionError(error)).toBe(false);
  });

  it('should handle NodeClamError with nested permission error', () => {
    const nestedError = new Error('Access denied') as NodeJS.ErrnoException;
    nestedError.code = 'EACCES';

    const clamError = new NodeClamError('Clam error');
    (clamError as any).data = { err: nestedError };

    expect(isPermissionError(clamError)).toBe(true);
  });

  it('should handle NodeClamError without nested error', () => {
    const clamError = new NodeClamError('Clam error');
    (clamError as any).data = {};

    expect(isPermissionError(clamError)).toBe(false);
  });
});
