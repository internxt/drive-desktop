import Store, { Schema } from 'electron-store';

import { AppStore } from '../../core/electron/store/app-store.interface';
import { defaults } from '../../core/electron/store/defaults';
import { PATHS } from '../../core/electron/paths';

export type { AppStore, SavedConfig } from '../../core/electron/store/app-store.interface';
export { defaults, fieldsToSave } from '../../core/electron/store/defaults';

const schema: Schema<AppStore> = {
  newToken: { type: 'string' },
  newTokenEncrypted: { type: 'boolean' },
  mnemonic: { type: 'string' },
  mnemonicEncrypted: { type: 'boolean' },
  userData: { type: 'object' },

  backupsEnabled: { type: 'boolean' },
  backgroundScanEnabled: { type: 'boolean' },
  backupInterval: { type: 'number' },
  lastBackup: { type: 'number' },
  virtualDriveRoot: { type: 'string' },
  lastSavedListing: { type: 'string' },
  lastSync: { type: 'number' },

  /* deviceId is deprecated, use deviceUUID instead */
  deviceId: { type: 'number' },
  deviceUUID: { type: 'string' },
  backupList: { type: 'object' },

  savedConfigs: { type: 'object' },
  lastOnboardingShown: { type: 'string' },

  preferedLanguage: { type: 'string' },
  preferedTheme: { type: 'string' },

  nautilusExtensionVersion: { type: 'number' },
  discoveredBackup: { type: 'number' },
  availableUserProducts: { type: 'object' },
  maxUploadFileSizeInBytes: { type: 'number' },
} as const;

const configStore = new Store<AppStore>({
  schema,
  defaults,
  cwd: PATHS.INTERNXT,
  name: 'config',
  fileExtension: 'json',
});

function get<T extends keyof AppStore>(key: T): AppStore[T] {
  return configStore.get(key) as AppStore[T];
}

function set<T extends keyof AppStore>(key: T, value: AppStore[T]): void {
  configStore.set(key, value);
}

export const electronStore = { get, set };
export default electronStore;
