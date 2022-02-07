import { useEffect, useState } from 'react';
import { BackupFatalError } from '../../main/background-processes/backups';

export default function useBackupFatalErrors() {
  const [errors, setErrors] = useState<BackupFatalError[]>([]);

  useEffect(() => {
    window.electron.getBackupFatalErrors().then(setErrors);
    const removeListener =
      window.electron.onBackupFatalErrorsChanged(setErrors);
    return removeListener;
  }, []);

  return errors;
}
