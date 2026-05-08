import { mkdirSync } from 'node:fs';
import { vi } from 'vitest';

import { TEST_FILES } from './mocks.helper.test';

// We do not want to log anything
vi.mock(import('@/backend/core/logger/logger'));
// We do not want sentry in tests
vi.mock(import('@/backend/core/sentry/sentry'), () => ({
  captureSentryException: vi.fn(),
  getSentryEnvironment: vi.fn(() => 'test'),
  initSentry: vi.fn(),
  setSentryUserContext: vi.fn(),
  clearSentryUserContext: vi.fn(),
}));

mkdirSync(TEST_FILES, { recursive: true });
