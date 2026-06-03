import { User } from '../../../apps/main/types';
import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { Language } from '../../../apps/shared/Locale/Language';
import { ConfigTheme } from '../../../apps/shared/types/Theme';

type BackupList = Record<string, { enabled: boolean; folderId: number; folderUuid: string }>;
export type SavedConfig = {
  lastOnboardingShown: string;
  backupsEnabled: boolean;
  backgroundScanEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  lastSavedListing: string;
  lastSync: number;
  /** @deprecated use deviceUUID instead */
  deviceId: number;
  deviceUUID: string;
  backupList: BackupList;
  nautilusExtensionVersion: number;
  discoveredBackup: number;
  maxUploadFileSizeInBytes: number;
};

export type AppStore = {
  // Credentials
  newToken: string;
  newTokenEncrypted: boolean;
  mnemonic: string;
  mnemonicEncrypted: boolean;
  userData: User;

  // Sync / backup
  backupsEnabled: boolean;
  backgroundScanEnabled: boolean;
  backupInterval: number;
  lastBackup: number;
  syncRoot: string;
  lastSavedListing: string;
  lastSync: number;

  // Device
  /** @deprecated use deviceUUID instead */
  deviceId: number;
  deviceUUID: string;
  backupList: BackupList;

  // Persistence
  savedConfigs: Record<string, SavedConfig>;
  lastOnboardingShown: string;

  // UI preferences
  preferedLanguage: Language;
  preferedTheme: ConfigTheme;

  // Linux-specific: nautilus extension
  nautilusExtensionVersion: number;
  discoveredBackup: number;

  // Drive
  availableUserProducts?: UserAvailableProducts;
  maxUploadFileSizeInBytes: number;
};
