import Logger from 'electron-log';

export class DelayQueue {
  private static readonly DELAY = 3_000;
  private queue: Map<string, void>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly name: string,
    private readonly fn: (item: string) => Promise<void>,
    private readonly canLoop: () => boolean,
  ) {
    this.queue = new Map();
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setTimeout(delay = DelayQueue.DELAY) {
    this.clearTimeout();
    this.timeout = setTimeout(async () => {
      Logger.debug('Will try to run delay queue for: ', this.name);
      if (this.canLoop()) {
        Logger.debug('Running delay queue for: ', this.name);
        const reversedItems = Array.from(this.queue.entries()).reverse();
        await this.executeFn(reversedItems[0][0]);
        if (!this.isEmpty) {
          Logger.debug('Restarting delay queue is not empty');
          this.setTimeout(500);
        }
        return;
      }

      Logger.debug(this.name, 'delay queue blocked');
      this.setTimeout();
    }, delay);
  }

  private async executeFn(item: string) {
    this.queue.delete(item);
    await this.fn(item);
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

  removeOne(value: string) {
    this.queue.delete(value);
  }

  get values(): string[] {
    return Array.from(this.queue.keys());
  }

  get reversedValues(): string[] {
    return Array.from(this.queue.keys()).reverse();
  }

  get isEmpty(): boolean {
    return this.queue.size === 0;
  }
}
