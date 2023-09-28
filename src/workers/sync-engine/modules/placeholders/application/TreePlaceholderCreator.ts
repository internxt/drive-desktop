import { TreeBuilder } from '../../items/application/TreeBuilder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';

export class TreePlaceholderCreator {
  constructor(
    // TODO: fix the import form infra
    private readonly treeBuilder: TreeBuilder,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(): Promise<void> {
    const tree = await this.treeBuilder.run();

    tree.forEach((item) => {
      if (item.isFile()) {
        return this.placeholderCreator.file(item);
      }

      this.placeholderCreator.folder(item);
    });
  }
}
