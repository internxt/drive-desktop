import { Container } from 'diod';
import { FuseCallback } from './FuseCallback';
import { FilesByFolderPathSearcher } from '../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FoldersByParentPathLister } from '../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { OfflineFilesByParentPathLister } from '../../../context/offline-drive/files/application/OfflineFileListerByParentFolder';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: Container) {
    super('Read Directory');
  }

  async execute(path: string) {
    const filesNamesPromise = this.container
      .get(FilesByFolderPathSearcher)
      .run(path);

    const folderNamesPromise = this.container
      .get(FoldersByParentPathLister)
      .run(path);

    const offlineFiles = await this.container
      .get(OfflineFilesByParentPathLister)
      .run(path);

    const auxiliaryFileName = offlineFiles
      .filter((file) => file.isAuxiliary())
      .map((file) => file.name);

    const [filesNames, foldersNames] = await Promise.all([
      filesNamesPromise,
      folderNamesPromise,
    ]);

    return this.right([
      '.',
      '..',
      ...filesNames,
      ...foldersNames,
      ...auxiliaryFileName,
    ]);
  }
}
