import { User } from '@/apps/main/types';
import { AppStore } from './app-store.interface';
import { DEFAULT_LANGUAGE } from '@/apps/main/config/language.types';

export const defaults: AppStore = {
  backupInterval: 24 * 60 * 60 * 1000,
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
  preferedLanguage: DEFAULT_LANGUAGE,
  preferedTheme: 'system',
  'patch-executed-2-5-1': false,
  'migrations.v2-5-1-add-user-uuid-to-database': false,
  'migrations.v2-5-7-remove-antivirus-table': false,
  'migrations.v2-6-3-move-checkpoint-to-sqlite': false,
};

export const fieldsToSave: Array<keyof AppStore> = ['backupInterval', 'lastBackup', 'syncRoot', 'deviceUuid', 'backupList'];
export const fieldsToReset: Array<keyof AppStore> = ['newToken', 'newTokenEncrypted', 'userData', 'mnemonic'];
