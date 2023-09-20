import { VirtualDriveIpc } from '../../../ipc';
import { HttpFileRepository } from '../infrastructure/HttpFileRepository';

export class LocalRepositoryRepositoryRefresher {
  constructor(
    private readonly ipc: VirtualDriveIpc,
    private readonly repository: HttpFileRepository
  ) {}

  async run() {
    await this.ipc.invoke('START_REMOTE_SYNC');
    await this.repository.init();
  }
}
