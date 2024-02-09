import { MonitorFn, PollingMonitor } from '../domain/PollingMonitor';

export class PollingMonitorStart {
  constructor(private readonly polling: PollingMonitor) {}
  run(fn: MonitorFn) {
    return this.polling.start(fn);
  }
}
