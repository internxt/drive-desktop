import { Service } from 'diod';
import { RemoteItemsGenerator } from '../domain/RemoteItemsGenerator';
import { RemoteTree } from '../domain/RemoteTree';
import { Traverser } from './Traverser';
import Logger from 'electron-log';

@Service()
export class RemoteTreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser
  ) {}

  async run(rootFolderId: number, refresh = false): Promise<RemoteTree> {
    if (refresh) {
      await this.remoteItemsGenerator.forceRefresh();
    }

    const items = await this.remoteItemsGenerator.getAll();

    // Logger.debug('[REMOTE TREE BUILDER] Items', items.files.length);

    // Logger.debug('[REMOTE TREE BUILDER] Items', items.files);

    // Logger.debug('[REMOTE TREE BUILDER] Items', items.folders.length);

    // Logger.debug('[REMOTE TREE BUILDER] Items', items.folders);

    return this.traverser.run(rootFolderId, items);
  }
}
