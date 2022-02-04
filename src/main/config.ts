import Store, { Schema } from 'electron-store';
import { User } from './types';

// Fields to persist between user sessions
export const fieldsToSave = [
  'backupsEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'lastSavedListing',
  'lastSync',
  'deviceId',
  'backupList',
] as const;

interface ConfigStore {
  bearerToken: string;
  userData: User;
  mnemonic: string;
  backupsEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  lastSavedListing: string;
  lastSync: number;
  savedConfigs: Record<string, Pick<ConfigStore, typeof fieldsToSave[number]>>;
  lastOnboardingShown: string;
  deviceId: number;
  backupList: Record<string, { enabled: boolean; folderId: number }>;
}

const schema: Schema<ConfigStore> = {
  bearerToken: {
    type: 'string',
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
  lastSavedListing: {
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
  backupList: {
    type: 'object',
  },
} as const;

export const defaults: ConfigStore = {
  bearerToken: '',
  userData: {} as User,
  mnemonic: '',
  backupsEnabled: false,
  backupInterval: 24 * 3600 * 1000,
  lastBackup: -1,
  syncRoot: '',
  lastSavedListing: '',
  lastSync: -1,
  savedConfigs: {},
  lastOnboardingShown: '',
  deviceId: -1,
  backupList: {},
};

const configStore = new Store({ schema, defaults });

export default configStore;
