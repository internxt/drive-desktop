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
  discoveredBackup: false,
  preferedLanguage: 'en',
  preferedTheme: 'system',
  'patch-executed-2-5-1': false,
  'migrations.v2-5-1-add-user-uuid-to-database': false,
  'migrations.v2-5-6-move-checkpoint-to-lokijs': false,
  'migrations.v2-5-7-remove-antivirus-table': false,
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
