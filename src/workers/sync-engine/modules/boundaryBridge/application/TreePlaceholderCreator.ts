import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { ExistingItemsTraverser } from '../../items/application/ExistingItemsTraverser';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';

type Items = { files: Array<File>; folders: Array<Folder> };

export class TreePlaceholderCreator {
  constructor(
    private readonly traverser: ExistingItemsTraverser,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(): Promise<void> {
    const tree = await this.traverser.run();

    const array = Object.values(tree);

    const items = array.reduce(
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
