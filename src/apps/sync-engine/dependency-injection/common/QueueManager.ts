import {
  HandleAction,
  IQueueManager,
  QueueItem,
  HandleActions,
} from 'virtual-drive/dist';
import Logger from 'electron-log';

export type QueueHandler = {
  handleAdd: HandleAction;
  handleHidreate: HandleAction;
  handleDehidreate: HandleAction;
  handleChange?: HandleAction;
};

export class QueueManager implements IQueueManager {
  private _queue: QueueItem[] = [];

  actions: HandleActions;

  constructor(handlers: QueueHandler) {
    this.actions = {
      add: handlers.handleAdd,
      hidreate: handlers.handleHidreate,
      dehidreate: handlers.handleDehidreate,
      change: handlers.handleChange || (() => Promise.resolve()),
    };
  }

  public enqueue(task: QueueItem): void {
    this._queue.push(task);
    this.sortQueue();
    this.processAll();
    Logger.log(`Task enqueued: ${JSON.stringify(task)}`);
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
      Logger.log('No tasks in queue.');
      return;
    }
    const task = this._queue.shift();
    if (!task) return;
    Logger.log(`Processing task: ${JSON.stringify(task)}`);
    switch (task.type) {
      case 'add':
        await this.actions.add(task);
        break;
      case 'hidreate':
        await this.actions.hidreate(task);
        break;
      case 'dehidreate':
        await this.actions.dehidreate(task);
        break;
      case 'change':
        await this.actions.change(task);
        break;
      default:
        Logger.log('Unknown task type.');
        break;
    }
  }

  public async processAll(): Promise<void> {
    while (this._queue.length > 0) {
      await this.processNext();
    }
  }
}
