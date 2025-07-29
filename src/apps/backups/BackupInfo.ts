import { BackupsIssue } from '@internxt/drive-desktop-core/build/backend';

export type BackupInfo = {
  folderUuid: string;
  folderId: number;
  tmpPath: string;
  backupsBucket: string;
  pathname: string;
  plainName: string;
};

export type BackupsContext = BackupInfo & {
  abortController: AbortController;
  addIssue: (issue: Omit<BackupsIssue, 'tab' | 'folderUuid'>) => void;
};
