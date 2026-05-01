import { Language } from '@/apps/main/config/language.types';
import { ConfigTheme } from '@/apps/main/config/theme.types';
import { User } from '@/apps/main/types';

type BackupList = Record<string, { enabled: boolean; folderId: number; folderUuid: string }>;
export type SavedConfig = {
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  deviceUuid: string;
  backupList: BackupList;
};

export type AppStore = {
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  deviceUuid: string;
  backupList: BackupList;

  newToken: string;
  userData: User;

  savedConfigs: Record<string, SavedConfig>;
  lastOnboardingShown: string;
  preferedLanguage: Language;
  preferedTheme: ConfigTheme;
};
