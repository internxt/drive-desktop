import fs from 'fs';

import { TLogger } from '@/node-win/logger';

import { HandleAction, HandleActions, QueueItem, typeQueue } from './queueManager';

export type QueueHandler = {
  handleHydrate: HandleAction;
  handleDehydrate: HandleAction;
  handleChangeSize: HandleAction;
};

export class QueueManager {
  private queues: { [key: string]: QueueItem[] } = {
    hydrate: [],
    dehydrate: [],
    changeSize: [],
  };

  private isProcessing: { [key: string]: boolean } = {
    hydrate: false,
    dehydrate: false,
    changeSize: false,
  };

  private enqueueTimeout: NodeJS.Timeout | null = null;
  private enqueueDelay = 2000;

  // private readonly notify: QueueManagerCallback;
  private readonly persistPath: string;

  logger?: TLogger;
  actions: HandleActions;

  constructor({ handlers, persistPath }: { handlers: QueueHandler; persistPath: string }) {
    this.actions = {
      hydrate: handlers.handleHydrate,
      dehydrate: handlers.handleDehydrate,
      changeSize: handlers.handleChangeSize,
    };
    // this.notify = notify;
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
          hydrate: this.queues.hydrate,
          dehydrate: this.queues.dehydrate,
          changeSize: [],
        },
        null,
        2,
      ),
    );
  }

  private loadQueueStateFromFile(): void {
    this.logger?.debug({ msg: 'Loading queue state from file:' + this.persistPath });
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
      hydrate: [],
      dehydrate: [],
      change: [],
      changeSize: [],
    };
    this.saveQueueStateToFile();
  }

  public enqueue(task: QueueItem): void {
    this.logger?.debug({ msg: 'enqueue', task });
    const existingTask = this.queues[task.type].find((item) => item.path === task.path && item.type === task.type);

    if (existingTask) {
      this.logger?.info({ msg: 'Task already exists in queue. Skipping.' });
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
      this.processAll();
    }, this.enqueueDelay);
  }

  private sortQueue(type: typeQueue): void {
    this.queues[type].sort((a, b) => {
      const depthA = a.path.split('\\').length;
      const depthB = b.path.split('\\').length;

      if (depthA !== depthB) {
        return depthA - depthB;
      }

      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? 1 : -1;
      }

      return a.path.localeCompare(b.path);
    });
  }

  private async processQueue(type: typeQueue): Promise<void> {
    if (this.isProcessing[type]) return;

    this.isProcessing[type] = true;

    await this.processSequentially(type);

    this.isProcessing[type] = false;
  }

  private async processSequentially(type: typeQueue): Promise<void> {
    while (this.queues[type].length > 0) {
      // await this.notify.onTaskProcessing();

      const task = this.queues[type].shift();
      this.saveQueueStateToFile();

      if (task) await this.processTask(type, task);
    }
  }

  private async processTask(type: typeQueue, task: QueueItem) {
    this.logger?.debug({ msg: 'processTask', task });

    try {
      await this.actions[task.type](task);
    } catch (error) {
      this.logger?.error({ msg: `Failed to process ${type} task`, error });
    }
  }

  public async processAll(): Promise<void> {
    this.logger?.debug({ msg: 'processAll' });
    const taskTypes = Object.keys(this.queues) as typeQueue[];
    // await this.notify.onTaskProcessing();
    await Promise.all(taskTypes.map((type: typeQueue) => this.processQueue(type)));
    // await this.notify.onTaskSuccess();
  }
}
