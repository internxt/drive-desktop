import type { Issue } from '../background-processes/issues';
import type { RemoteSyncStatus } from '../remote-sync/helpers';
import type { BackupsStatus } from '../background-processes/backups/BackupsProcessStatus/BackupsStatus';
import type { BackupsProgress } from '../background-processes/backups/types/BackupsProgress';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ThemeData } from '@/apps/shared/types/Theme';

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
      | 'MOVE_ERROR'
      | 'MOVED'
      | 'UPLOAD_ERROR'
      | 'UPLOADED'
      | 'UPLOADING';
    name: string;
    key: FileUuid | AbsolutePath;
    progress?: number;
  };
};

export type BroadcastToWidget = SyncInfoUpdateEvent | { name: 'remote-sync-status-change'; data: RemoteSyncStatus };

export type BroadcastToWindows =
  | { name: 'preferedLanguage-updated'; data: string }
  | { name: 'preferedTheme-updated'; data: ThemeData }
  | { name: 'issues-changed'; data: Issue[] }
  | { name: 'backups-status-changed'; data: BackupsStatus }
  | { name: 'backup-download-progress'; data: { id: string; progress: number } }
  | { name: 'backup-progress'; data: BackupsProgress };
