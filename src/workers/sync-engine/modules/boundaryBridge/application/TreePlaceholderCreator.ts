import { LocalFileSystem } from '../../files/domain/file-systems/LocalFileSystem';
import { TreeBuilder } from '../../items/application/TreeBuilder';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';

export class TreePlaceholderCreator {
  constructor(
    private readonly treeBuilder: TreeBuilder,
    private readonly placeholderCreator: PlaceholderCreator,
    private readonly fileLocalFileSystem: LocalFileSystem
  ) {}

  async run(): Promise<void> {
    const tree = await this.treeBuilder.run();

    tree.folders.forEach((folder) => {
      this.placeholderCreator.folder(folder);
    });

    // TODO: move this to bindings load
    tree.files.forEach((file) => {
      return this.fileLocalFileSystem.createPlaceHolder(file);
    });
  }
}
