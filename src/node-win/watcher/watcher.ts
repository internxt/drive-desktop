import { watch, WatchOptions, FSWatcher } from 'chokidar';

import { onAddDir } from './events/on-add-dir.service';
import { TLogger } from '../logger';
import { onAdd } from './events/on-add.service';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { unlinkFile } from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import { unlinkFolder } from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import { debounceOnRaw } from './events/debounce-on-raw';
import { onAll } from './events/on-all.service';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export class Watcher {
  chokidar?: FSWatcher;

  constructor(
    public readonly syncRootPath: AbsolutePath,
    public readonly options: WatchOptions,
    public readonly logger: TLogger,
  ) {}

  private onError = (error: unknown) => {
    this.logger.error({ msg: 'onError', error });
  };

  private onReady = () => {
    this.logger.debug({ msg: 'onReady' });
  };

  watchAndWait({ ctx }: { ctx: ProcessSyncContext }) {
    try {
      this.chokidar = watch(this.syncRootPath, this.options);
      this.chokidar
        .on('all', (event, path) => onAll({ event, path }))
        /**
         * v2.5.7 Daniel Jiménez
         * add events are triggered when:
         * - we create an item locally.
         * - we move an item locally or when we move it using sync by checkpoint.
         */
        .on('add', (absolutePath: AbsolutePath, stats) => onAdd({ ctx, absolutePath, stats: stats! }))
        .on('addDir', (absolutePath: AbsolutePath) => onAddDir({ ctx, absolutePath }))
        /**
         * v2.5.6 Daniel Jiménez
         * unlink events are triggered when:
         * - we delete an item locally or when we delete it using sync by checkpoint.
         * - we move an item locally or when we move it using sync by checkpoint.
         */
        .on('unlink', (absolutePath: AbsolutePath) => unlinkFile({ ctx, absolutePath }))
        .on('unlinkDir', (absolutePath: AbsolutePath) => unlinkFolder({ ctx, absolutePath }))
        .on('raw', (event, absolutePath: AbsolutePath, details) => debounceOnRaw({ ctx, event, absolutePath, details }))
        .on('error', this.onError)
        .on('ready', this.onReady);
    } catch (exc) {
      this.logger.error({ msg: 'watchAndWait', exc });
    }
  }
}
