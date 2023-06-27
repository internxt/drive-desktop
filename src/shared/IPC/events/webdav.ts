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
  WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY: () => void;
  WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR: (err: Error) => void;
  WEBDAV_VIRTUAL_DRIVE_UNMOUNT_ERROR: (err: Error) => void;
};

type UploadInfo = {
  elapsedTime: number | undefined;
};

export type WebdavFlowEvents = {
  WEBDAV_FILE_UPLOADED: (payload: {
    name: string;
    size: number;
    type: string;
    uploadInfo: UploadInfo;
  }) => void;
  WEBDAV_FILE_UPLOAD_PROGRESS: (payload: {
    name: string;
    progess: number;
    uploadInfo: UploadInfo;
  }) => void;
  WEBDAV_FILE_DOWNLOADED: (payload: {
    name: string;
    size: number;
    type: string;
    uploadInfo: UploadInfo;
  }) => void;
  WEBDAV_FILE_DELETED: (payload: {
    name: string;
    size: number;
    type: string;
  }) => void;
  WEBDAV_FILE_RENAMED: (payload: { name: string; oldName: string }) => void;
  WEBDAV_FILE_MOVED: (payload: { name: string; folderName: string }) => void;
  WEBDAV_FILE_OVERWRITED: (payload: { name: string }) => void;
  WEBDAV_FILE_CLONNED: (payload: {
    name: string;
    size: number;
    type: string;
    uploadInfo: UploadInfo;
  }) => void;
};

export type WebdavFlowEventsErrors = {
  WEBDAV_FILE_UPLOADED_ERROR: (payload: {
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
};
