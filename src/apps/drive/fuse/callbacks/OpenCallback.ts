import { logger } from '@internxt/drive-desktop-core/build/backend';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseCallback } from './FuseCallback';
import { FuseFileOrDirectoryAlreadyExistsError, FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { Container } from 'diod';
import { trackOpen } from './open-flags-tracker';

export class OpenCallback extends FuseCallback<number> {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly container: Container,
  ) {
    super('Open');
  }

  async execute(path: string, flag: number) {
    trackOpen(path, flag);

    try {
      const virtualFile = await this.container.get(FirstsFileSearcher).run({ path });

      if (!virtualFile) {
        const temporalFileExists = await this.virtualDrive.temporalFileExists(path);

        if (temporalFileExists.isLeft() || temporalFileExists.getLeft()) {
          return this.left(new FuseNoSuchFileOrDirectoryError(path));
        }
      }

      return this.right(0);
    } catch (err) {
      if (path.includes('.goutputstream-')) {
        return this.left(new FuseFileOrDirectoryAlreadyExistsError());
      }

      logger.error({ msg: '[OpenCallback] Error:', error: err, path });
      return this.left(new FuseIOError());
    }
  }
}
