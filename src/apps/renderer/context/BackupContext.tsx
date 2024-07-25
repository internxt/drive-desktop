import { createContext, ReactNode} from 'react';
import { LastBackupContextProps, useLastBackup } from '../hooks/backups/useLastBackup';
import { BackupContextProps, useBackups } from '../hooks/backups/useBackups';


type BackupContext = LastBackupContextProps & BackupContextProps;

export const BackupContext = createContext<BackupContext>({} as BackupContext);

export function BackupProvider({ children }: { children: ReactNode }) {
  const lastBackup = useLastBackup();
  const backupsManager = useBackups();

  return (
    <BackupContext.Provider value={{...lastBackup, ...backupsManager}}>
      {children}
    </BackupContext.Provider>
  );
}
