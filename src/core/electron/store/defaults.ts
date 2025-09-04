import { User } from '@/apps/main/types';
import { AppStore } from './app-store.interface';
import * as uuid from 'uuid';

export const defaults: AppStore = {
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
