import Store, { Schema } from 'electron-store';
import { AppStore } from '@/core/electron/store/app-store.interface';
import { defaults } from '@/core/electron/store/defaults';

const schema: Schema<AppStore> = {
  newToken: { type: 'string' },
  newTokenEncrypted: { type: 'boolean' },
  userData: { type: 'object' },
  mnemonic: { type: 'string' },
  backupsEnabled: { type: 'boolean' },
  backupInterval: { type: 'number' },
  lastBackup: { type: 'number' },
  syncRoot: { type: 'string' },
  savedConfigs: { type: 'object' },
  lastOnboardingShown: { type: 'string' },
  deviceUuid: { type: 'string' },
  backupList: { type: 'object' },
  preferedLanguage: { type: 'string' },
  preferedTheme: { type: 'string' },
} as const;

export const configStore = new Store({ schema, defaults });
export default configStore;
