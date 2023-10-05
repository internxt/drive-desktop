import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { TreeBuilder } from '../../items/application/TreeBuilder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';

type Items = { files: Array<File>; folders: Array<Folder> };

export class TreePlaceholderCreator {
  constructor(
    // TODO: fix the import from infra
    private readonly treeBuilder: TreeBuilder,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(): Promise<void> {
    const tree = await this.treeBuilder.run();

    const items = tree.reduce(
      (items, item) => {
        if (item.isFile()) {
          items.files.push(item);
        }

        if (item.isFolder()) {
          items.folders.push(item);
        }

        return items;
      },
      {
        files: [],
        folders: [],
      } as Items
    );

    items.folders.forEach((folder) => {
      this.placeholderCreator.folder(folder);
    });

    items.files.forEach((file) => {
      return this.placeholderCreator.file(file);
    });
  }
}
