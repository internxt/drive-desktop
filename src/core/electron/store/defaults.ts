import { DEFAULT_LANGUAGE } from '@/apps/main/config/language.types';
import { User } from '@/apps/main/types';
import { AppStore } from './app-store.interface';

export const defaults: AppStore = {
  backupInterval: 24 * 60 * 60 * 1000,
  lastBackup: -1,
  syncRoot: '',
  deviceUuid: '',
  backupList: {},

  newToken: '',
  userData: {} as User,

  savedConfigs: {},
  lastOnboardingShown: '',
  preferedLanguage: DEFAULT_LANGUAGE,
  preferedTheme: 'system',
};

export const fieldsToSave: Array<keyof AppStore> = ['backupInterval', 'lastBackup', 'syncRoot', 'deviceUuid', 'backupList'];
export const fieldsToReset: Array<keyof AppStore> = ['newToken', 'userData'];
