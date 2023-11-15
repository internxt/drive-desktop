import Logger from 'electron-log';

export class DelayQueue {
  private static readonly DELAY = 3_000;
  private queue: Map<string, void>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly name: string,
    private readonly fn: (item: string) => Promise<void>,
    private readonly canLoop: () => boolean
  ) {
    this.queue = new Map();
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setTimeout() {
    this.clearTimeout();
    this.timeout = setTimeout(async () => {
      Logger.debug('Will try to run delay queue for: ', this.name);
      if (this.canLoop()) {
        Logger.debug('Running delay queue for: ', this.name);

        const reversedItems = Array.from(this.queue.entries()).reverse();

        for (const [item] of reversedItems) {
          await this.fn(item);
          this.queue.delete(item);
        }

        return;
      }

      Logger.debug(this.name, 'delay queue blocked');
      this.setTimeout();
    }, DelayQueue.DELAY);
  }

  push(value: string) {
    this.setTimeout();

    this.queue.set(value);
  }

  get size(): number {
    return this.queue.size;
  }

  clear() {
    this.clearTimeout();
    this.queue.clear();
  }
}
