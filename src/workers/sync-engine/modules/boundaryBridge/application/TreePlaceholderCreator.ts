import { FileClearer } from '../../files/application/FileClearer';
import { TreeBuilder } from '../../items/application/TreeBuilder';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';

export class TreePlaceholderCreator {
  constructor(
    // TODO: fix the import form infra
    private readonly treeBuilder: TreeBuilder,
    private readonly placeholderCreator: PlaceholderCreator,
    private readonly fileClearer: FileClearer,
  ) {}

  async run(): Promise<void> {
    await this.fileClearer.run();
    const tree = await this.treeBuilder.run();

    tree.forEach((item) => {
      if (item.isFile()) {
        return this.placeholderCreator.file(item);
      }

      this.placeholderCreator.folder(item);
    });
  }
}
