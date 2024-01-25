import { DriveFile } from '../../../main/database/entities/DriveFile';
import { DriveFolder } from '../../../main/database/entities/DriveFolder';
import { ProcessInfoUpdatePayload } from '../../types';

const trackedEvents = [
  'delete',
  'upload',
  'download',
  'preview',
  'move',
  'rename',
] as const;
export type TrackedEvents = Capitalize<(typeof trackedEvents)[number]>;

const trackedEventsActions = [
  'started',
  'completed',
  'aborted',
  'error',
] as const;
type TrackedProviderActions = Capitalize<(typeof trackedEventsActions)[number]>;

export type TrackedActions = `${TrackedEvents} ${TrackedProviderActions}`;

export type ErrorContext = {
  action: TrackedEvents;
  itemType: 'File' | 'Folder';
  from: string;
  root: string;
};

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

export type FolderEvents = {
  FOLDER_CREATING: (payload: { name: string }) => void;
  FOLDER_CREATED: (payload: { name: string }) => void;
  FOLDER_CREATION_ERROR: (payload: { name: string; error: string }) => void;

  FOLDER_RENAMING: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAMED: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAME_ERROR: (payload: {
    oldName: string;
    newName: string;
    error: string;
  }) => void;
};

export type FilesEvents = {
  FILE_UPLOADING: (payload: FileUpdatePayload) => void;
  FILE_UPLOADED: (payload: FileUpdatePayload) => void;
  FILE_CREATED: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
  }) => void;
  FILE_DOWNLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  FILE_DOWNLOADING: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOADED: (payload: FileUpdatePayload) => void;
  FILE_UPLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  FILE_DELETING: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    size: number;
  }) => void;
  FILE_DELETED: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    size: number;
  }) => void;
  FILE_DELETION_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  FILE_RENAMING: (payload: {
    nameWithExtension: string;
    oldName: string;
  }) => void;
  FILE_RENAMED: (payload: {
    nameWithExtension: string;
    oldName: string;
  }) => void;
  FILE_MOVED: (payload: {
    nameWithExtension: string;
    folderName: string;
  }) => void;
  FILE_RENAME_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  FILE_OVERWRITTEN: (payload: { nameWithExtension: string }) => void;

  FILE_CLONED: (payload: FileUpdatePayload) => void;
};

export type SyncEngineInvocableFunctions = {
  GET_UPDATED_REMOTE_ITEMS: () => Promise<{
    files: DriveFile[];
    folders: DriveFolder[];
  }>;
  START_REMOTE_SYNC: () => Promise<void>;
};

// TODO: change how errors are reported to the ui
export type ProcessInfoUpdate = {
  SYNC_INFO_UPDATE: (payload: ProcessInfoUpdatePayload) => void;
  SYNC_PROBLEM: (payload: {
    key: string;
    additionalData: Record<string, any>;
  }) => void;
};

export type FromProcess = FilesEvents &
  FolderEvents &
  SyncEngineInvocableFunctions &
  ProcessInfoUpdate;

export type FromMain = {
  [key: string]: (...args: Array<any>) => any;
};
