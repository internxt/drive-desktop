import { Service } from 'diod';
import { FilesByPartialSearcher } from '../../../../virtual-drive/files/application/search/FilesByPartialSearcher';
import { SingleFolderMatchingFinder } from '../../../../virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FoldersSearcherByPartial } from '../../../../virtual-drive/folders/application/search/FoldersSearcherByPartial';
import { FolderStatuses } from '../../../../virtual-drive/folders/domain/FolderStatus';
import { Folder } from '../../../../virtual-drive/folders/domain/Folder';
import { StorageFileDeleter } from '../../../StorageFiles/application/delete/StorageFileDeleter';

@Service()
export class StorageFolderDeleter {
  constructor(
    private readonly storageFileDeleter: StorageFileDeleter,
    private readonly singleFolderFinder: SingleFolderMatchingFinder,
    private readonly filesByPartialSearcher: FilesByPartialSearcher,
    private readonly foldersSearcherByPartial: FoldersSearcherByPartial
  ) {}

  private async deleteFilesOn(folder: Folder): Promise<void> {
    const files = await this.filesByPartialSearcher.run({
      folderId: folder.id,
    });

    const filesDeletion = files.map(({ path }) =>
      this.storageFileDeleter.run(path)
    );

    await Promise.all(filesDeletion);
  }

  private async deleteSubfolders(folder: Folder): Promise<void> {
    const subfolders = await this.foldersSearcherByPartial.run({
      parentId: folder.id,
    });

    const subfoldersDeleted = subfolders.map((subfolder) =>
      this.deleteFolder(subfolder)
    );

    await Promise.all(subfoldersDeleted);
  }

  private async deleteFolder(folder: Folder): Promise<void> {
    const filesDeleted = this.deleteFilesOn(folder);
    const subfoldersDeleted = this.deleteSubfolders(folder);

    await Promise.all([filesDeleted, subfoldersDeleted]);
  }

  async run(path: string): Promise<void> {
    const folder = await this.singleFolderFinder.run({
      path,
      status: FolderStatuses.EXISTS,
    });

    await this.deleteFolder(folder);
  }
}
