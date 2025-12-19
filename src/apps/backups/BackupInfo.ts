import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsIssue } from '../main/background-processes/issues';
import { CommonContext } from '../sync-engine/config';

export type BackupInfo = {
  folderUuid: string;
  folderId: number;
  pathname: AbsolutePath;
  plainName: string;
};

export type BackupsContext = CommonContext &
  BackupInfo & {
    workspaceId: '';
    workspaceToken: '';
    abortController: AbortController;
    addIssue: (issue: Omit<BackupsIssue, 'tab' | 'folderUuid'>) => void;
  };
