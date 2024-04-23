import { Container } from 'diod';
import Logger from 'electron-log';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { TemporalFileByPathFinder } from '../../../context/offline-drive/TemporalFiles/application/find/TemporalFileByPathFinder';
import { LocalFileIsAvailable } from '../../../context/offline-drive/LocalFile/application/find/LocalFileIsAvaliable';
import { TemporalFile } from '../../../context/offline-drive/TemporalFiles/domain/TemporalFile';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { LocalFileWriter } from '../../../context/offline-drive/LocalFile/application/write/LocalFileWriter';
import { FileDownloader } from '../../../context/virtual-drive/files/application/download/FileDownloader';

export class OpenCallback extends FuseCallback<number> {
  constructor(private readonly container: Container) {
    super('Open');
  }

  private async searchForTemporalFiles(
    path: string
  ): Promise<TemporalFile | undefined> {
    const localIsAvaliable = await this.container
      .get(TemporalFileByPathFinder)
      .run(path);

    if (!localIsAvaliable) return;

    return await this.container.get(TemporalFileByPathFinder).run(path);
  }

  private async download(file: File) {
    const stream = await this.container.get(FileDownloader).run(file);

    await this.container.get(LocalFileWriter).run(file.contentsId, stream);
  }

  async execute(path: string, _flags: Array<any>) {
    try {
      const virtualFile = await this.container
        .get(FirstsFileSearcher)
        .run({ path });

      if (!virtualFile) {
        const document = await this.searchForTemporalFiles(path);

        if (document) {
          return this.right(0);
        }

        return this.left(new FuseNoSuchFileOrDirectoryError(path));
      }

      const localIsAvaliable = await this.container
        .get(LocalFileIsAvailable)
        .run(virtualFile.contentsId);

      if (localIsAvaliable) {
        return this.right(0);
      }

      await this.download(virtualFile);

      return this.right(0);
    } catch (err: unknown) {
      Logger.error('Error downloading file: ', err);
      if (err instanceof Error) {
        return this.left(new FuseIOError());
      }
      return this.left(new FuseIOError());
    }
  }
}
