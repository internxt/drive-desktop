import { existsSync, readFileSync, writeFileSync } from 'fs';

import { logger } from '@/apps/shared/logger/logger';
import { handleHydrate, Task } from '@/apps/sync-engine/callbacks/handle-hydrate';
import VirtualDrive from '../virtual-drive';
import { z } from 'zod';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

const QueueSchema = z.array(
  z.object({
    path: z.string().transform((x) => x as RelativePath),
    uuid: z
      .string()
      .uuid()
      .transform((x) => x as FileUuid),
  }),
);

export class QueueManager {
  queue: Task[] = [];
  isProcessing = false;

  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly queuePath: string,
  ) {
    if (existsSync(this.queuePath)) {
      this.loadQueue();
    }
  }

  saveQueue(): void {
    writeFileSync(this.queuePath, JSON.stringify(this.queue, null, 2));
  }

  loadQueue(): void {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Loading queue state from file',
      queuePath: this.queuePath,
    });

    const data = readFileSync(this.queuePath, 'utf-8');

    try {
      const parsed = JSON.parse(data);
      this.queue = QueueSchema.parse(parsed);
    } catch (exc) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Invalid queue',
        data,
        exc,
      });
    }
  }

  private async processSequentially(): Promise<void> {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      this.saveQueue();

      if (task) {
        await handleHydrate({ drive: this.virtualDrive, task });
      }
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    await this.processSequentially();

    this.isProcessing = false;
  }

  enqueue(task: Task): void {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Enqueue task',
      task,
    });

    const existingTask = this.queue.find((item) => item.path === task.path);

    if (existingTask) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Task already exists in queue. Skipping.',
        task,
      });
      return;
    }

    this.queue.push(task);
    this.saveQueue();
    void this.processQueue();
  }
}
