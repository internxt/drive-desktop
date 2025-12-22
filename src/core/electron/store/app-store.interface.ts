import { User } from '@/apps/main/types';
import { ConfigTheme } from '@/apps/main/config/theme.types';
import { Language } from '@/apps/main/config/language.types';

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
  newTokenEncrypted: boolean;
  userData: User;
  mnemonic: string;

  savedConfigs: Record<string, SavedConfig>;
  lastOnboardingShown: string;
  preferedLanguage: Language;
  preferedTheme: ConfigTheme;
  'patch-executed-2-5-1': boolean;
  'migrations.v2-5-1-add-user-uuid-to-database': boolean;
  'migrations.v2-5-7-remove-antivirus-table': boolean;
  'migrations.v2-6-3-move-checkpoint-to-sqlite': boolean;
};
