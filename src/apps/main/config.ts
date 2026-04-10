import Store, { Schema } from 'electron-store';
import { PATHS } from '@/core/electron/paths';
import { AppStore } from '@/core/electron/store/app-store.interface';
import { defaults } from '@/core/electron/store/defaults';

const schema: Schema<AppStore> = {
  backupInterval: { type: 'number' },
  lastBackup: { type: 'number' },
  syncRoot: { type: 'string' },
  deviceUuid: { type: 'string' },
  backupList: { type: 'object' },

  newToken: { type: 'string' },
  userData: { type: 'object' },

  savedConfigs: { type: 'object' },
  lastOnboardingShown: { type: 'string' },
  preferedLanguage: { type: 'string' },
  preferedTheme: { type: 'string' },
} as const;

const configStore = new Store({
  schema,
  defaults,
  accessPropertiesByDotNotation: false,
  cwd: PATHS.INTERNXT,
  name: 'config',
  fileExtension: 'json',
});

function get<T extends keyof AppStore>(key: T) {
  return configStore.get(key);
}

function set<T extends keyof AppStore>(key: T, value: AppStore[T]) {
  return configStore.set(key, value);
}

export const electronStore = { get, set };
export default electronStore;
