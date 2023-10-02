import { PlatformPathConverter } from '../../../shared/test/helpers/PlatformPathConverter';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { FolderFinder } from '../FolderFinder';
import { FolderPathCreator } from '../FolderPathCreator';

export class OfflineFolderCreator {
  constructor(
    private readonly pathCreator: FolderPathCreator,
    private readonly folderFinder: FolderFinder,
    private readonly offlineRepository: OfflineFolderRepository
  ) {}

  run(absolutePath: string): OfflineFolder {
    const folderPath = this.pathCreator.fromAbsolute(
      PlatformPathConverter.winToPosix(absolutePath)
    );

    const parent = this.folderFinder.run(
      PlatformPathConverter.winToPosix(folderPath.dirname())
    );

    const folder = OfflineFolder.create(folderPath, parent.id);

    this.offlineRepository.update(folder);

    return folder;
  }
}
