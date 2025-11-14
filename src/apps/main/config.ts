import Store, { Schema } from 'electron-store';
import { AppStore } from '@/core/electron/store/app-store.interface';
import { defaults } from '@/core/electron/store/defaults';

const schema: Schema<AppStore> = {
  backupsEnabled: { type: 'boolean' },
  backupInterval: { type: 'number' },
  lastBackup: { type: 'number' },
  syncRoot: { type: 'string' },
  deviceUuid: { type: 'string' },
  backupList: { type: 'object' },

  newToken: { type: 'string' },
  newTokenEncrypted: { type: 'boolean' },
  userData: { type: 'object' },
  mnemonic: { type: 'string' },

  savedConfigs: { type: 'object' },
  lastOnboardingShown: { type: 'string' },
  discoveredBackup: { type: 'number' },
  preferedLanguage: { type: 'string' },
  preferedTheme: { type: 'string' },
  'patch-executed-2-5-1': { type: 'boolean' },
  'migrations.v2-5-1-add-user-uuid-to-database': { type: 'boolean' },
  'migrations.v2-5-6-move-checkpoint-to-lokijs': { type: 'boolean' },
  'migrations.v2-5-7-remove-antivirus-table': { type: 'boolean' },
} as const;

const configStore = new Store({ schema, defaults, accessPropertiesByDotNotation: false });

function get<T extends keyof AppStore>(key: T) {
  return configStore.get(key);
}

function set<T extends keyof AppStore>(key: T, value: AppStore[T]) {
  return configStore.set(key, value);
}

export const electronStore = { get, set };
export default electronStore;
