import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import Bottleneck from 'bottleneck';
import { BackupsIssue } from '../main/background-processes/issues';
import { CONTEXT_KINDS, CommonContext } from '../sync-engine/config';

export type BackupInfo = {
  folderUuid: string;
  folderId: number;
  pathname: AbsolutePath;
  plainName: string;
};

export type BackupsContext = CommonContext &
  BackupInfo & {
    readonly kind: typeof CONTEXT_KINDS.BACKUPS;
    addIssue: (issue: Omit<BackupsIssue, 'tab' | 'folderUuid'>) => void;
    backupsBottleneck: Bottleneck;
  };
