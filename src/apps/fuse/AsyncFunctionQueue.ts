export class AsyncFunctionQueue {
  private readonly queue = new Map<string, Promise<void>>();

  constructor(
    private readonly asyncFunction: (...params: any[]) => Promise<void>
  ) {}

  async enqueue(...params: any[]): Promise<void> {
    const key = params[0];

    if (this.queue.has(key)) {
      const promise = this.queue.get(key);
      await promise;
    }

    const added = this.asyncFunction(...params);
    this.queue.set(key, added);

    try {
      await added;
    } finally {
      this.queue.delete(key);
    }
  }
}
