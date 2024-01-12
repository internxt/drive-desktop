import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';
import { NoSuchFileOrDirectoryError } from './FuseErrors';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Read Directory', true);
  }

  async execute(path: string) {
    try {
      const files = await this.container.filesByFolderPathNameLister.run(path);

      const fileNames = files.map((file) => file.nameWithExtension);

      const folders = await this.container.foldersByParentPathSearcher.run(
        path
      );

      const foldersNames = folders.map((folder) => folder.name);

      return this.right(['.', '..', ...fileNames, ...foldersNames]);
    } catch (error) {
      return this.left(
        new NoSuchFileOrDirectoryError(
          'Could not retrieve the files and folder of the system'
        )
      );
    }
  }
}
