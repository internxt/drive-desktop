import EventEmitter from 'events';
import { FileSystem } from '../domain/FileSystem';
import { PartialListing } from '../../sync/Listings/domain/Listing';
import async from 'async';
import { ProcessError, ProcessErrorName } from '../../../workers/types';
import { createErrorDetails } from '../../../workers/utils/reporting';

export class DeleteFolderQueueConsumer {
  private static readonly MAX_CALLS = 10;

  constructor(
    private readonly fileSystem: FileSystem<PartialListing>,
    private readonly eventEmiter: EventEmitter
  ) {}

  async consume(queue: Array<string>): Promise<void> {
    const deleteFolder = async (folderName: string) => {
      const fileSystemKind = this.fileSystem.kind;

      this.eventEmiter.emit('DELETEING_FOLDER', folderName, fileSystemKind);

      try {
        await this.fileSystem.deleteFolder(folderName);

        this.eventEmiter.emit('FOLDER_DELETED', folderName, fileSystemKind);
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Deleting folder',
                  `Folder to be deleted: ${folderName}`
                )
              );

        this.eventEmiter.emit(
          'ERROR_DELETING_FOLDER',
          folderName,
          fileSystemKind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    };

    await async.mapLimit(
      queue,
      DeleteFolderQueueConsumer.MAX_CALLS,
      deleteFolder
    );
  }
}
