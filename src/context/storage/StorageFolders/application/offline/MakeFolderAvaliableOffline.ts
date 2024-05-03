import { Service } from 'diod';
import { MakeStorageFileAvaliableOffline } from '../../../StorageFiles/application/offline/MakeStorageFileAvaliableOffline';
import { FilesByPartialSearcher } from '../../../../virtual-drive/files/application/search/FilesByPartialSearcher';
import { SingleFolderMatchingFinder } from '../../../../virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FoldersSearcherByPartial } from '../../../../virtual-drive/folders/application/search/FoldersSearcherByPartial';
import { FolderStatuses } from '../../../../virtual-drive/folders/domain/FolderStatus';
import { Folder } from '../../../../virtual-drive/folders/domain/Folder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';

@Service()
export class MakeFolderAvaliableOffline {
  constructor(
    private readonly makeStorageFileAvaliableOffline: MakeStorageFileAvaliableOffline,
    private readonly singleFolderFinder: SingleFolderMatchingFinder,
    private readonly filesByPartialSearcher: FilesByPartialSearcher,
    private readonly foldersSearcherByPartial: FoldersSearcherByPartial
  ) {}

  private async makeFolderAvaliableOffline(folder: Folder): Promise<void> {
    const files = await this.filesByPartialSearcher.run({
      folderId: folder.id,
      status: FileStatuses.EXISTS,
    });

    const filesMadeAvaliable = files.map((file) =>
      this.makeStorageFileAvaliableOffline.run(file.path)
    );

    const subfolders = await this.foldersSearcherByPartial.run({
      parentId: folder.id,
      status: FolderStatuses.EXISTS,
    });

    const subfoldersMadeAvaliable = subfolders.map((subfolder) =>
      this.makeFolderAvaliableOffline(subfolder)
    );

    await Promise.all([...subfoldersMadeAvaliable, ...filesMadeAvaliable]);
  }

  async run(path: string): Promise<void> {
    const folder = await this.singleFolderFinder.run({
      path,
      status: FolderStatuses.EXISTS,
    });

    await this.makeFolderAvaliableOffline(folder);
  }
}
