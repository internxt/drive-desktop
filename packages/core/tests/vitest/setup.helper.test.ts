import { mkdirSync } from 'node:fs';
import { vi } from 'vitest';

import { TEST_FILES } from './mocks.helper.test';

// We do not want to log anything
vi.mock(import('@/backend/core/logger/logger'));

mkdirSync(TEST_FILES, { recursive: true });
