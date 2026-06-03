import { User } from '../../../apps/main/types';
import { AppStore } from './app-store.interface';
import { DEFAULT_LANGUAGE } from '../../../apps/shared/Locale/Language';

export const defaults: AppStore = {
  // Credentials
  newToken: '',
  newTokenEncrypted: false,
  mnemonic: '',
  mnemonicEncrypted: false,
  userData: {} as User,

  // Sync / backup
  backupsEnabled: false,
  backgroundScanEnabled: true,
  backupInterval: 86_400_000, // 24h
  lastBackup: -1,
  syncRoot: '',
  lastSavedListing: '',
  lastSync: -1,

  // Device
  deviceId: -1,
  deviceUUID: '',
  backupList: {},

  // Persistence
  savedConfigs: {},
  lastOnboardingShown: '',

  // UI preferences
  preferedLanguage: DEFAULT_LANGUAGE,
  preferedTheme: 'system',

  // Linux-specific: nautilus
  nautilusExtensionVersion: 0,
  discoveredBackup: 0,

  // Drive
  availableUserProducts: undefined,
  maxUploadFileSizeInBytes: 0,
};

export const fieldsToSave: Array<keyof AppStore> = [
  'lastOnboardingShown',
  'backupsEnabled',
  'backgroundScanEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'lastSavedListing',
  'lastSync',
  'deviceId',
  'deviceUUID',
  'backupList',
  'nautilusExtensionVersion',
  'discoveredBackup',
  'maxUploadFileSizeInBytes',
];
