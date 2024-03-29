import { MonitorFn, PollingMonitor } from '../domain/PollingMonitor';
import { ipcRenderer } from 'electron';
import Logger from 'electron-log';

export class PollingMonitorStart {
  constructor(private readonly polling: PollingMonitor) {}
  run(fn: MonitorFn) {
    Logger.info('[SYNC ENGINE] check sync engine');

    const permission = this.permissionFn.bind(this);
    return this.polling.start(fn, permission);
  }

  private async permissionFn() {
    const isSyncing = await ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS');
    Logger.info('[SYNC ENGINE] Not permitted to start fallback sync: ', isSyncing);

    const isPermitted = !isSyncing;
    return isPermitted;
  }
}
