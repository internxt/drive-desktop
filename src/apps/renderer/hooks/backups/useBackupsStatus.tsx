import { useEffect, useState } from 'react';
import { BackupsStatus } from '../../../main/background-processes/backups/BackupsProcessStatus/BackupsStatus';

export interface BackupStatusContextProps {
  backupStatus: BackupsStatus;
}

export function useBackupStatus() {
  const [backupStatus, setBackupStatus] = useState<BackupsStatus>('STANDBY');
  useEffect(() => {
    window.electron.getBackupsStatus().then(setBackupStatus);

    const removeListener = window.electron.onBackupsStatusChanged(setBackupStatus);
    return removeListener;
  }, []);

  return { backupStatus };
}
