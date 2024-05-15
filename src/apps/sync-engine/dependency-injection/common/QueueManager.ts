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

export class QueueManager implements IQueueManager {
  private _queue: QueueItem[] = [];

  private isProcessing = false;

  actions: HandleActions;

  constructor(handlers: QueueHandler) {
    this.actions = {
      add: handlers.handleAdd,
      hydrate: handlers.handleHydrate,
      dehydrate: handlers.handleDehydrate,
      changeSize: handlers.handleChangeSize,
      change: handlers.handleChange || (() => Promise.resolve()),
    };
  }

  public enqueue(task: QueueItem): void {
    Logger.debug(`Task enqueued: ${JSON.stringify(task)}`);
    this._queue.push(task);
    this.sortQueue();
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
    Logger.debug(`Processing task: ${JSON.stringify(task)}`);
    switch (task.type) {
      case 'add':
        return await this.actions.add(task);
      case 'hydrate':
        return await this.actions.hydrate(task);
      case 'dehydrate':
        return await this.actions.dehydrate(task);
      case 'change':
        return await this.actions.change(task);
      case 'changeSize':
        return await this.actions.changeSize(task);
      default:
        Logger.debug('Unknown task type.');
        break;
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
