import { useEffect, useState } from 'react';

import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';

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
