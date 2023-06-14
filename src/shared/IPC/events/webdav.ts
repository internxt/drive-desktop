import { Stopwatch } from '../../types/Stopwatch';

const trackedEvents = [
  'delete',
  'upload',
  'download',
  'preview',
  'move',
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
  WEBDAV_ACTION_ERROR: (err: Error, ctx: WebdavErrorContext) => void;
};

type UploadInfo = {
  elapsedTime: number | undefined;
};

type WebdavFlowEvents = {
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
  WEBDAV_FILE_MOVED: (payload: { name: string; folerName: string }) => void;
  WEBDAV_FILE_OVERWRITED: (payload: { name: string }) => void;
};

export type WebDavProcessEvents = WebdavServerEvents &
  WebdavVirtualDriveEvents &
  WebdavFlowEvents;

export type WebdavMainEvents = {
  STOP_WEBDAV_SERVER_PROCESS: () => void;
};
