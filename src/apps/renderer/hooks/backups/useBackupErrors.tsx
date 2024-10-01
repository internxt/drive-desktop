import { useEffect, useState } from 'react';
import { BackupErrorsCollection } from '../../../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';

export default function useBackupErrors() {
  const [errors, setErrors] = useState<BackupErrorsCollection>([]);

  useEffect(() => {
    window.electron.getBackupFatalErrors().then(setErrors);

    const removeListener =
      window.electron.onBackupFatalErrorsChanged(setErrors);

    return removeListener;
  }, []);

  return { backupErrors: errors };
}
