import { createContext, ReactNode, useEffect } from 'react';
import {
  LastBackupContextProps,
  useLastBackup,
} from '../hooks/backups/useLastBackup';
import { BackupContextProps, useBackups } from '../hooks/backups/useBackups';
import {
  BackupStatusContextProps,
  useBackupStatus,
} from '../hooks/backups/useBackupsStatus';
import {
  BackupDownloadContextProps,
  useBackupDownloadProgress,
} from '../hooks/backups/useBackupDownloadProgress';

type BackupContext = LastBackupContextProps &
  BackupContextProps &
  BackupStatusContextProps &
  BackupDownloadContextProps;

export const BackupContext = createContext<BackupContext>({} as BackupContext);

export function BackupProvider({ children }: { children: ReactNode }) {
  const lastBackup = useLastBackup();
  const backupsManager = useBackups();
  const backupStatus = useBackupStatus();
  const backupDownloadManager = useBackupDownloadProgress();

  useEffect(() => {
    lastBackup.refreshLastBackupTimestamp();
  }, [backupStatus.backupStatus]);

  return (
    <BackupContext.Provider
      value={{
        ...lastBackup,
        ...backupsManager,
        ...backupStatus,
        ...backupDownloadManager,
      }}
    >
      {children}
    </BackupContext.Provider>
  );
}
