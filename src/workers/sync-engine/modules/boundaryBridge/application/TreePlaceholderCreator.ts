import { TreeBuilder } from '../../items/application/TreeBuilder';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';

export class TreePlaceholderCreator {
  constructor(
    private readonly treeBuilder: TreeBuilder,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(): Promise<void> {
    const tree = await this.treeBuilder.run();

    tree.folders.forEach((folder) => {
      this.placeholderCreator.folder(folder);
    });

    tree.files.forEach((file) => {
      return this.placeholderCreator.file(file);
    });
  }
}
