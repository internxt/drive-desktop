import { FolderPath } from '../../../context/virtual-drive/folders/domain/FolderPath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Read Directory', {});
  }

  async execute(path: string) {
    const folderPath = new FolderPath(path);

    const filesNamesPromise =
      this.container.filesByFolderPathNameLister.run(folderPath);

    const folderNamesPromise =
      this.container.foldersByParentPathLister.run(folderPath);

    const [filesNames, foldersNames] = await Promise.all([
      filesNamesPromise,
      folderNamesPromise,
    ]);

    return this.right(['.', '..', ...filesNames, ...foldersNames]);
  }
}
