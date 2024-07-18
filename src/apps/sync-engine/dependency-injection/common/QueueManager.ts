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
  private queues: { [key: string]: QueueItem[] } = {
    add: [],
    hydrate: [],
    dehydrate: [],
    change: [],
    changeSize: [],
  };

  private isProcessing: { [key: string]: boolean } = {
    add: false,
    hydrate: false,
    dehydrate: false,
    change: false,
    changeSize: false,
  };

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
    const existingTask = this.queues[task.type].find(
      (item) => item.path === task.path && item.type === task.type
    );
    if (existingTask) {
      Logger.debug('Task already exists in queue. Skipping.');
      return;
    }
    this.queues[task.type].push(task);
    this.sortQueue(task.type);
    if (!this.isProcessing[task.type]) {
      this.processQueue(task.type);
    }
  }

  private sortQueue(type: string): void {
    this.queues[type].sort((a, b) => {
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

  private async processQueue(type: string): Promise<void> {
    if (this.isProcessing[type]) {
      return;
    }

    this.isProcessing[type] = true;
    while (this.queues[type].length > 0) {
      const task = this.queues[type].shift();
      if (task) {
        Logger.debug(`Processing ${type} task: ${JSON.stringify(task)}`);
        try {
          await this.actions[task.type](task);
        } catch (error) {
          Logger.error(`Failed to process ${type} task:`, task, error);
        }
      }
    }
    this.isProcessing[type] = false;
  }

  public async processAll(): Promise<void> {
    const taskTypes = Object.keys(this.queues);
    await Promise.all(taskTypes.map((type) => this.processQueue(type)));
  }
}
