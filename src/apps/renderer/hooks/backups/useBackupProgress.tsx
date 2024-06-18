import { useEffect, useState } from 'react';
import { BackupsProgress } from '../../../main/background-processes/backups/types/BackupsProgress';
import { IndividualBackupProgress } from '../../../main/background-processes/backups/types/IndividualBackupProgress';

export function useBackupProgress() {
  const [backupProgress, setBackupProgress] = useState<null | BackupsProgress>(
    null
  );

  useEffect(() => {
    const removeListener = window.electron.onBackupProgress(setBackupProgress);

    return removeListener;
  }, []);

  function clearProgress() {
    setBackupProgress(null);
  }

  function calculatePartialProgress(
    individualProgress: IndividualBackupProgress | undefined
  ) {
    if (!individualProgress) {
      return 0;
    }

    if (individualProgress.total === 0) {
      return 0;
    }

    return individualProgress.processed / individualProgress.total;
  }

  function percentualProgress(): number {
    if (!backupProgress) {
      return 0;
    }

    const { currentFolder, totalFolders, partial } = backupProgress;

    const partialProgress = calculatePartialProgress(partial);

    const totalProgress = (currentFolder - 1 + partialProgress) / totalFolders;

    return totalProgress * 100;
  }

  function thereIsProgress(): boolean {
    return backupProgress !== null;
  }

  return { backupProgress, thereIsProgress, percentualProgress, clearProgress };
}
