import Store, { Schema } from 'electron-store';
import { User } from './types';
/**
 * Global user config file
 */

interface ConfigStore {
  limit: number;
  usage: number;
  autoLaunch: boolean;
  bearerToken: string;
  userData: User;
  mnemonic: string;
  backupsEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  lastSavedListing: string;
  lastSync: number;
  savedConfigs: Record<
    string,
    Pick<
      ConfigStore,
      | 'backupsEnabled'
      | 'backupInterval'
      | 'lastBackup'
      | 'syncRoot'
      | 'lastSavedListing'
      | 'lastSync'
    >
  >;
  lastOnboardingShown: string;
}

const schema: Schema<ConfigStore> = {
  limit: {
    type: 'number',
    default: -1,
  },
  usage: {
    type: 'number',
    default: -1,
  },
  autoLaunch: {
    type: 'boolean',
    default: true,
  },
  bearerToken: {
    type: 'string',
    default: '',
  },
  userData: {
    type: 'object',
    default: {},
  },
  mnemonic: {
    type: 'string',
    default: '',
  },
  backupsEnabled: {
    type: 'boolean',
    default: false,
  },
  backupInterval: {
    type: 'number',
    default: 24 * 3600 * 1000,
  },
  lastBackup: {
    type: 'number',
    default: -1,
  },
  syncRoot: {
    type: 'string',
    default: '',
  },
  lastSavedListing: {
    type: 'string',
    default: '',
  },
  lastSync: {
    type: 'number',
    default: -1,
  },
  savedConfigs: {
    type: 'object',
    default: {},
  },
  lastOnboardingShown: {
    type: 'string',
    default: '',
  },
} as const;

const configStore = new Store({ schema });

export default configStore;
