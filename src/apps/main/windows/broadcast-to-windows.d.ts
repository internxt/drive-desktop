import type { Issue } from '../background-processes/issues';
import type { RemoteSyncStatus } from '../remote-sync/helpers';
import type { BackupsStatus } from '../background-processes/backups/BackupsProcessStatus/BackupsStatus';
import type { BackupsProgress } from '../background-processes/backups/types/BackupsProgress';

export type SyncInfoUpdateEvent = {
  name: 'sync-info-update';
  data: {
    action:
      | 'DELETE_ERROR'
      | 'DELETED'
      | 'DOWNLOAD_CANCEL'
      | 'DOWNLOAD_ERROR'
      | 'DOWNLOADED'
      | 'DOWNLOADING'
      | 'MOVED'
      | 'RENAME_ERROR'
      | 'RENAMED'
      | 'RENAMING'
      | 'UPLOAD_ERROR'
      | 'UPLOADED'
      | 'UPLOADING';
    name: string;
    progress?: number;
  };
};

export type BroadcastToWindows =
  | { name: 'preferedLanguage-updated'; data: string }
  | { name: 'preferedTheme-updated'; data: string }
  | { name: 'issues-changed'; data: Issue[] }
  | { name: 'remote-sync-status-change'; data: RemoteSyncStatus }
  | { name: 'backups-status-changed'; data: BackupsStatus }
  | { name: 'backup-download-progress'; data: { id: string; progress: number } }
  | { name: 'backup-progress'; data: BackupsProgress }
  | SyncInfoUpdateEvent;
