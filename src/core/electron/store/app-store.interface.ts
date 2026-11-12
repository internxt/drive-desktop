import { Language } from '@/apps/main/config/language.types';
import { ConfigTheme } from '@/apps/main/config/theme.types';
import { User } from '@/apps/main/types';

/**
 * v2.7.3 Alexis Mora
 * `folderId` is only read by `migrateBackupFolderToUuids`.
 * New entries don't store it anymore.
 */
type BackupList = Record<string, { enabled: boolean; folderUuid: string; folderId?: number }>;
export type SavedConfig = {
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  deviceUuid: string;
  backupList: BackupList;
  maxUploadFileSizeInBytes: number;
  fileSizeLimitRevalidatedAt: number;
  mailBridgeCredentials: string;
  mailBridgeStartOnLogin: boolean;
};

export type AppStore = {
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  deviceUuid: string;
  backupList: BackupList;
  maxUploadFileSizeInBytes: number;
  fileSizeLimitRevalidatedAt: number;
  mailBridgeCredentials: string;
  mailBridgeStartOnLogin: boolean;

  newToken: string;
  userData: User;
  savedConfigs: Record<string, SavedConfig>;
  lastOnboardingShown: string;
  preferedLanguage: Language;
  preferedTheme: ConfigTheme;
};
