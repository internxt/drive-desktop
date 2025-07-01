import { watch, WatchOptions, FSWatcher } from 'chokidar';

import { onAddDir } from './events/on-add-dir.service';
import { OnRawService } from './events/on-raw.service';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';
import { onAdd } from './events/on-add.service';
import VirtualDrive from '../virtual-drive';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { RenameOrMoveController } from '@/apps/sync-engine/callbacks-controllers/controllers/RenameOrMoveController';

export class Watcher {
  syncRootPath!: string;
  options!: WatchOptions;
  virtualDrive!: VirtualDrive;
  queueManager!: QueueManager;
  logger!: TLogger;
  fileInDevice = new Set<string>();
  chokidar?: FSWatcher;
  controllers?: {
    renameOrMoveController: RenameOrMoveController;
  };

  constructor(private readonly onRaw: OnRawService = new OnRawService()) {}

  init(queueManager: QueueManager, syncRootPath: string, options: WatchOptions, logger: TLogger, virtualDrive: VirtualDrive) {
    this.queueManager = queueManager;
    this.syncRootPath = syncRootPath;
    this.options = options;
    this.logger = logger;
    this.virtualDrive = virtualDrive;
  }

  private onChange = (path: string) => {
    this.logger.debug({ msg: 'onChange', path });
  };

  private onError = (error: unknown) => {
    this.logger.error({ msg: 'onError', error });
  };

  private onReady = () => {
    this.logger.debug({ msg: 'onReady' });
  };

  public watchAndWait() {
    try {
      this.chokidar = watch(this.syncRootPath, this.options);
      this.chokidar
        .on('add', (absolutePath: AbsolutePath, stats) => onAdd({ self: this, absolutePath, stats: stats! }))
        .on('addDir', (absolutePath: AbsolutePath, stats) => onAddDir({ self: this, absolutePath, stats: stats! }))
        .on('change', this.onChange)
        .on('error', this.onError)
        .on('raw', (event, path, details) => this.onRaw.execute({ self: this, event, path, details }))
        .on('ready', this.onReady);
    } catch (exc) {
      this.logger.error({ msg: 'watchAndWait', exc });
    }
  }
}
