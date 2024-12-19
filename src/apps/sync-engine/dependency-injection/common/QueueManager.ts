/* eslint-disable no-await-in-loop */
import {
  HandleAction,
  IQueueManager,
  QueueItem,
  HandleActions,
  typeQueue,
} from 'virtual-drive/dist';
import Logger from 'electron-log';
import fs from 'fs';
import _ from 'lodash';

export type QueueHandler = {
  handleAdd: HandleAction;
  handleHydrate: HandleAction;
  handleDehydrate: HandleAction;
  handleChange?: HandleAction;
  handleChangeSize: HandleAction;
};

export type QueueManagerCallback = {
  onTaskSuccess: () => Promise<void>;
  onTaskProcessing: () => Promise<void>;
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

  private enqueueTimeout: NodeJS.Timeout | null = null;
  private enqueueDelay = 2000;

  private readonly notify: QueueManagerCallback;
  private readonly persistPath: string;

  actions: HandleActions;

  constructor(
    handlers: QueueHandler,
    notify: QueueManagerCallback,
    persistPath: string
  ) {
    this.actions = {
      add: handlers.handleAdd,
      hydrate: handlers.handleHydrate,
      dehydrate: handlers.handleDehydrate,
      changeSize: handlers.handleChangeSize,
      change: handlers.handleChange || (() => Promise.resolve()),
    };
    this.notify = notify;
    this.persistPath = persistPath;
    if (!fs.existsSync(this.persistPath)) {
      fs.writeFileSync(this.persistPath, JSON.stringify(this.queues));
    } else {
      this.loadQueueStateFromFile();
    }
  }
  private saveQueueStateToFile(): void {
    if (!this.persistPath) return;

    fs.writeFileSync(
      this.persistPath,
      JSON.stringify(
        {
          add: [],
          hydrate: this.queues.hydrate,
          dehydrate: this.queues.dehydrate,
          change: [],
          changeSize: [],
        },
        null,
        2
      )
    );
  }

  private loadQueueStateFromFile(): void {
    Logger.debug('Loading queue state from file:' + this.persistPath);
    if (this.persistPath) {
      if (!fs.existsSync(this.persistPath)) {
        this.saveQueueStateToFile();
      }

      const data = fs.readFileSync(this.persistPath, 'utf-8');
      if (!data) {
        return;
      }
      this.queues = JSON.parse(data);
    }
  }

  public clearQueue(): void {
    this.queues = {
      add: [],
      hydrate: [],
      dehydrate: [],
      change: [],
      changeSize: [],
    };
    this.saveQueueStateToFile();
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
    this.saveQueueStateToFile();
    this.resetEnqueueTimeout();
  }

  private resetEnqueueTimeout(): void {
    if (this.enqueueTimeout) {
      clearTimeout(this.enqueueTimeout);
    }

    // Inicia el temporizador de espera
    this.enqueueTimeout = setTimeout(() => {
      Logger.debug('Processing all tasks');
      this.processAll();
    }, this.enqueueDelay);
  }

  private sortQueue(type: typeQueue): void {
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

  private async processQueue(type: typeQueue): Promise<void> {
    if (this.isProcessing[type]) return;

    this.isProcessing[type] = true;

    if (type === typeQueue.add) {
      await this.processInChunks(type, 7);
    } else {
      await this.processSequentially(type);
    }

    this.isProcessing[type] = false;
  }

  private async processInChunks(
    type: typeQueue,
    chunkSize: number
  ): Promise<void> {
    const chunks = _.chunk(this.queues[type], chunkSize);

    for (const chunk of chunks) {
      await this.notify.onTaskProcessing();

      await Promise.all(chunk.map((task) => this.processTask(type, task)));
      this.queues[type] = this.queues[type].slice(chunk.length);
    }
  }

  private async processSequentially(type: typeQueue): Promise<void> {
    while (this.queues[type].length > 0) {
      await this.notify.onTaskProcessing();

      const task = this.queues[type].shift();
      this.saveQueueStateToFile();

      if (task) await this.processTask(type, task);
    }
  }

  private async processTask(type: typeQueue, task: QueueItem): Promise<void> {
    Logger.debug(`Processing ${type} task: ${JSON.stringify(task)}`);
    try {
      await this.actions[task.type](task);
    } catch (error) {
      Logger.error(`Failed to process ${type} task:`, task, error);
    }
  }

  public async processAll(): Promise<void> {
    const taskTypes = Object.keys(this.queues) as typeQueue[];
    await this.notify.onTaskProcessing();
    await Promise.all(
      taskTypes.map((type: typeQueue) => this.processQueue(type))
    );
    await this.notify.onTaskSuccess();
  }
}
