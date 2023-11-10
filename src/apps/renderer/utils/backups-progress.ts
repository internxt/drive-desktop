import { BackupProgress } from '../../main/background-processes/backups';

export function getPercentualProgress(progress: BackupProgress) {
  const partialProgress = progress.totalItems
    ? progress.completedItems! / progress.totalItems
    : 0;
  const totalProgress =
    (progress.currentFolder - 1 + partialProgress) / progress.totalFolders;

  return totalProgress * 100;
}
