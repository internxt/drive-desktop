import { afterAll } from 'vitest';
import { cleanupIsolatedStore, createIsolatedStore } from '../e2e/helpers/isolated-store.helper';

process.env.NODE_ENV = 'test';
process.env.PLAYWRIGHT_TEST = 'true';

cleanupIsolatedStore();
createIsolatedStore();

afterAll(() => {
  cleanupIsolatedStore();
});
