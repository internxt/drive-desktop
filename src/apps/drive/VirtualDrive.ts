import { Container } from 'diod';
import { LocalFileIsAvailable } from '../../context/offline-drive/LocalFile/application/find/LocalFileIsAvaliable';
import { FirstsFileSearcher } from '../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileDownloader } from '../../context/virtual-drive/files/application/download/FileDownloader';
import { LocalFileWriter } from '../../context/offline-drive/LocalFile/application/write/LocalFileWriter';
import { Either, left, right } from '../../context/shared/domain/Either';
import {
  FileNotFoundVirtualDriveError,
  VirtualDriveError,
} from './errors/VirtualDriveError';
import { LocalFileDeleter } from '../../context/offline-drive/LocalFile/application/delete/LocalFileDeleter';
import { TemporalFileByPathFinder } from '../../context/offline-drive/TemporalFiles/application/find/TemporalFileByPathFinder';

export class VirtualDrive {
  constructor(private readonly container: Container) {}

  async isLocallyAvailable(
    path: string
  ): Promise<Either<VirtualDriveError, boolean>> {
    const virtualFile = await this.container.get(FirstsFileSearcher).run({
      path,
    });

    if (!virtualFile) {
      return left(new FileNotFoundVirtualDriveError(path));
    }

    const isAvailable = await this.container
      .get(LocalFileIsAvailable)
      .run(virtualFile.contentsId);

    return right(isAvailable);
  }

  async makeFileLocallyAvailable(
    path: string
  ): Promise<Either<VirtualDriveError, void>> {
    const virtualFile = await this.container
      .get(FirstsFileSearcher)
      .run({ path });

    if (!virtualFile) {
      return left(new FileNotFoundVirtualDriveError(path));
    }

    const stream = await this.container.get(FileDownloader).run(virtualFile);
    await this.container
      .get(LocalFileWriter)
      .run(virtualFile.contentsId, stream);

    return right(undefined);
  }

  async makeFileRemoteOnly(
    path: string
  ): Promise<Either<VirtualDriveError, void>> {
    const file = await this.container.get(FirstsFileSearcher).run({
      path,
    });

    if (!file) {
      return left(new FileNotFoundVirtualDriveError(path));
    }

    await this.container.get(LocalFileDeleter).run(file.contentsId);

    return right(undefined);
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
