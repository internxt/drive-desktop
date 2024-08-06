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

type BackupContext = LastBackupContextProps &
  BackupContextProps &
  BackupStatusContextProps;

export const BackupContext = createContext<BackupContext>({} as BackupContext);

export function BackupProvider({ children }: { children: ReactNode }) {
  const lastBackup = useLastBackup();
  const backupsManager = useBackups();
  const backupStatus = useBackupStatus();

  useEffect(() => {
    lastBackup.refreshLastBackupTimestamp();
  }, [backupStatus.backupStatus]);

  return (
    <BackupContext.Provider
      value={{ ...lastBackup, ...backupsManager, ...backupStatus }}
    >
      {children}
    </BackupContext.Provider>
  );
}
