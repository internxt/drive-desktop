import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { Service } from 'diod';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { logger } from '@/apps/shared/logger/logger';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

@Service()
export class FileDeleter {
  constructor(
    private readonly local: NodeWinLocalFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
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

    try {
      file.trash();

      const { error } = await ipcRendererDriveServerWip.invoke('storageDeleteFileByUuid', {
        uuid: file.uuid,
        workspaceToken: getConfig().workspaceToken,
      });

      if (error) throw error;

      this.repository.update(file);

      ipcRendererSyncEngine.send('FILE_DELETED', {
        nameWithExtension: file.nameWithExtension,
      });
    } catch (error) {
      logger.error({
        msg: 'Error deleting the file',
        nameWithExtension: file.nameWithExtension,
        exc: error,
      });

      this.local.createPlaceHolder(file);
      ipcRendererSyncEngine.send('FILE_DELETION_ERROR', {
        nameWithExtension: file.nameWithExtension,
      });

      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
        name: file.path,
        error: 'DELETE_ERROR',
      });
    }
  }
}
