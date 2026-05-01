import { createContext, ReactNode, useEffect } from 'react';
import { BackupDownloadContextProps, useBackupDownloadProgress } from '../hooks/backups/useBackupDownloadProgress';
import { BackupContextProps, useBackups } from '../hooks/backups/useBackups';
import { BackupStatusContextProps, useBackupStatus } from '../hooks/backups/useBackupsStatus';
import { LastBackupContextProps, useLastBackup } from '../hooks/backups/useLastBackup';

type BackupContext = LastBackupContextProps & BackupContextProps & BackupStatusContextProps & BackupDownloadContextProps;

export const BackupContext = createContext<BackupContext>({} as BackupContext);

type Props = { children: ReactNode };

export function BackupProvider({ children }: Props) {
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
      }}>
      {children}
    </BackupContext.Provider>
  );
}
