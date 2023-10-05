import { SyncRemoteFile } from './SyncRemoteFile';
import { SyncRemoteFolder } from './SyncRemoteFolder';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { TreeBuilder } from '../../items/application/TreeBuilder';

export class SyncPlaceholders {
  constructor(
    private readonly treeBuilder: TreeBuilder,
    private readonly syncFileRemoteChanges: SyncRemoteFile,
    private readonly syncFolderRemoteChanges: SyncRemoteFolder
  ) {}

  async run() {
    const tree = await this.treeBuilder.run();

    const folders = Object.values(tree).filter((item) =>
      item.isFolder()
    ) as Array<Folder>;

    const foldersActualization = folders.map((folder) => {
      this.syncFolderRemoteChanges.run(folder);
    });

    await Promise.all(foldersActualization);

    const files = Object.values(tree).filter((item) =>
      item.isFile()
    ) as Array<File>;

    const filesActualization = files.map((file) =>
      this.syncFileRemoteChanges.run(file)
    );

    await Promise.all(filesActualization);
  }
}
