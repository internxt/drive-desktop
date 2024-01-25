export type MonitorFn = () => Promise<void>;
export class PollingMonitor {
  constructor(
    private readonly delay: number // private readonly fn: () => Promise<void>
  ) {}

  private timeout: NodeJS.Timeout | null = null;

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setTimeout(fn: MonitorFn) {
    this.clearTimeout();
    this.timeout = setTimeout(async () => {
      await fn();
      this.setTimeout(fn);
    }, this.delay);
  }

  start(fn: MonitorFn) {
    this.setTimeout(fn);
  }

  stop() {
    this.clearTimeout();
  }
}
