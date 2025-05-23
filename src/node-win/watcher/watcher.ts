import { watch, WatchOptions, FSWatcher } from 'chokidar';

import { OnAddDirService } from './events/on-add-dir.service';
import { OnAddService } from './events/on-add.service';
import { OnRawService } from './events/on-raw.service';
import { Addon } from '../addon-wrapper';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';

export class Watcher {
  syncRootPath!: string;
  options!: WatchOptions;
  addon!: Addon;
  queueManager!: QueueManager;
  logger!: TLogger;
  fileInDevice = new Set<string>();
  chokidar?: FSWatcher;

  constructor(
    private readonly onAdd: OnAddService = new OnAddService(),
    private readonly onAddDir: OnAddDirService = new OnAddDirService(),
    private readonly onRaw: OnRawService = new OnRawService(),
  ) {}

  init(queueManager: QueueManager, syncRootPath: string, logger: TLogger, addon: Addon) {
    this.queueManager = queueManager;
    this.syncRootPath = syncRootPath;
    this.logger = logger;
    this.addon = addon;
  }

  private onChange = (path: string) => {
    this.logger.debug({ msg: 'onChange', path });
  };

  private onError = (error: Error) => {
    this.logger.error({ msg: 'onError', error });
  };

  private onReady = () => {
    this.logger.debug({ msg: 'onReady' });
  };

  public watchAndWait() {
    this.chokidar = watch(this.syncRootPath, {
      // awaitWriteFinish: {
      //   stabilityThreshold: 2000,
      //   pollInterval: 100,
      // },
      depth: undefined,
      followSymlinks: true,
      // Ignores dotfiles and dotfolders (.git, .env)
      ignored: /(^|[/\\])\../,
      ignoreInitial: true,
      persistent: true,
    });

    this.chokidar
      .on('add', (path, stats) => this.onAdd.execute({ self: this, path, stats: stats! }))
      .on('change', this.onChange)
      .on('addDir', (path, stats) => this.onAddDir.execute({ self: this, path, stats: stats! }))
      .on('error', this.onError)
      .on('raw', (event, path, details) => this.onRaw.execute({ self: this, event, path, details }))
      .on('ready', this.onReady);
  }
}
