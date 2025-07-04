import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { CallbackController } from './CallbackController';
import { DeleteController } from './DeleteController';
import Logger from 'electron-log';
import { trimPlaceholderId } from './placeholder-id';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly filePathUpdater: FilePathUpdater,
    private readonly folderPathUpdater: FolderPathUpdater,
    private readonly deleteController: DeleteController,
  ) {
    super();
  }

  async execute(absolutePath: string, placeholderId: FilePlaceholderId | FolderPlaceholderId, callback: (response: boolean) => void) {
    const trimmedId = trimPlaceholderId({ placeholderId });

    try {
      if (absolutePath.startsWith('\\$Recycle.Bin')) {
        await this.deleteController.execute(trimmedId);
        return callback(true);
      }

      const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

      const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

      if (this.isFilePlaceholder(trimmedId)) {
        const [, filePlaceholderId] = trimmedId.split(':');
        Logger.debug('[RUN File Path Updater]', filePlaceholderId, posixRelativePath);
        await this.filePathUpdater.run(filePlaceholderId, posixRelativePath);
        Logger.debug('[FINISH File Path Updater]', filePlaceholderId, posixRelativePath);
        return callback(true);
      }

      if (this.isFolderPlaceholder(trimmedId)) {
        const [, folderUuid] = trimmedId.split(':');
        Logger.debug('[RUN Folder Path Updater]', placeholderId, posixRelativePath);
        await this.folderPathUpdater.run(folderUuid, posixRelativePath);
        return callback(true);
      }

      Logger.error('Unidentified placeholder id: ', trimmedId);
      callback(false);
    } catch (error: unknown) {
      Logger.error('[ERROR Rename or move]', error);
      callback(false);
    }
  }
}
