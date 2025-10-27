import { User } from '@/apps/main/types';
import { AppStore } from './app-store.interface';

export const defaults: AppStore = {
  newToken: '',
  newTokenEncrypted: false,
  userData: {} as User,
  mnemonic: '',
  backupsEnabled: false,
  backupInterval: 86_400_000, // 24h
  lastBackup: -1,
  syncRoot: '',
  savedConfigs: {},
  lastOnboardingShown: '',
  deviceUuid: '',
  backupList: {},
  preferedLanguage: 'en',
  preferedTheme: 'system',
};
