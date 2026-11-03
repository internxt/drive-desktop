import { IndividualBackupProgress } from './IndividualBackupProgress';

export type BackupsProgress = {
  currentFolder: number;
  totalFolders: number;
  partial: IndividualBackupProgress | undefined;
};
