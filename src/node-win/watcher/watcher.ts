import { watch, WatchOptions, FSWatcher } from 'chokidar';

import { onAddDir } from './events/on-add-dir.service';
import { OnRawService } from './events/on-raw.service';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';
import { onAdd } from './events/on-add.service';
import VirtualDrive from '../virtual-drive';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AddController } from '@/apps/sync-engine/callbacks-controllers/controllers/add-controller';
import { unlinkFile } from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import { unlinkFolder } from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import { Stats } from 'fs';

export type TWatcherCallbacks = {
  addController: AddController;
  updateContentsId: (_: { stats: Stats; path: RelativePath; uuid: string }) => Promise<void>;
};

export class Watcher {
  fileInDevice = new Set<AbsolutePath>();
  chokidar?: FSWatcher;

  constructor(
    public readonly syncRootPath: AbsolutePath,
    public readonly options: WatchOptions,
    public readonly queueManager: QueueManager,
    public readonly logger: TLogger,
    public readonly virtualDrive: VirtualDrive,
    public readonly callbacks: TWatcherCallbacks,
    private readonly onRaw: OnRawService = new OnRawService(),
  ) {}

  private onError = (error: unknown) => {
    this.logger.error({ msg: 'onError', error });
  };

  private onReady = () => {
    this.logger.debug({ msg: 'onReady' });
  };

  watchAndWait() {
    try {
      this.chokidar = watch(this.syncRootPath, this.options);
      this.chokidar
        .on('add', (absolutePath: AbsolutePath, stats) => onAdd({ self: this, absolutePath, stats: stats! }))
        .on('addDir', (absolutePath: AbsolutePath, stats) => onAddDir({ self: this, absolutePath, stats: stats! }))
        .on('unlink', (absolutePath: AbsolutePath) => unlinkFile({ virtualDrive: this.virtualDrive, absolutePath }))
        .on('unlinkDir', (absolutePath: AbsolutePath) => unlinkFolder({ virtualDrive: this.virtualDrive, absolutePath }))
        .on('raw', (event, absolutePath: AbsolutePath, details) => this.onRaw.execute({ self: this, event, absolutePath, details }))
        .on('error', this.onError)
        .on('ready', this.onReady);
    } catch (exc) {
      this.logger.error({ msg: 'watchAndWait', exc });
    }
  }
}
