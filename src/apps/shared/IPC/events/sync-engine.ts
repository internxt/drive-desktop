import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';
import { DriveFile } from '../../../main/database/entities/DriveFile';
import { DriveFolder } from '../../../main/database/entities/DriveFolder';
import { GeneralIssue, SyncIssue } from '@/apps/main/background-processes/issues';

type FileInfo = {
  nameWithExtension: string;
};

type FileUpdatePayload = {
  nameWithExtension: string;
  progress: number;
};

type FilesEvents = {
  FILE_UPLOADING: (payload: FileUpdatePayload) => void;
  FILE_UPLOADED: (payload: FileInfo) => void;
  FILE_UPLOAD_ERROR: (payload: FileInfo) => void;

  FILE_DOWNLOADING: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOADED: (payload: FileInfo) => void;
  FILE_DOWNLOAD_CANCEL: (payload: FileInfo) => void;
  FILE_DOWNLOAD_ERROR: (payload: FileInfo) => void;

  FILE_DELETING: (payload: FileInfo) => void;
  FILE_DELETED: (payload: FileInfo) => void;
  FILE_DELETION_ERROR: (payload: FileInfo) => void;

  FILE_RENAMING: (payload: { nameWithExtension: string; oldName: string }) => void;
  FILE_RENAMED: (payload: { nameWithExtension: string; oldName: string }) => void;
  FILE_RENAME_ERROR: (payload: FileInfo) => void;

  FILE_CREATED: (payload: {
    bucket: string;
    name: string;
    extension: string;
    nameWithExtension: string;
    fileId: number;
    path: string;
  }) => void;
  FILE_OVERWRITTEN: (payload: FileInfo) => void;
  FILE_CLONED: (payload: FileInfo) => void;
  FILE_MOVED: (payload: { nameWithExtension: string; folderName: string }) => void;
};

type SyncEngineInvocableFunctions = {
  GET_UPDATED_REMOTE_ITEMS: (workspaceId: string) => Promise<{ files: DriveFile[]; folders: DriveFolder[] }>;
  GET_HEADERS: () => Promise<Record<string, string>>;
  USER_IS_UNAUTHORIZED: () => void;
};

type ProcessInfoUpdate = {
  ADD_SYNC_ISSUE: (payload: Omit<SyncIssue, 'tab'>) => void;
  ADD_GENERAL_ISSUE: (payload: Omit<GeneralIssue, 'tab'>) => void;
  CHANGE_SYNC_STATUS: (workspaceId: string, status: RemoteSyncStatus) => void;
  FIND_DANGLED_FILES: () => Promise<DriveFile[]>;
  SET_HEALTHY_FILES: (ids: string[]) => Promise<void>;
};

export type FromProcess = FilesEvents & SyncEngineInvocableFunctions & ProcessInfoUpdate;
export type FromMain = {};
