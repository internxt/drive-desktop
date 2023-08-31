import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import Logger from 'electron-log';

export class FileDeleter {
  constructor(private readonly repository: FileRepository) {}

  async run(file: File): Promise<void> {
    // this.ipc.send('WEBDAV_FILE_DELETING', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });
    file.trash();

    try {
      await this.repository.delete(file);
    } catch (error) {
      Logger.debug('ERROR DELETING');
    }

    // await this.eventBus.publish(file.pullDomainEvents());

    // this.ipc.send('WEBDAV_FILE_DELETED', {
    //   name: file.name,
    //   extension: file.type,
    //   nameWithExtension: file.nameWithExtension,
    //   size: file.size,
    // });
  }
}
