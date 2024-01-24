import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Read Directory', {});
  }

  async execute(path: string) {
    const filesNamesPromise =
      this.container.filesByFolderPathNameLister.run(path);

    const folderNamesPromise =
      this.container.foldersByParentPathLister.run(path);

    const [filesNames, foldersNames] = await Promise.all([
      filesNamesPromise,
      folderNamesPromise,
    ]);

    return this.right(['.', '..', ...filesNames, ...foldersNames]);
  }
}
