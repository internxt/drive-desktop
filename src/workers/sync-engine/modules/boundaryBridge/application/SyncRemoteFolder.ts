import fs from 'fs/promises';
import { FolderByPartialSearcher } from '../../folders/application/FolderByPartialSearcher';
import { Folder } from '../../folders/domain/Folder';
import { ManagedFolderRepository } from '../../folders/domain/ManagedFolderRepository';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import Logger from 'electron-log';

export class SyncRemoteFolder {
  constructor(
    private readonly folderByPartialSearcher: FolderByPartialSearcher,
    private readonly managedFolderRepository: ManagedFolderRepository,
    private readonly virtualDrivePlaceholderCreator: PlaceholderCreator,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  async run(remote: Folder): Promise<void> {
    const local = this.folderByPartialSearcher.run({
      uuid: remote.uuid,
    });

    if (!local) {
      Logger.debug('Creating folder placeholder: ', remote.path.value);
      await this.managedFolderRepository.insert(remote);
      this.virtualDrivePlaceholderCreator.folder(remote);
      return;
    }

    if (remote.name !== local.name || remote.parentId !== local.parentId) {
      Logger.debug('Updating folder placeholder: ', remote.path.value);
      await this.managedFolderRepository.overwrite(local, remote);
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        local.path.value
      );
      await fs.unlink(win32AbsolutePath);
      this.virtualDrivePlaceholderCreator.folder(remote);
    }
  }
}
