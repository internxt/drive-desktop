import { FileRepository } from '../domain/FileRepository';
import Logger from 'electron-log';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FileDeleter {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinder: FileFinderByContentsId
  ) {}

  async run(constentsId: string): Promise<void> {
    const file = this.fileFinder.run(constentsId);

    Logger.debug('FILE TO BE DELETED, ', file.nameWithExtension);

    // this.ipc.send('WEBDAV_FILE_DELETING', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });
    file.trash();

    await this.repository.delete(file);

    // await this.eventBus.publish(file.pullDomainEvents());

    // this.ipc.send('WEBDAV_FILE_DELETED', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });
  }
}
