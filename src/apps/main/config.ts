import Store, { Schema } from 'electron-store';
import * as uuid from 'uuid';

import { User } from './types';

// Fields to persist between user sessions
export const fieldsToSave = [
  'lastOnboardingShown',
  'backupsEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'lastSavedListing',
  'lastSync',
  'deviceId',
  'backupList',
  'nautilusExtensionVersion',
  'discoveredBackup',
  'shouldFixDanglingFiles'
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
  logEnginePath: string;
  lastSavedListing: string;
  lastSync: number;
  savedConfigs: Record<string, Pick<AppStore, (typeof fieldsToSave)[number]>>;
  lastOnboardingShown: string;
  deviceId: number;
  backupList: Record<string, { enabled: boolean; folderId: number }>;
  clientId: string;
  preferedLanguage?: string;
  preferedTheme?: string;
  virtualdriveWindowsLetter: string;
  nautilusExtensionVersion: number;
  discoveredBackup: number;
  shouldFixDanglingFiles: boolean;
  storageMigrationDate: string
  fixDeploymentDate: string
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
  logEnginePath: {
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
  nautilusExtensionVersion: { type: 'number' },
  discoveredBackup: { type: 'number' },
  shouldFixDanglingFiles: { type: 'boolean' },
  storageMigrationDate: { type: 'string' },
  fixDeploymentDate: { type: 'string' },
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
  logEnginePath: '',
  lastSavedListing: '',
  lastSync: -1,
  savedConfigs: {},
  lastOnboardingShown: '',
  deviceId: -1,
  backupList: {},
  clientId: uuid.v4(),
  preferedLanguage: '',
  preferedTheme: 'system',
  virtualdriveWindowsLetter: 'I',
  nautilusExtensionVersion: 0,
  discoveredBackup: 0,
  shouldFixDanglingFiles: true,
  storageMigrationDate: '2025-02-19T12:00:00Z',
  fixDeploymentDate: '2025-03-04T15:30:00Z',
};

const configStore = new Store({ schema, defaults });

export default configStore;
