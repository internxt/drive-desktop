import { afterAll } from 'vitest';
import { cleanupIsolatedStore, getIsolatedStore } from '../e2e/helpers/isolated-store.helper';

cleanupIsolatedStore();

const store = getIsolatedStore();
process.env.E2E_TEST = 'true';
process.env.E2E_HOME_PATH = store.homeDir;
process.env.E2E_APPDATA_PATH = store.appDir;
process.env.PORT = 1414;

afterAll(() => {
  cleanupIsolatedStore();
});
