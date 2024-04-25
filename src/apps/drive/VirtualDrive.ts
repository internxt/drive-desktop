import { Container } from 'diod';
import { Either, right } from '../../context/shared/domain/Either';
import { StorageFileDeleter } from '../../context/storage/StorageFiles/application/delete/StorageFileDeleter';
import { MakeStorageFileAvaliableOffline } from '../../context/storage/StorageFiles/application/offline/MakeStorageFileAvaliableOffline';
import { StorageFileIsAvailableOffline } from '../../context/storage/StorageFiles/application/offline/StorageFileIsAvailableOffline';
import { TemporalFileByPathFinder } from '../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { VirtualDriveError } from './errors/VirtualDriveError';

export class VirtualDrive {
  constructor(private readonly container: Container) {}

  async isLocallyAvailable(path: string): Promise<boolean> {
    return await this.container.get(StorageFileIsAvailableOffline).run(path);
  }

  async makeFileLocallyAvailable(path: string): Promise<void> {
    await this.container.get(MakeStorageFileAvaliableOffline).run(path);
  }

  async makeFileRemoteOnly(path: string): Promise<void> {
    await this.container.get(StorageFileDeleter).run(path);
  }

  async temporalFileExists(
    path: string
  ): Promise<Either<VirtualDriveError, boolean>> {
    const file = await this.container.get(TemporalFileByPathFinder).run(path);

    if (!file) {
      return right(false);
    }

    return right(true);
  }
}
