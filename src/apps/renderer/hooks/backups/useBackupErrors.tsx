import { useEffect, useState } from 'react';
import { BackupErrorRecord } from '../../../../backend/features/backup/backup.types';

export default function useBackupErrors() {
  const [errors, setErrors] = useState<BackupErrorRecord[]>([]);

  useEffect(() => {
    window.electron.getBackupFatalErrors().then(setErrors);

    const removeListener = window.electron.onBackupFatalErrorsChanged(setErrors);

    return removeListener;
  }, []);

  return { backupErrors: errors };
}
