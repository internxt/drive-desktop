import { Container } from 'diod';
import { FuseCallback } from './FuseCallback';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/search/FilesByFolderPathSearcher';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { TemporalFileByFolderFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByFolderFinder';

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

    const temporalFiles = await this.container
      .get(TemporalFileByFolderFinder)
      .run(path);

    const auxiliaryFileName = temporalFiles
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
