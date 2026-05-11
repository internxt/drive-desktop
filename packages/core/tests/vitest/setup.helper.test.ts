import { mkdirSync } from 'node:fs';
import { vi } from 'vitest';

import { TEST_FILES } from './mocks.helper.test';

// We do not want to log anything
vi.mock(import('@/backend/core/logger/logger'));
// We do not want sentry in tests
vi.mock(import('@/backend/core/sentry/sentry'), () => ({}));

mkdirSync(TEST_FILES, { recursive: true });
