import { Container } from 'diod';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError } from './FuseErrors';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { StorageCacheDeleter } from '../../../../context/storage/StorageFiles/application/delete/StorageCacheDeleter';
import { TemporalFileDeleter } from '../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Release', { debug: false });
  }

  async execute(path: string, _fd: number) {
    try {
      const document = await this.findDocument(path);
      if (document) {
        return await this.handleDocument(document, path);
      }

      const virtualFile = await this.findVirtualFile(path);
      if (virtualFile) {
        return await this.handleVirtualFile(virtualFile);
      }

      this.logDebugMessage(`File with ${path} not found`);
      return this.right();
    } catch (err: unknown) {
      logger.error({ msg: 'Error in ReleaseCallback', error: err });
      return this.left(
        new FuseIOError('An unexpected error occurred during file release.')
      );
    }
  }

  private async findDocument(path: string) {
    return this.container.get(TemporalFileByPathFinder).run(path);
  }

  private async handleDocument(document: any, path: string) {
    this.logDebugMessage('Offline File found');
    if (document.size.value === 0 || document.isAuxiliary()) {
      return this.right();
    }

    return await this.uploadDocument(document, path);
  }

  private async uploadDocument(document: any, path: string) {
    try {
      await this.container.get(TemporalFileUploader).run(document.path.value);
      this.logDebugMessage('File has been uploaded');
      return this.right();
    } catch (uploadError) {
      logger.error({ msg: 'Upload failed:', error: uploadError });
      await this.container.get(TemporalFileDeleter).run(path);
      return this.left(
        new FuseIOError(
          'Upload failed due to insufficient storage or network issues.'
        )
      );
    }
  }

  private async findVirtualFile(path: string) {
    return this.container.get(FirstsFileSearcher).run({ path });
  }

  private async handleVirtualFile(virtualFile: any) {
    await this.container.get(StorageCacheDeleter).run(virtualFile.contentsId);
    this.logDebugMessage(`${virtualFile.path} removed from local file cache`);
    return this.right();
  }
}
