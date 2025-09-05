import { User } from '@/apps/main/types';
import { fieldsToSave } from './fields-to-save';

export interface AppStore {
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
