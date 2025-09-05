import Store, { Schema } from 'electron-store';
import { AppStore } from '@/core/electron/store/app-store.interface';
import { defaults } from '@/core/electron/store/defaults';

const schema: Schema<AppStore> = {
  newToken: {
    type: 'string',
  },
  newTokenEncrypted: {
    type: 'boolean',
  },
  userData: {
    type: 'object',
  },
  mnemonic: {
    type: 'string',
  },
  backupsEnabled: {
    type: 'boolean',
  },
  backupInterval: {
    type: 'number',
  },
  lastBackup: {
    type: 'number',
  },
  syncRoot: {
    type: 'string',
  },
  lastSync: {
    type: 'number',
  },
  savedConfigs: {
    type: 'object',
  },
  lastOnboardingShown: {
    type: 'string',
  },
  deviceId: {
    type: 'number',
  },
  deviceUuid: {
    type: 'string',
  },
  backupList: {
    type: 'object',
  },
  clientId: {
    type: 'string',
  },
  preferedLanguage: {
    type: 'string',
  },
  preferedTheme: {
    type: 'string',
  },
  virtualdriveWindowsLetter: {
    type: 'string',
  },
  dataIntegrityMaintenance: {
    type: 'boolean',
  },
} as const;

const configStore = new Store({ schema, defaults });

export default configStore;
