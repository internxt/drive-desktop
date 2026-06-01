import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';
import { createTransientErrorHandler } from './transient-error-handler';
import { INITIAL_RATE_LIMIT_DELAY_MS, INITIAL_SERVER_ERROR_DELAY_MS, MAX_BACKOFF_MS } from './constants';

describe('createTransientErrorHandler', () => {
  it('should return null for non-retryable errors', () => {
    const handler = createTransientErrorHandler({ tag: 'BACKUPS', context: 'TEST', path: '/file.txt' });

    expect(handler(new DriveDesktopError('UNKNOWN'))).toBeNull();
    expect(handler(new DriveDesktopError('NOT_ENOUGH_SPACE'))).toBeNull();
    expect(handler(new DriveDesktopError('FILE_ALREADY_EXISTS'))).toBeNull();
  });

  it('should return exponential backoff delay for INTERNAL_SERVER_ERROR', () => {
    const handler = createTransientErrorHandler({ tag: 'BACKUPS', context: 'TEST', path: '/file.txt' });
    const error = new DriveDesktopError('INTERNAL_SERVER_ERROR');

    expect(handler(error)).toBe(INITIAL_SERVER_ERROR_DELAY_MS * Math.pow(2, 0)); // attempt 1: 1000ms
    expect(handler(error)).toBe(INITIAL_SERVER_ERROR_DELAY_MS * Math.pow(2, 1)); // attempt 2: 2000ms
    expect(handler(error)).toBe(INITIAL_SERVER_ERROR_DELAY_MS * Math.pow(2, 2)); // attempt 3: 4000ms
  });

  it('should cap INTERNAL_SERVER_ERROR delay at MAX_BACKOFF_MS', () => {
    const handler = createTransientErrorHandler({ tag: 'SYNC-ENGINE', context: 'TEST', path: '/file.txt' });
    const error = new DriveDesktopError('INTERNAL_SERVER_ERROR');

    // base=1000, cap=480000 → attempt 9: 256000ms, attempt 10: 512000ms → capped
    for (let i = 0; i < 9; i++) handler(error);

    expect(handler(error)).toBe(MAX_BACKOFF_MS);
  });

  it('should use retry_after from RATE_LIMITED message as base delay', () => {
    const retryAfterMs = 60_000;
    const handler = createTransientErrorHandler({ tag: 'BACKUPS', context: 'TEST', path: '/file.txt' });
    const error = new DriveDesktopError('RATE_LIMITED', String(retryAfterMs));

    expect(handler(error)).toBe(retryAfterMs * Math.pow(2, 0)); // attempt 1: 60000ms
  });

  it('should fall back to INITIAL_RATE_LIMIT_DELAY_MS when RATE_LIMITED message is not a number', () => {
    const handler = createTransientErrorHandler({ tag: 'SYNC-ENGINE', context: 'TEST', path: '/file.txt' });
    const error = new DriveDesktopError('RATE_LIMITED', 'not-a-number');

    expect(handler(error)).toBe(INITIAL_RATE_LIMIT_DELAY_MS);
  });

  it('should apply exponential backoff across multiple RATE_LIMITED retries', () => {
    const retryAfterMs = 10_000;
    const handler = createTransientErrorHandler({ tag: 'BACKUPS', context: 'TEST', path: '/file.txt' });
    const error = new DriveDesktopError('RATE_LIMITED', String(retryAfterMs));

    expect(handler(error)).toBe(retryAfterMs * Math.pow(2, 0)); // attempt 1: 10000ms
    expect(handler(error)).toBe(retryAfterMs * Math.pow(2, 1)); // attempt 2: 20000ms
  });

  it('should share attempt counter between RATE_LIMITED and INTERNAL_SERVER_ERROR', () => {
    const handler = createTransientErrorHandler({ tag: 'SYNC-ENGINE', context: 'TEST', path: '/file.txt' });

    handler(new DriveDesktopError('INTERNAL_SERVER_ERROR')); // attempt 1, base=1000 → 1000ms
    const delay = handler(new DriveDesktopError('RATE_LIMITED', String(INITIAL_RATE_LIMIT_DELAY_MS))); // attempt 2, base=30000 → 60000ms

    expect(delay).toBe(INITIAL_RATE_LIMIT_DELAY_MS * Math.pow(2, 1));
  });

  it('should create independent state per handler instance', () => {
    const handler1 = createTransientErrorHandler({ tag: 'BACKUPS', context: 'TEST', path: '/file1.txt' });
    const handler2 = createTransientErrorHandler({ tag: 'SYNC-ENGINE', context: 'TEST', path: '/file2.txt' });
    const error = new DriveDesktopError('INTERNAL_SERVER_ERROR');

    handler1(error); // advance handler1 to attempt 1
    handler1(error); // advance handler1 to attempt 2

    // handler2 should start fresh at attempt 1
    expect(handler2(error)).toBe(INITIAL_SERVER_ERROR_DELAY_MS);
  });
});
