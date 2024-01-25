import { RemoteItemsGenerator } from '../domain/RemoteItemsGenerator';
import { Tree } from '../domain/Tree';
import { Traverser } from './Traverser';

export class TreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser
  ) {}

  async run(): Promise<Tree> {
    const items = await this.remoteItemsGenerator.getAll();

    return this.traverser.run(items);
  }
}
