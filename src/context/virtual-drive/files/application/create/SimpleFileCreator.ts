import { OfflineFile, OfflineFileAttributes } from './../../domain/OfflineFile';
import { Service } from 'diod';
import { File } from '../../domain/File';
import { HttpRemoteFileSystem } from '../../infrastructure/HttpRemoteFileSystem';

@Service()
export class SimpleFileCreator {
  constructor(private readonly remote: HttpRemoteFileSystem) {}

  async run(attributes: OfflineFileAttributes): Promise<File> {
    const offlineFile = OfflineFile.from(attributes);

    const dto = await this.remote.persist(offlineFile);

    const file = File.from(dto);

    return file;
  }
}
