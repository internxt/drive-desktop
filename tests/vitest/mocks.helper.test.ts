import { cwd } from 'node:process';
import { client } from '@/apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';

export const TEST_FILES = join(abs(cwd()), 'test-files');
export const loggerMock = vi.mocked(logger);
export const clientMock = vi.mocked(client);
export const testLoggerFn = vi.fn();
export const testLogger = {
  debug: testLoggerFn,
  warn: testLoggerFn,
  error: testLoggerFn,
};
