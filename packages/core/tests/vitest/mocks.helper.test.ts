import { join } from 'node:path';
import { cwd } from 'node:process';

import { logger } from '@/backend/core/logger/logger';

export const TEST_FILES = join(cwd(), 'test-files');
export const loggerMock = vi.mocked(logger);
