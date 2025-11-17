import { authClient } from '@/apps/shared/HttpClient/auth-client';
import { client } from '@/apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { posix, win32 } from 'node:path';
import { join } from 'node:path/posix';
import { cwd } from 'node:process';

export const TEST_FILES = join(cwd().replaceAll(win32.sep, posix.sep), 'test-files');
export const loggerMock = vi.mocked(logger);
export const authClientMock = vi.mocked(authClient);
export const clientMock = vi.mocked(client);
