export type MonitorFn = () => Promise<void>;
export type PermissionFn = () => Promise<boolean>;
export class PollingMonitor {
  constructor(private readonly delay: number) {}

  private timeout: NodeJS.Timeout | null = null;

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setTimeout(fn: MonitorFn, permissionFn: PermissionFn) {
    this.clearTimeout();
    this.timeout = setTimeout(async () => {
      if (!(await permissionFn())) {
        // wait for the next interval
        this.repeatDelay(fn, permissionFn);
        return;
      }
      await fn();
      this.repeatDelay(fn, permissionFn);
    }, this.delay);
  }

  private repeatDelay(fn: MonitorFn, runPermissionFn: PermissionFn) {
    this.setTimeout(fn, runPermissionFn);
  }

  start(fn: MonitorFn, runPermissionFn: PermissionFn) {
    this.setTimeout(fn, runPermissionFn);
  }

  stop() {
    this.clearTimeout();
  }
}
