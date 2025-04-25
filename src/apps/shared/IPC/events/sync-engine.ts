import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';
import { DriveFile } from '../../../main/database/entities/DriveFile';
import { DriveFolder } from '../../../main/database/entities/DriveFolder';
import { ProcessInfoUpdatePayload } from '../../types';

type ProcessInfo = {
  elapsedTime: number;
  progress?: number;
};

type FileUpdatePayload = {
  name: string;
  extension: string;
  nameWithExtension: string;
  size: number;
  processInfo: ProcessInfo;
};

export type FilesEvents = {
  FILE_UPLOADING: (payload: FileUpdatePayload) => void;
  FILE_UPLOADED: (payload: FileUpdatePayload) => void;
  FILE_UPLOAD_ERROR: (payload: { name?: string; extension?: string; nameWithExtension: string; error: string }) => void;

  FILE_DOWNLOADING: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOADED: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOAD_CANCEL: (payload: Partial<FileUpdatePayload>) => void;
  FILE_DOWNLOAD_ERROR: (payload: { name: string; extension: string; nameWithExtension: string; error: string }) => void;

  FILE_DELETING: (payload: { name: string; extension: string; nameWithExtension: string; size: number }) => void;
  FILE_DELETED: (payload: { name: string; extension: string; nameWithExtension: string; size: number }) => void;
  FILE_DELETION_ERROR: (payload: { name: string; extension: string; nameWithExtension: string; error: string }) => void;

  FILE_RENAMING: (payload: { nameWithExtension: string; oldName: string }) => void;
  FILE_RENAMED: (payload: { nameWithExtension: string; oldName: string }) => void;
  FILE_RENAME_ERROR: (payload: { name: string; extension: string; nameWithExtension: string; error: string }) => void;

  FILE_CREATED: (payload: { name: string; extension: string; nameWithExtension: string; fileId: number; path: string }) => void;
  FILE_OVERWRITTEN: (payload: { nameWithExtension: string }) => void;
  FILE_CLONED: (payload: FileUpdatePayload) => void;
  FILE_MOVED: (payload: { nameWithExtension: string; folderName: string }) => void;
};

export type SyncEngineInvocableFunctions = {
  GET_UPDATED_REMOTE_ITEMS: (workspaceId: string) => Promise<{ files: DriveFile[]; folders: DriveFolder[] }>;
  GET_UPDATED_REMOTE_ITEMS_BY_FOLDER: (folderUuid: string, workspaceId: string) => Promise<{ files: DriveFile[]; folders: DriveFolder[] }>;
  FORCE_REFRESH_BACKUPS: (folderUuid: string) => Promise<void>;
  GET_HEADERS: () => Promise<Record<string, string>>;
  USER_IS_UNAUTHORIZED: () => void;
};

// TODO: change how errors are reported to the ui
export type ProcessInfoUpdate = {
  SYNC_INFO_UPDATE: (payload: ProcessInfoUpdatePayload) => void;
  SYNC_PROBLEM: (payload: { key: string; additionalData: Record<string, unknown> }) => void;
  CHANGE_SYNC_STATUS: (workspaceId: string, status: RemoteSyncStatus) => void;
};

export type FromProcess = FilesEvents & SyncEngineInvocableFunctions & ProcessInfoUpdate;

export type FromMain = {
  [key: string]: (...args: Array<unknown>) => unknown;
};
