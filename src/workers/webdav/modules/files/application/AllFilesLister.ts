import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';
import { Traverser } from '../../items/application/Traverser';
import { File } from '../domain/File';

export class AllFilesLister {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser
  ) {}

  async run(): Promise<Array<File>> {
    const items = await this.remoteItemsGenerator.getAll();

    const indexed = this.traverser.run(items);

    return Object.entries(indexed)
      .filter(([_, item]) => item.isFile())
      .map(([_, file]) => file) as Array<File>;
  }
}
