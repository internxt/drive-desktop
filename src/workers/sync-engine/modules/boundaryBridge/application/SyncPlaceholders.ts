import { UpdatePlaceholderFile } from './UpdatePlaceholderFile';
import { UpdatePlaceholderFolder } from './UpdatePlaceholderFolder';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { TreeBuilder } from '../../items/application/TreeBuilder';
import { VirtualDrive } from 'virtual-drive/dist';
import { trimPlaceholderId } from '../../placeholders/domain/CommonPlaceholder';
import { FilePlaceholderIdPrefix } from '../../placeholders/domain/FilePlaceholderId';
import { FolderPlaceholderIdPrefix } from '../../placeholders/domain/FolderPlaceholderId';

export class SyncPlaceholders {
  constructor(
    private readonly treeBuilder: TreeBuilder,
    private readonly updatePlaceholderFile: UpdatePlaceholderFile,
    private readonly updatePlaceholderFolder: UpdatePlaceholderFolder,
    private readonly virtualDrive: VirtualDrive
  ) {}

  async run() {
    const tree = await this.treeBuilder.run();

    const listPlaceholdersIds = (await this.virtualDrive.getItemsIds()).map(id => trimPlaceholderId(id));

    const folders = Object.values(tree).filter((item) =>
      item.isFolder() && listPlaceholdersIds.includes(FolderPlaceholderIdPrefix + item.uuid)
    ) as Array<Folder>;

    const foldersActualization = folders.map((folder) => {
      this.updatePlaceholderFolder.run(folder);
    });

    await Promise.all(foldersActualization);

    const files = Object.values(tree).filter((item) =>
      item.isFile() && listPlaceholdersIds.includes(FilePlaceholderIdPrefix + item.contentsId)
    ) as Array<File>;

    const filesActualization = files.map((file) =>
      this.updatePlaceholderFile.run(file)
    );

    await Promise.all(filesActualization);
  }
}
