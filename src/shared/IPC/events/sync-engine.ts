import { DriveFile } from 'main/database/entities/DriveFile';
import { DriveFolder } from 'main/database/entities/DriveFolder';

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
  CREATING_FOLDER: (payload: { name: string }) => void;
  FOLDER_CREATED: (payload: { name: string }) => void;

  RENAMING_FOLDER: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAMED: (payload: { oldName: string; newName: string }) => void;
};

export type FilesEvents = {
  UPLOADING_FILE: (payload: FileUpdatePayload) => void;
  FILE_UPLOADED: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  DOWNLOADING_FILE: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOADED: (payload: FileUpdatePayload) => void;
  FILE_UPLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) => void;

  DELETING_FILE: (payload: {
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

  RENAMING_FILE: (payload: {
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

export type FromProcess = FilesEvents &
  FolderEvents &
  SyncEngineInvocableFunctions;
export type FromMain = {
  [key: string]: (...args: Array<any>) => any;
};
