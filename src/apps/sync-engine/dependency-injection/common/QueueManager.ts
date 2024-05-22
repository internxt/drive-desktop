import {
  HandleAction,
  IQueueManager,
  QueueItem,
  HandleActions,
} from 'virtual-drive/dist';
import Logger from 'electron-log';
import { sleep } from '../../../main/util';

export type QueueHandler = {
  handleAdd: HandleAction;
  handleHydrate: HandleAction;
  handleDehydrate: HandleAction;
  handleChange?: HandleAction;
  handleChangeSize: HandleAction;
};

// const queueFilePath = path.join(__dirname, 'queue.json');
export class QueueManager implements IQueueManager {
  private _queue: QueueItem[] = [];

  private isProcessing = false;

  // private queueFilePath = queueFilePath;

  actions: HandleActions;

  constructor(handlers: QueueHandler) {
    this.actions = {
      add: handlers.handleAdd,
      hydrate: handlers.handleHydrate,
      dehydrate: handlers.handleDehydrate,
      changeSize: handlers.handleChangeSize,
      change: handlers.handleChange || (() => Promise.resolve()),
    };

    // this.loadQueueFromFile();
  }

  // private saveQueueToFile(): void {
  //   const queue = this._queue.filter((item) => item.type !== 'hydrate');
  //   fs.writeFileSync(this.queueFilePath, JSON.stringify(queue, null, 2));
  //   Logger.debug('Queue saved to file.');
  // }

  // private loadQueueFromFile(): void {
  //   try {
  //     if (fs.existsSync(this.queueFilePath)) {
  //       const data = fs.readFileSync(this.queueFilePath, 'utf-8');
  //       this._queue = JSON.parse(data);
  //       Logger.debug('Queue loaded from file.');
  //     }
  //   } catch (error) {
  //     Logger.error('Failed to load queue from file:', error);
  //   }
  // }

  public enqueue(task: QueueItem): void {
    Logger.debug(`Task enqueued: ${JSON.stringify(task)}`);
    // const existingTask = this._queue.find(
    //   (item) => item.path === task.path && item.type === task.type
    // );
    // if (existingTask) {
    //   Logger.debug('Task already exists in queue. Skipping.');
    //   this.processAll();

    //   return;
    // }
    this._queue.push(task);
    this.sortQueue();
    // this.saveQueueToFile();
    if (!this.isProcessing) {
      this.processAll();
    }
  }

  private sortQueue(): void {
    this._queue.sort((a, b) => {
      if (a.isFolder && b.isFolder) {
        return 0;
      }
      if (a.isFolder) {
        return -1;
      }
      if (b.isFolder) {
        return 1;
      }
      return 0;
    });
  }

  public async processNext(): Promise<void> {
    if (this._queue.length === 0) {
      Logger.debug('No tasks in queue.');
      return;
    }

    const task = this._queue.shift();
    if (!task) return;

    // this.saveQueueToFile();

    Logger.debug(`Processing task: ${JSON.stringify(task)}`);

    try {
      switch (task.type) {
        case 'add':
          await this.actions.add(task);
          break;
        case 'hydrate':
          await this.actions.hydrate(task);
          break;
        case 'dehydrate':
          await this.actions.dehydrate(task);
          break;
        case 'change':
          await this.actions.change(task);
          break;
        case 'changeSize':
          await this.actions.changeSize(task);
          break;
        default:
          Logger.debug('Unknown task type.');
          break;
      }
    } catch (error) {
      Logger.error('Failed to process task:', task);
    }
  }

  public async processAll(): Promise<void> {
    this.isProcessing = true;
    while (this._queue.length > 0) {
      await sleep(200);
      Logger.debug('Processing all tasks. Queue length:', this._queue.length);
      await this.processNext();
    }
    this.isProcessing = false;
  }
}
