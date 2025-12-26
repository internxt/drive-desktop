import { broadcastToWindows } from '../../../windows';
import { BackupsStatus } from './BackupsStatus';

export class BackupsProcessStatus {
  constructor(private status: BackupsStatus) {}

  set(status: BackupsStatus) {
    this.status = status;
    broadcastToWindows({ name: 'backups-status-changed', data: status });
  }

  isIn(status: BackupsStatus): boolean {
    return this.status === status;
  }

  current(): BackupsStatus {
    return this.status;
  }
}

export const status = new BackupsProcessStatus('STANDBY');
