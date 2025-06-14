import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { Service } from 'diod';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { logger } from '@/apps/shared/logger/logger';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';

@Service()
export class FileDeleter {
  constructor(
    private readonly local: NodeWinLocalFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly ipc = ipcRendererSyncEngine,
  ) {}

  async run(uuid: File['uuid']): Promise<void> {
    const file = this.repository.searchByPartial({ uuid });

    if (!file) {
      return;
    }

    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path} is already trashed. Will ignore...`);
      return;
    }

    const allParentsExists = this.allParentFoldersStatusIsExists.run(file.folderId.value);

    if (!allParentsExists) {
      Logger.warn(`Skipped file deletion for ${file.path}. A folder in a higher level is already marked as trashed`);
      return;
    }

    this.ipc.send('FILE_DELETING', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });

    try {
      file.trash();

      const promise = () => ipcRendererDriveServerWip.invoke('storageDeleteFileByUuid', { uuid: file.uuid });
      const { error } = await retryWrapper({
        promise,
        loggerBody: {
          tag: 'SYNC-ENGINE',
          msg: 'Retry deleting file',
        },
      });

      if (error) throw error;

      this.repository.update(file);

      this.ipc.send('FILE_DELETED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
      });
    } catch (error) {
      logger.error({
        msg: 'Error deleting the file',
        nameWithExtension: file.nameWithExtension,
        exc: error,
      });

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.local.createPlaceHolder(file);
      this.ipc.send('FILE_DELETION_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: message,
      });

      this.ipc.send('ADD_SYNC_ISSUE', {
        name: file.path,
        error: 'DELETE_ERROR',
      });
    }
  }
}
