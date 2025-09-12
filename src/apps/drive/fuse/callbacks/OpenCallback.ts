import { logger } from '@internxt/drive-desktop-core/build/backend';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseCallback } from './FuseCallback';
import {
  FuseFileOrDirectoryAlreadyExistsError,
  FuseIOError,
} from './FuseErrors';

export class OpenCallback extends FuseCallback<number> {
  constructor(private readonly virtualDrive: VirtualDrive) {
    super('Open');
  }

  async execute(path: string, _flags: Array<any>) {
    try {
      const locallyAvailable = await this.virtualDrive.isLocallyAvailable(path);

      if (locallyAvailable) {
        return this.right(0);
      }

      const temporalFileExists = await this.virtualDrive.temporalFileExists(
        path
      );

      if (temporalFileExists.isRight() && temporalFileExists.getRight()) {
        return this.right(0);
      }

      await this.virtualDrive.makeFileLocallyAvailable(path);

      return this.right(0);
    } catch (err: unknown) {
      if (path.includes('.goutputstream-')) {
        return this.left(new FuseFileOrDirectoryAlreadyExistsError());
      }

      logger.error({ msg: 'Error downloading file: ', error: err });
      if (err instanceof Error) {
        return this.left(new FuseIOError());
      }
      return this.left(new FuseIOError());
    }
  }
}
