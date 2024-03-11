import { SyncErrorCause } from '../../../../../../shared/issues/SyncErrorCause';

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

export type FileErrorEvents = {
  FILE_DOWNLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    cause: SyncErrorCause;
  }) => void;

  FILE_UPLOAD_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    cause: SyncErrorCause;
  }) => void;

  FILE_DELETION_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    cause: SyncErrorCause;
  }) => void;

  FILE_RENAME_ERROR: (payload: {
    name: string;
    extension: string;
    nameWithExtension: string;
    cause: SyncErrorCause;
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

  FILE_DOWNLOADING: (payload: FileUpdatePayload) => void;
  FILE_DOWNLOADED: (payload: FileUpdatePayload) => void;

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

  FILE_OVERWRITTEN: (payload: { nameWithExtension: string }) => void;

  FILE_CLONED: (payload: FileUpdatePayload) => void;
} & FileErrorEvents;
