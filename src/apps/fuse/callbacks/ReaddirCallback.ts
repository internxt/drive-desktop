import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';
import { NoSuchFileOrDirectoryError } from './FuseErrors';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Read Directory', {});
  }

  async execute(path: string) {
    try {
      const filesNamesPromise =
        this.container.filesByFolderPathNameLister.run(path);

      const folderNamesPromise =
        this.container.foldersByParentPathLister.run(path);

      const [filesNames, foldersNames] = await Promise.all([
        filesNamesPromise,
        folderNamesPromise,
      ]);

      return this.right(['.', '..', ...filesNames, ...foldersNames]);
    } catch (error) {
      return this.left(
        new NoSuchFileOrDirectoryError(
          'Could not retrieve the files and folder of the system'
        )
      );
    }
  }
}
