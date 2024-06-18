import { broadcastToWindows } from '../../../windows';
import { BackupsStatus } from './BackupsStatus';

export class BackupsProcessStatus {
  constructor(private status: BackupsStatus) {}

  set(status: BackupsStatus) {
    this.status = status;
    broadcastToWindows('backups-status-changed', status);
  }

  isIn(status: BackupsStatus): boolean {
    return this.status === status;
  }

  current(): BackupsStatus {
    return this.status;
  }
}
