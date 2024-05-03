import { Service } from 'diod';
import { SingleFolderMatchingFinder } from '../../../../virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FilesByPartialSearcher } from '../../../../virtual-drive/files/application/search/FilesByPartialSearcher';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { FoldersSearcherByPartial } from '../../../../virtual-drive/folders/application/search/FoldersSearcherByPartial';
import { FolderStatuses } from '../../../../virtual-drive/folders/domain/FolderStatus';
import { Folder } from '../../../../virtual-drive/folders/domain/Folder';
import { StorageFileId } from '../../../StorageFiles/domain/StorageFileId';
import { StorageFilesRepository } from '../../../StorageFiles/domain/StorageFilesRepository';

@Service()
export class AllFilesInFolderAreAvailableOffline {
  constructor(
    private readonly singleFolderFinder: SingleFolderMatchingFinder,
    private readonly filesByPartialSearcher: FilesByPartialSearcher,
    private readonly repository: StorageFilesRepository,
    private readonly foldersSearcherByPartial: FoldersSearcherByPartial
  ) {}

  private async subfoldersExists(folder: Folder): Promise<boolean> {
    const subfolders = await this.foldersSearcherByPartial.run({
      parentId: folder.id,
      status: FolderStatuses.EXISTS,
    });

    for (const subfolder of subfolders) {
      // eslint-disable-next-line no-await-in-loop
      const locallyAvailable = await this.folderIsAvaliableOffline(subfolder);

      if (!locallyAvailable) return false;
    }

    return true;
  }

  private async filesExists(folder: Folder): Promise<boolean> {
    const files = await this.filesByPartialSearcher.run({
      folderId: folder.id,
      status: FileStatuses.EXISTS,
    });

    if (files.length === 0) {
      return true;
    }

    for (const file of files) {
      const id = new StorageFileId(file.contentsId);

      // eslint-disable-next-line no-await-in-loop
      const locallyAvailable = await this.repository.exists(id);

      if (!locallyAvailable) return false;
    }

    return true;
  }

  private async folderIsAvaliableOffline(folder: Folder): Promise<boolean> {
    const [subfoldersExists, filesExists] = await Promise.all([
      this.subfoldersExists(folder),
      this.filesExists(folder),
    ]);

    return filesExists && subfoldersExists;
  }

  async run(path: string): Promise<boolean> {
    const folder = await this.singleFolderFinder.run({
      path,
    });

    return this.folderIsAvaliableOffline(folder);
  }
}
