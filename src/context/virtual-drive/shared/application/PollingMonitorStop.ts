import { PollingMonitor } from '../domain/PollingMonitor';

export class PollingMonitorStop {
  constructor(private readonly polling: PollingMonitor) {}
  run() {
    return this.polling.stop();
  }
}
