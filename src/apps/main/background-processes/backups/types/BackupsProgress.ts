import { IndividualBackupProgress } from './IndividualBackupProgress';

export interface BackupsProgress {
  currentFolder: number;
  totalFolders: number;
  partial: IndividualBackupProgress | undefined;
}
