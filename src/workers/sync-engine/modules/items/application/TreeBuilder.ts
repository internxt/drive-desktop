import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { RemoteItemsGenerator } from './RemoteItemsGenerator';
import { Traverser } from './Traverser';

export class TreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser
  ) {}

  async run(): Promise<Array<File | Folder>> {
    const items = await this.remoteItemsGenerator.getAll();

    return Object.values(this.traverser.run(items));
  }
}
