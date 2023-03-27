import async from 'async';
import { PartialListing } from '../../sync/Listings/domain/Listing';
import { FileSystem } from '../domain/FileSystem';
import EventEmitter from 'events';
import { ProcessError, ProcessErrorName } from '../../../workers/types';
import { createErrorDetails } from '../../../workers/utils/reporting';

export class RenameFolderQueuConsumer {
  private static readonly MAX_CALLS = 10;

  constructor(
    private readonly destinationFileSystem: FileSystem<PartialListing>,
    private readonly eventEmiter: EventEmitter
  ) {}

  async consume(queue: Array<[string, string]>): Promise<void> {
    const rename = async ([oldName, newName]: [
      oldName: string,
      newName: string
    ]) => {
      const destinationFileSystemKind = this.destinationFileSystem.kind;

      this.eventEmiter.emit(
        'RENAMING_FOLDER',
        oldName,
        newName,
        destinationFileSystemKind
      );

      try {
        await this.destinationFileSystem.renameFolder(oldName, newName);
        this.eventEmiter.emit(
          'FOLDER_RENAMED',
          oldName,
          newName,
          destinationFileSystemKind
        );
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Renaming folder',
                  `oldName: ${oldName}, newName: ${newName}, kind: ${destinationFileSystemKind}`
                )
              );

        this.eventEmiter.emit(
          'ERROR_RENAMING_FOLDER',
          oldName,
          newName,
          destinationFileSystemKind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    };

    await async.mapLimit(queue, RenameFolderQueuConsumer.MAX_CALLS, rename);
  }
}
