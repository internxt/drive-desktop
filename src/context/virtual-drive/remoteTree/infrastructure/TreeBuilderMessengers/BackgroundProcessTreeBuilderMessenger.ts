import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { TreeBuilderMessenger } from '../../domain/TreeBuilderMessenger';

export class BackgroundProcessTreeBuilderMessenger
  implements TreeBuilderMessenger
{
  constructor(private readonly ipc: SyncEngineIpc) {}

  async duplicatedNode(name: string): Promise<void> {
    this.ipc.send('TREE_BUILD_ERROR', {
      error: 'DUPLICATED_NODE',
      name,
    });
  }
}
