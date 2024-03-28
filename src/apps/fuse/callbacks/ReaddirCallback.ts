import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';

export class ReaddirCallback extends FuseCallback<Array<string>> {
  constructor(
    private readonly virtual: VirtualDriveDependencyContainer,
    private readonly offline: OfflineDriveDependencyContainer
  ) {
    super('Read Directory');
  }

  async execute(path: string) {
    const filesNamesPromise =
      this.virtual.filesByFolderPathNameLister.run(path);

    const folderNamesPromise = this.virtual.foldersByParentPathLister.run(path);

    const offlineFiles = await this.offline.offlineFilesByParentPathLister.run(
      path
    );

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
