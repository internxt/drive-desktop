import Logger from 'electron-log';

export class DelayQueue {
  private static readonly DELAY = 3_000;
  private queue: Array<string>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly loopQueue: (queue: Array<string>) => Promise<void>,
    private readonly canLoop: () => boolean
  ) {
    this.queue = [];
  }

  push(value: string) {
    this.setTimeout();

    this.queue.push(value);
  }

  private setTimeout() {
    this.clearTimeout();
    this.timeout = setTimeout(async () => {
      Logger.debug('WILL TRY TO RUN DELAY QUEUE');
      if (this.canLoop()) {
        Logger.debug('RUNNING DELAY QUEUE');
        await this.loopQueue(this.queue);
        return;
      }

      Logger.debug('LOOP BLOCKED');
      this.setTimeout();
    }, DelayQueue.DELAY);
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  clear() {
    this.clearTimeout();
    this.queue = [];
  }
}
