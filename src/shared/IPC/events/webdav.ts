export type TrackedWebdavServerSuccefullEvents =
  | 'Delete'
  | 'Upload'
  | 'Download'
  | 'Preview';

export type TrackedWebdavServerErrorEvents =
  `${TrackedWebdavServerSuccefullEvents} Error`;

export type WebdavErrorContext = {
  action: TrackedWebdavServerSuccefullEvents;
  from: string;
  root: string;
};

export type WebDavProcessEvents = {
  WEBDAV_SERVER_START_SUCCESS: () => void;
  WEBDAV_SERVER_START_ERROR: (err: Error) => void;
  WEBDAV_SERVER_STOP_SUCCESS: () => void;
  WEBDAV_SERVER_STOP_ERROR: (err: Error) => void;
  WEBDAV_SERVER_ADDING_ROOT_FOLDER_ERROR: (err: Error) => void;
  WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY: () => void;
  WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR: (err: Error) => void;
  WEBDAV_ACTION_ERROR: (err: Error, ctx: WebdavErrorContext) => void;
};

export type WebdavMainEvents = {
  STOP_WEBDAV_SERVER_PROCESS: () => void;
};
