import {
  HandleAction,
  IQueueManager,
  QueueItem,
  HandleActions,
} from 'virtual-drive/dist';
import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';

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

  private notify: QueueManagerCallback;

  private persistPath: string;

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
    // creamos el archivo de persistencia si no existe
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
      // Si el archivo no existe, se crea y se guarda el estado inicial de las colas.
      if (!fs.existsSync(this.persistPath)) {
        this.saveQueueStateToFile(); // Guarda el estado inicial en el archivo
      }

      // Si el archivo existe, carga los datos desde él.
      const data = fs.readFileSync(this.persistPath, 'utf-8');
      this.queues = JSON.parse(data);
    }
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
      this.saveQueueStateToFile();
      if (task) {
        Logger.debug(`Processing ${type} task: ${JSON.stringify(task)}`);
        Logger.debug(`Tasks length: ${this.queues[type].length}`);
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
    await this.notify.onTaskProcessing();
    await Promise.all(taskTypes.map((type) => this.processQueue(type)));
    await this.notify.onTaskSuccess();
  }
}
