import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type SyncStateItem = {
  action:
    | 'DELETE_ERROR'
    | 'DELETED'
    | 'DOWNLOAD_CANCEL'
    | 'DOWNLOAD_ERROR'
    | 'DOWNLOADED'
    | 'DOWNLOADING'
    | 'MOVE_ERROR'
    | 'MOVED'
    | 'UPLOAD_ERROR'
    | 'UPLOADED'
    | 'UPLOADING';
  path: AbsolutePath;
  progress?: number;
};

export type ExtendedSyncStateItem = SyncStateItem & { time: number; timeout: NodeJS.Timeout };

export const PRIORITIES: Record<SyncStateItem['action'], number> = {
  DELETE_ERROR: 1,
  MOVE_ERROR: 1,
  UPLOAD_ERROR: 2,
  DOWNLOAD_ERROR: 2,
  DELETED: 3,
  MOVED: 3,
  DOWNLOAD_CANCEL: 4,
  UPLOADED: 5,
  DOWNLOADED: 5,
  DOWNLOADING: 6,
  UPLOADING: 6,
};
