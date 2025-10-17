import { User } from '@/apps/main/types';
import { fieldsToSave } from './fields-to-save';
import { ConfigTheme } from '@/apps/shared/types/Theme';

export interface AppStore {
  newToken: string;
  newTokenEncrypted: boolean;
  userData: User;
  mnemonic: string;
  backupsEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  savedConfigs: Record<string, Pick<AppStore, (typeof fieldsToSave)[number]>>;
  lastOnboardingShown: string;
  deviceUuid: string;
  backupList: Record<string, { enabled: boolean; folderId: number; folderUuid: string }>;
  preferedLanguage?: string;
  preferedTheme?: ConfigTheme;
}
