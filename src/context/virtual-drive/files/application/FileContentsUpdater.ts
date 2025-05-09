import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

export class FileContentsUpdater {
  constructor(private readonly repository: InMemoryFileRepository) {}

  async run(file: File, contentsId: File['contentsId'], size: File['size']): Promise<File> {
    Logger.info('Replace', file, contentsId, size);

    await driveServerWip.files.replaceFile({
      uuid: file.uuid,
      newContentId: contentsId,
      newSize: size,
    });

    Logger.info('Updated', file, contentsId, size);
    return this.repository.updateContentsAndSize(file, contentsId, size);
  }
}
