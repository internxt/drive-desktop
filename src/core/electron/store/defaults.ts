import { User } from '@/apps/main/types';
import { AppStore } from './app-store.interface';

export const defaults: AppStore = {
  backupsEnabled: false,
  backupInterval: 86_400_000, // 24h
  lastBackup: -1,
  syncRoot: '',
  deviceUuid: '',
  backupList: {},

  newToken: '',
  newTokenEncrypted: false,
  userData: {} as User,
  mnemonic: '',

  savedConfigs: {},
  lastOnboardingShown: '',
  preferedLanguage: 'en',
  preferedTheme: 'system',
};

export const fieldsToSave: Array<keyof AppStore> = [
  'backupsEnabled',
  'backupInterval',
  'lastBackup',
  'syncRoot',
  'deviceUuid',
  'backupList',
];

export const fieldsToReset: Array<keyof AppStore> = ['newToken', 'newTokenEncrypted', 'userData', 'mnemonic'];
