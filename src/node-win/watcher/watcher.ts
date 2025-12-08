import { watch, WatchOptions, FSWatcher } from 'chokidar';

import { onAddDir } from './events/on-add-dir.service';
import { onAdd } from './events/on-add.service';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { unlinkFile } from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import { unlinkFolder } from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import { debounceOnRaw } from './events/debounce-on-raw';
import { onAll } from './events/on-all.service';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export class Watcher {
  chokidar?: FSWatcher;

  constructor(public readonly options: WatchOptions) {}

  watchAndWait({ ctx }: { ctx: ProcessSyncContext }) {
    try {
      this.chokidar = watch(ctx.rootPath, this.options);
      this.chokidar
        .on('all', (event, path) => onAll({ event, path: abs(path) }))
        /**
         * v2.5.7 Daniel Jiménez
         * add events are triggered when:
         * - we create an item locally.
         * - we move an item locally or when we move it using sync by checkpoint.
         */
        .on('add', (path, stats) => onAdd({ ctx, path: abs(path), stats: stats! }))
        .on('addDir', (path) => onAddDir({ ctx, path: abs(path) }))
        /**
         * v2.5.6 Daniel Jiménez
         * unlink events are triggered when:
         * - we delete an item locally or when we delete it using sync by checkpoint.
         * - we move an item locally or when we move it using sync by checkpoint.
         */
        .on('unlink', (path) => unlinkFile({ ctx, path: abs(path) }))
        .on('unlinkDir', (path) => unlinkFolder({ ctx, path: abs(path) }))
        .on('raw', (event, path, details) => debounceOnRaw({ ctx, event, path: abs(path), details }))
        .on('error', (error) => ctx.logger.error({ msg: 'onError', error }))
        .on('ready', () => ctx.logger.debug({ msg: 'onReady' }));
    } catch (exc) {
      logger.error({ msg: 'watchAndWait', exc });
    }
  }
}
