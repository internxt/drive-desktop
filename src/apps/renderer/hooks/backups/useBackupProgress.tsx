import { useEffect, useState } from 'react';
import { BackupsProgress } from '../../../main/background-processes/backups/types/BackupsProgress';
import { IndividualBackupProgress } from '../../../main/background-processes/backups/types/IndividualBackupProgress';

export function useBackupProgress() {
  const [backupProgress, setBackupProgress] = useState<null | BackupsProgress>(null);
  const [thereIsProgress, setThereIsProgress] = useState<boolean>(false);
  const [percentualProgress, setPercentualProgress] = useState<number>(0);

  useEffect(() => {
    const removeListener = globalThis.window.electron.onBackupProgress(setBackupProgress);

    void globalThis.window.electron.getLastBackupProgress();

    return removeListener;
  }, []);

  useEffect(() => {
    if (backupProgress) {
      setPercentualProgress(calculatePercentualProgress(backupProgress));
      setThereIsProgress(true);
    } else {
      setPercentualProgress(0);
      setThereIsProgress(false);
    }
  }, [backupProgress]);

  function clearProgress() {
    setBackupProgress(null);
  }

  function calculatePartialProgress(individualProgress: IndividualBackupProgress | undefined) {
    if (!individualProgress) {
      return 0;
    }

    if (individualProgress.total === 0) {
      return 0;
    }

    return individualProgress.processed / individualProgress.total;
  }

  function calculatePercentualProgress(backupProgress: BackupsProgress): number {
    const { currentFolder, totalFolders, partial } = backupProgress;

    const partialProgress = calculatePartialProgress(partial);

    const totalProgress = (currentFolder - 1 + partialProgress) / totalFolders;

    return totalProgress * 100;
  }

  return { backupProgress, thereIsProgress, percentualProgress, clearProgress };
}
