import fs from 'fs';

import { TLogger } from '@/node-win/logger';

import { HandleAction, HandleActions, QueueItem, typeQueue } from './queueManager';

export type QueueHandler = {
  handleHydrate: HandleAction;
  handleDehydrate: HandleAction;
};

export class QueueManager {
  private queues: { [key: string]: QueueItem[] } = {
    hydrate: [],
    dehydrate: [],
  };

  private isProcessing: { [key: string]: boolean } = {
    hydrate: false,
    dehydrate: false,
  };

  private enqueueTimeout: NodeJS.Timeout | null = null;
  private enqueueDelay = 2000;
  private readonly persistPath: string;

  logger?: TLogger;
  actions: HandleActions;

  constructor({ handlers, persistPath }: { handlers: QueueHandler; persistPath: string }) {
    this.actions = {
      hydrate: handlers.handleHydrate,
      dehydrate: handlers.handleDehydrate,
    };

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

  public enqueue(task: QueueItem): void {
    this.logger?.debug({ msg: 'enqueue', task });
    const existingTask = this.queues[task.type].find((item) => item.path === task.path && item.type === task.type);

    if (existingTask) {
      this.logger?.info({ msg: 'Task already exists in queue. Skipping.' });
      return;
    }

    this.queues[task.type].push(task);
    this.saveQueueStateToFile();
    this.resetEnqueueTimeout();
  }

  private resetEnqueueTimeout(): void {
    if (this.enqueueTimeout) {
      clearTimeout(this.enqueueTimeout);
    }

    this.enqueueTimeout = setTimeout(async () => {
      await this.processAll();
    }, this.enqueueDelay);
  }

  private async processQueue(type: typeQueue): Promise<void> {
    if (this.isProcessing[type]) return;

    this.isProcessing[type] = true;

    await this.processSequentially(type);

    this.isProcessing[type] = false;
  }

  private async processSequentially(type: typeQueue): Promise<void> {
    while (this.queues[type].length > 0) {
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

  async processAll(): Promise<void> {
    this.logger?.debug({ msg: 'processAll' });
    const taskTypes = Object.keys(this.queues) as typeQueue[];
    await Promise.all(taskTypes.map((type) => this.processQueue(type)));
  }
}
