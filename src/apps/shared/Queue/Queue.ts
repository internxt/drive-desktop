const queue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

class Queue {
  private queue: (() => Promise<void>)[] = [];

  static async processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        await task();
      }
    }

    isProcessingQueue = false;
  }
  static async enqueue(task: () => Promise<void>) {
    queue.push(task);
    this.processQueue();
  }
}

export default Queue;
