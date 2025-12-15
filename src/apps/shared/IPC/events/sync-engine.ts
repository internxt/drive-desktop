import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type FileAction = { path: AbsolutePath };
type FileProgress = FileAction & { progress: number };

type FilesEvents = {
  FILE_DOWNLOADING: (payload: FileProgress) => void;
  FILE_DOWNLOADED: (payload: FileAction) => void;
  FILE_DOWNLOAD_CANCEL: (payload: FileAction) => void;
  FILE_DOWNLOAD_ERROR: (payload: FileAction) => void;
};

type SyncEngineInvocableFunctions = {
  USER_LOGGED_OUT: () => void;
};

export type FromProcess = FilesEvents & SyncEngineInvocableFunctions;
export type FromMain = {};
