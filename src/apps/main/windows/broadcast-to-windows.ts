import type { Issue } from '../background-processes/issues';
import type { RemoteSyncStatus } from '../remote-sync/helpers';
import type { BackupsStatus } from '../background-processes/backups/BackupsProcessStatus/BackupsStatus';
import type { BackupsProgress } from '../background-processes/backups/types/BackupsProgress';
import type { ThemeData } from '../config/theme.types';
import type { SyncStateItem } from '@/backend/features/local-sync/sync-state/defs';

export type BroadcastToWidget =
  | { name: 'sync-info-update'; data: SyncStateItem[] }
  | { name: 'remote-sync-status-change'; data: RemoteSyncStatus };

export type BackupDownloadProgress = { id: string; progress: number };

export type BroadcastToWindows =
  | { name: 'preferedLanguage-updated'; data: string }
  | { name: 'preferedTheme-updated'; data: ThemeData }
  | { name: 'issues-changed'; data: Issue[] }
  | { name: 'backups-status-changed'; data: BackupsStatus }
  | { name: 'backup-download-progress'; data: BackupDownloadProgress }
  | { name: 'backup-progress'; data: BackupsProgress };
