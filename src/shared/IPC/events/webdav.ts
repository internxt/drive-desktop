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
export type TrackedWebdavServerEvents = Capitalize<
  (typeof trackedEvents)[number]
>;

export type TrackedWebdavServerErrorEvents =
  `${TrackedWebdavServerEvents} Error`;

export type WebdavErrorContext = {
  action: TrackedWebdavServerEvents;
  itemType: 'File' | 'Folder';
  from: string;
  root: string;
};

type WebdavServerEvents = {
  WEBDAV_SERVER_START_SUCCESS: () => void;
  WEBDAV_SERVER_START_ERROR: (err: Error) => void;
  WEBDAV_SERVER_STOP_SUCCESS: () => void;
  WEBDAV_SERVER_STOP_ERROR: (err: Error) => void;
  WEBDAV_SERVER_ADDING_ROOT_FOLDER_ERROR: (err: Error) => void;
};

type WebdavVirtualDriveEvents = {
  WEBDAV_VIRTUAL_DRIVE_RETRYING_MOUNT: () => void;
  WEBDAV_VIRTUAL_DRIVE_STARTING: () => void;
  WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY: () => void;
  WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR: (err: Error) => void;
  WEBDAV_VIRTUAL_DRIVE_UNMOUNT_ERROR: (err: Error) => void;
};

type ProcessInfo = {
  elapsedTime: number | undefined;
};

export type WebdavFlowEvents = {
  WEBDAV_FILE_UPLOADING: (payload: {
    name: string;
    size: number;
    type: string;
    processInfo: ProcessInfo;
    progress?: number;
  }) => void;
  WEBDAV_FILE_UPLOADED: (payload: {
    name: string;
    size: number;
    type: string;
    processInfo: ProcessInfo;
  }) => void;
  WEBDAV_FILE_DOWNLOADING: (payload: {
    name: string;
    size: number;
    type: string;
    processInfo: ProcessInfo;
    progress?: number;
  }) => void;
  WEBDAV_FILE_DOWNLOADED: (payload: {
    name: string;
    size: number;
    type: string;
    processInfo: ProcessInfo;
  }) => void;
  WEBDAV_FILE_DELETED: (payload: {
    name: string;
    size: number;
    type: string;
  }) => void;
  WEBDAV_FILE_RENAMING: (payload: { name: string; oldName: string }) => void;
  WEBDAV_FILE_RENAMED: (payload: { name: string; oldName: string }) => void;
  WEBDAV_FILE_MOVED: (payload: { name: string; folderName: string }) => void;
  WEBDAV_FILE_OVERWRITED: (payload: { name: string }) => void;
  WEBDAV_FILE_CLONNED: (payload: {
    name: string;
    size: number;
    type: string;
    processInfo: ProcessInfo;
  }) => void;
};

export type WebdavFlowEventsErrors = {
  WEBDAV_FILE_UPLOAD_ERROR: (payload: {
    name: string;
    error: string;
  }) => void;
  WEBDAV_FILE_DOWNLOAD_ERROR: (payload: {
    name: string;
    error: string;
  }) => void;
  WEBDAV_FILE_DELETE_ERROR: (payload: {
    name: string;
    error: string;
  }) => void;
  WEBDAV_FILE_RENAME_ERROR: (payload: {
    name: string;
    error: string;
  }) => void;
  WEBDAV_ACTION_ERROR: (err: Error, ctx: WebdavErrorContext) => void;
};

export type WebdavInvokableFunctions = {
  GET_UPDATED_REMOTE_ITEMS: () => Promise<{
    files: DriveFile[];
    folders: DriveFolder[];
  }>;
  START_REMOTE_SYNC: () => Promise<void>;
};

export type WebDavProcessEvents = WebdavServerEvents &
  WebdavVirtualDriveEvents &
  WebdavFlowEvents &
  WebdavFlowEventsErrors &
  WebdavInvokableFunctions;

export type WebdavMainEvents = {
  STOP_WEBDAV_SERVER_PROCESS: () => void;
  RETRY_VIRTUAL_DRIVE_MOUNT: () => void;
};
