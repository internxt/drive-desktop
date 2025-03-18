import { OfflineFile, OfflineFileAttributes } from './../../domain/OfflineFile';
import { Service } from 'diod';
import { File } from '../../domain/File';
import { Either, right } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { HttpRemoteFileSystem } from '../../infrastructure/HttpRemoteFileSystem';

@Service()
export class SimpleFileCreator {
  constructor(private readonly remote: HttpRemoteFileSystem) {}

  async run(attributes: OfflineFileAttributes): Promise<Either<DriveDesktopError, File>> {
    const offlineFile = OfflineFile.from(attributes);

    const dto = await this.remote.persist(offlineFile);

    const file = File.create(dto);

    return right(file);
  }
}
