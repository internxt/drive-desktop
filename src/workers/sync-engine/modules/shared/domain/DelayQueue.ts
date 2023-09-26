export class DelayQueue {
  private static readonly DELAY = 3_000;
  private queue: Array<string>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly loopQueue: (queue: Array<string>) => Promise<void>
  ) {
    this.queue = [];
  }

  push(value: string) {
    this.clearTimeout();

    this.timeout = setTimeout(async () => {
      await this.loopQueue(this.queue);
    }, DelayQueue.DELAY);

    this.queue.push(value);
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
