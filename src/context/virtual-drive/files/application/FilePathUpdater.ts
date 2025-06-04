import { FileNotFoundError } from './../domain/errors/FileNotFoundError';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FolderFinder } from '../../folders/application/FolderFinder';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { logger } from '../../../../apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export class FilePathUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly folderFinder: FolderFinder,
  ) {}

  private async rename(file: File, path: FilePath) {
    file.rename(path);

    await driveServerWip.files.renameFile({
      name: file.name,
      type: file.type,
      uuid: file.uuid,
    });

    this.repository.update(file);
  }

  private async move(file: File, destination: FilePath) {
    Logger.debug('[MOVE]', file.name, destination.value);
    const destinationFolder = this.folderFinder.run(destination.dirname());

    Logger.debug('[MOVE TO]', file.path, destinationFolder.name);
    try {
      file.moveTo(destinationFolder);
    } catch (exc: unknown) {
      throw logger.error({
        msg: 'Error in FilePathUpdater.move',
        exc,
      });
    }

    Logger.debug('[REMOTE MOVE]', file.name, destinationFolder.name);
    await driveServerWip.files.moveFile({
      uuid: file.uuid,
      parentUuid: destinationFolder.uuid,
    });
    Logger.debug('[REPOSITORY MOVE]', file.name, destinationFolder.name);
    this.repository.update(file);
  }

  async run(uuid: string, posixRelativePath: string) {
    try {
      const destination = new FilePath(posixRelativePath);
      const file = this.repository.searchByPartial({
        uuid,
      });

      if (!file) {
        throw new FileNotFoundError(uuid);
      }

      const folderFather = file.folderUuid
        ? this.folderFinder.findFromUuid(file.folderUuid.value)
        : this.folderFinder.findFromId(file.folderId.value);

      logger.info({
        msg: 'File path updater info',
        file: file.name,
        fileDirname: file.dirname,
        folder: folderFather.name,
        folderPath: folderFather.path,
        destination: destination.dirname(),
      });

      if (folderFather.path !== destination.dirname()) {
        if (file.nameWithExtension !== destination.nameWithExtension()) {
          throw new ActionNotPermittedError('rename and change folder');
        }
        Logger.error('[RUN MOVE]', file.name, destination.value);
        await this.move(file, destination);
        return;
      }

      const destinationFile = this.repository.searchByPartial({
        path: destination.value,
      });

      if (destinationFile) {
        ipcRendererSyncEngine.send('FILE_RENAME_ERROR', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          error: 'Renaming error: file already exists',
        });
        throw new FileAlreadyExistsError(destination.name());
      }

      if (folderFather.path !== file.dirname) {
        file.moveTo(folderFather);
      }

      Logger.debug('[RUN RENAME]', file.name, destination.value);

      if (destination.extensionMatch(file.type)) {
        ipcRendererSyncEngine.send('FILE_RENAMING', {
          oldName: file.name,
          nameWithExtension: destination.nameWithExtension(),
        });
        await this.rename(file, destination);
        ipcRendererSyncEngine.send('FILE_RENAMED', {
          oldName: file.name,
          nameWithExtension: destination.nameWithExtension(),
        });
        return;
      }

      throw new Error('Cannot reupload files atm');
    } catch (exc: unknown) {
      throw logger.error({
        msg: 'Error in FilePathUpdater.run',
        exc,
      });
    }
  }
}
