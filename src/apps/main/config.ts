import Store, { Schema } from 'electron-store';
import * as uuid from 'uuid';

import { User } from './types';

// Fields to persist between user sessions
export const fieldsToSave = [
  'backupsEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'lastSync',
  'deviceId',
  'deviceUuid',
  'backupList',
] as const;

export interface AppStore {
  bearerToken: string;
  bearerTokenEncrypted: boolean;
  newToken: string;
  newTokenEncrypted: boolean;
  userData: User;
  mnemonic: string;
  backupsEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  lastSync: number;
  savedConfigs: Record<string, Pick<AppStore, (typeof fieldsToSave)[number]>>;
  lastOnboardingShown: string;
  deviceId: number;
  deviceUuid: string;
  backupList: Record<string, { enabled: boolean; folderId: number; folderUuid: string }>;
  clientId: string;
  preferedLanguage?: string;
  preferedTheme?: string;
  virtualdriveWindowsLetter: string;
  dataIntegrityMaintenance?: boolean;
}

const schema: Schema<AppStore> = {
  bearerToken: {
    type: 'string',
  },
  bearerTokenEncrypted: {
    type: 'boolean',
  },
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

export const defaults: AppStore = {
  bearerToken: '',
  bearerTokenEncrypted: false,
  newToken: '',
  newTokenEncrypted: false,
  userData: {} as User,
  mnemonic: '',
  backupsEnabled: false,
  backupInterval: 86_400_000, // 24h
  lastBackup: -1,
  syncRoot: '',
  lastSync: -1,
  savedConfigs: {},
  lastOnboardingShown: '',
  deviceId: -1,
  deviceUuid: '',
  backupList: {},
  clientId: uuid.v4(),
  preferedLanguage: '',
  preferedTheme: 'system',
  virtualdriveWindowsLetter: 'I',
  dataIntegrityMaintenance: false,
};

const configStore = new Store({ schema, defaults });

export default configStore;
