import { RemoteSyncStatus } from './helpers';
import { logger } from '../../shared/logger/logger';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { TWorkerConfig } from '../background-processes/sync-engine/store';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';
  totalFilesUnsynced: string[] = [];

  constructor(
    public readonly worker: TWorkerConfig,
    public readonly workspaceId?: string,
  ) {}

  changeStatus(newStatus: RemoteSyncStatus) {
    if (newStatus === this.status) return;

    logger.debug({
      msg: 'RemoteSyncManager change status',
      workspaceId: this.workspaceId,
      current: this.status,
      newStatus,
    });

    this.status = newStatus;

    broadcastSyncStatus();
  }
}
