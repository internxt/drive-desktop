import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { Callback } from './Callback';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class GetAttributes {
  constructor(private readonly container: DependencyContainer) {}

  async execute(path: string, cb: Callback): Promise<void> {
    if (path === '/') {
      return cb(0, { mode: 16877, size: 0 });
    }

    const file = await this.container.filesSearcher.run({ path });

    if (file) {
      return cb(0, { mode: 33188, size: file.size });
    }

    const folder = await this.container.folderSearcher.run({ path });

    if (folder) {
      return cb(0, { mode: 16877, size: 0 });
    }

    cb(fuse.ENOENT);
  }
}
