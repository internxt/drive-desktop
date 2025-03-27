import { Service } from 'diod';
import { RemoteTree } from '../domain/RemoteTree';
import { Traverser } from './Traverser';
import Logger from 'electron-log';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';

type TProps = {
  rootFolderId: number;
  rootFolderUuid: string;
  refresh: boolean;
};

@Service()
export class RemoteTreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser,
  ) {}

  async run({ rootFolderId, rootFolderUuid, refresh }: TProps): Promise<RemoteTree> {
    if (refresh) {
      Logger.debug('[REMOTE TREE BUILDER] Force refresh');
      await this.remoteItemsGenerator.forceRefresh(rootFolderUuid);
    }

    const items = await this.remoteItemsGenerator.getAllItemsByFolderUuid(rootFolderUuid);

    return this.traverser.run({ rootFolderId, rootFolderUuid, items });
  }
}
