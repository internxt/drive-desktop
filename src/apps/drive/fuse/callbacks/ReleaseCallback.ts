import { Container } from 'diod';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError } from './FuseErrors';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { TemporalFileDeleter } from '../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { onRelease } from './open-flags-tracker';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Release', { debug: false });
  }

  async execute(path: string, _fd: number) {
    onRelease(path);

    try {
      const document = await this.findDocument(path);
      if (document) {
        return await this.handleDocument(document, path);
      }

      this.logDebugMessage(`File with ${path} not found`);
      return this.right();
    } catch (err: unknown) {
      logger.error({ msg: 'Error in ReleaseCallback', error: err });
      return this.left(new FuseIOError('An unexpected error occurred during file release.'));
    }
  }

  private async findDocument(path: string) {
    return this.container.get(TemporalFileByPathFinder).run(path);
  }

  private async handleDocument(document: any, path: string) {
    this.logDebugMessage('Offline File found');
    if (document.isAuxiliary()) return this.right();

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
      return this.left(new FuseIOError('Upload failed due to insufficient storage or network issues.'));
    }
  }
}
