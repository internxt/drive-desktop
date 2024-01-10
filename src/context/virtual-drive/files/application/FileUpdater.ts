import Logger from 'electron-log';
import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';

export class FileUpdater {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly repository: FileRepository,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(oldContentsId: File['contentsId'], newContentsId: File['contentsId']): Promise<void> {
    const file = this.repository.searchByPartial({ contentsId: oldContentsId });

    if (!file) {
      return;
    }

    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path} is trashed. Will ignore...`);
      return;
    }

    this.ipc.send('FILE_UPDATING', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });

    try {
      file.update(newContentsId);

      await this.remote.update(oldContentsId, file);
      await this.repository.update(file, oldContentsId);

      this.ipc.send('FILE_UPDATED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
      });
    } catch (error: unknown) {
      Logger.error(
        `Error updating the file ${file.nameWithExtension}: `,
        error
      );

      const message = error instanceof Error ? error.message : 'Unknown error';

      this.ipc.send('FILE_UPDATE_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: message,
      });
    }
  }
}
