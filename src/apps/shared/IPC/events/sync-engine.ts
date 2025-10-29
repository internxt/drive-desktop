import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';
import { DriveFile, FileUuid, SimpleDriveFile } from '../../../main/database/entities/DriveFile';
import { SimpleDriveFolder } from '../../../main/database/entities/DriveFolder';
import { GeneralIssue, SyncIssue } from '@/apps/main/background-processes/issues';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type BaseFile = { nameWithExtension: string };
type FileDownload = BaseFile & { key: FileUuid };
type FileUpload = BaseFile & { key: AbsolutePath };
type FileProgress = BaseFile & { progress: number };
type FileDownloading = FileProgress & FileDownload;
type FileUploading = FileProgress & FileUpload;

type FilesEvents = {
  FILE_UPLOADING: (payload: FileUploading) => void;
  FILE_UPLOADED: (payload: FileUpload) => void;
  FILE_UPLOAD_ERROR: (payload: FileUpload) => void;

  FILE_DOWNLOADING: (payload: FileDownloading) => void;
  FILE_DOWNLOADED: (payload: FileDownload) => void;
  FILE_DOWNLOAD_CANCEL: (payload: FileDownload) => void;
  FILE_DOWNLOAD_ERROR: (payload: FileDownload) => void;
};

type SyncEngineInvocableFunctions = {
  GET_UPDATED_REMOTE_ITEMS: ({
    userUuid,
    workspaceId,
  }: {
    userUuid: string;
    workspaceId: string;
  }) => Promise<{ files: SimpleDriveFile[]; folders: SimpleDriveFolder[] }>;
  GET_HEADERS: () => Promise<Record<string, string>>;
  USER_LOGGED_OUT: () => void;
  FIND_EXISTING_FILES: ({ userUuid, workspaceId }: { userUuid: string; workspaceId: string }) => Promise<SimpleDriveFile[]>;
};

type ProcessInfoUpdate = {
  ADD_SYNC_ISSUE: (payload: Omit<SyncIssue, 'tab'>) => void;
  ADD_GENERAL_ISSUE: (payload: Omit<GeneralIssue, 'tab'>) => void;
  CHANGE_SYNC_STATUS: (workspaceId: string, status: RemoteSyncStatus) => void;
  FIND_DANGLED_FILES: () => Promise<DriveFile[]>;
  SET_HEALTHY_FILES: (ids: string[]) => Promise<void>;
};

export type FromProcess = FilesEvents & SyncEngineInvocableFunctions & ProcessInfoUpdate;
export type FromMain = {
  UPDATE_SYNC_ENGINE_PROCESS: () => void;
  STOP_AND_CLEAR_SYNC_ENGINE_PROCESS: () => void;
};
