import { Service } from 'diod';
import { RemoteTree } from '../domain/RemoteTree';
import { Traverser } from './Traverser';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';

type TProps = {
  rootFolderId: number;
  rootFolderUuid: string;
};

@Service()
export class RemoteTreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser,
  ) {}

  async run({ rootFolderId, rootFolderUuid }: TProps): Promise<RemoteTree> {
    const items = await this.remoteItemsGenerator.getAllItemsByFolderUuid(rootFolderUuid);

    return this.traverser.run({ rootFolderId, rootFolderUuid, items });
  }
}
