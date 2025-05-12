import { logger } from '@/apps/shared/logger/logger';
import { join } from 'path';
import { cwd } from 'process';

export const TEST_FILES = join(cwd(), 'test-files');

export const loggerMock = vi.mocked(logger);
