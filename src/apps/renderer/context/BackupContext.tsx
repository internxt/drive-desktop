import { createContext, ReactNode} from 'react';
import { useLastBackup } from '../hooks/backups/useLastBackup';
import { WorkerExitCause } from '../../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';


interface BackupContextProps {
  lastBackupTimestamp: number | undefined;
  lastExistReason: WorkerExitCause | undefined;
  fromNow: () => string;
  lastBackupHadIssues: boolean;
}

export const BackupContext = createContext<BackupContextProps>({
  lastBackupTimestamp: undefined,
  lastExistReason: undefined,
  fromNow: () => '',
  lastBackupHadIssues: false,
});

export function BackupProvider({ children }: { children: ReactNode }) {
  const lastBackup = useLastBackup();

  return (
    <BackupContext.Provider value={lastBackup}>
      {children}
    </BackupContext.Provider>
  );
}
