import { FileRepository } from '../domain/FileRepository';
import Logger from 'electron-log';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { FileStatuses } from '../domain/FileStatus';

export class FileDeleter {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinder: FileFinderByContentsId
  ) {}

  async run(contentsId: string): Promise<void> {
    const file = this.fileFinder.run(contentsId);

    Logger.debug('FILE TO BE DELETED, ', file.nameWithExtension);

    if (file.status.is(FileStatuses.TRASHED)) {
      // TODO: Solve file deleter being called twice
      Logger.warn(`File ${file.path.value} is already trashed. Will ignore...`);
      return;
    }

    // this.ipc.send('WEBDAV_FILE_DELETING', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });

    file.trash();

    await this.repository.delete(file);

    Logger.debug('FILE DELETED, ', file.nameWithExtension);

    // await this.eventBus.publish(file.pullDomainEvents());

    // this.ipc.send('WEBDAV_FILE_DELETED', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });
  }
}
