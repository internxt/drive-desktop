import { DependencyContainer } from '../dependency-injection/virtual-drive/DependencyContainer';
import { Callback } from './Callback';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class TrashFolder {
  constructor(private readonly container: DependencyContainer) {}

  async execute(path: string, cb: Callback): Promise<void> {
    try {
      const folder = await this.container.folderSearcher.run({ path });

      if (!folder) {
        cb(fuse.ENOENT);
        return;
      }

      await this.container.folderDeleter.run(folder.uuid);

      cb(0);
    } catch {
      cb(fuse.EIO);
      return;
    }
  }
}
