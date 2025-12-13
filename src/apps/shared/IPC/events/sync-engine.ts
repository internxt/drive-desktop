import { SimpleDriveFile } from '../../../main/database/entities/DriveFile';
import { GeneralIssue, SyncIssue } from '@/apps/main/background-processes/issues';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type FileAction = { path: AbsolutePath };
type FileProgress = FileAction & { progress: number };

type FilesEvents = {
  FILE_UPLOADING: (payload: FileProgress) => void;
  FILE_UPLOADED: (payload: FileAction) => void;
  FILE_UPLOAD_ERROR: (payload: FileAction) => void;

  FILE_DOWNLOADING: (payload: FileProgress) => void;
  FILE_DOWNLOADED: (payload: FileAction) => void;
  FILE_DOWNLOAD_CANCEL: (payload: FileAction) => void;
  FILE_DOWNLOAD_ERROR: (payload: FileAction) => void;
};

type SyncEngineInvocableFunctions = {
  GET_HEADERS: () => Promise<Record<string, string>>;
  USER_LOGGED_OUT: () => void;
  FIND_EXISTING_FILES: ({ userUuid, workspaceId }: { userUuid: string; workspaceId: string }) => Promise<SimpleDriveFile[]>;
};

type ProcessInfoUpdate = {
  ADD_SYNC_ISSUE: (payload: Omit<SyncIssue, 'tab'>) => void;
  ADD_GENERAL_ISSUE: (payload: Omit<GeneralIssue, 'tab'>) => void;
};

export type FromProcess = FilesEvents & SyncEngineInvocableFunctions & ProcessInfoUpdate;
export type FromMain = {};
