import { BackupsIssue } from '../main/background-processes/issues';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

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
  fileUploader: EnvironmentFileUploader;
  addIssue: (issue: Omit<BackupsIssue, 'tab' | 'folderUuid'>) => void;
};
