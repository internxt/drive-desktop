import { Service } from 'diod';
import { RemoteTree } from '../domain/RemoteTree';
import { Traverser } from './Traverser';
import Logger from 'electron-log';
import { IpcRemoteItemsGenerator } from '../infrastructure/IpcRemoteItemsGenerator';

@Service()
export class RemoteTreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: IpcRemoteItemsGenerator,
    private readonly traverser: Traverser,
  ) {}

  async run(rootFolderId: number, refresh = false): Promise<RemoteTree> {
    if (refresh) {
      Logger.debug('[REMOTE TREE BUILDER] Force refresh');
      await this.remoteItemsGenerator.forceRefresh(rootFolderId);
    }

    const items = await this.remoteItemsGenerator.getAllItemsByFolderId(rootFolderId);

    return this.traverser.run(rootFolderId, items);
  }
}
