import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class LocalRepositoryRepositoryRefresher {
  constructor(
    private readonly ipc: SyncEngineIpc,
    private readonly repository: InMemoryFileRepository
  ) {}

  async run() {
    await this.ipc.invoke('START_REMOTE_SYNC');
    await this.repository.init();
  }
}
