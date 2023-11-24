import {
  FromMain,
  FromProcess,
} from '../../../../../src/apps/shared/IPC/events/sync-engine';
import { SyncEngineIpc } from '../../../../../src/apps/sync-engine/ipcRendererSyncEngine';

export class IpcRendererSyncEngineMock implements SyncEngineIpc {
  sendMock = jest.fn();
  emitMock = jest.fn();
  onMock = jest.fn();
  onceMock = jest.fn();
  handleMock = jest.fn();
  onInvokeMock = jest.fn();

  send(event: string, ...args: Array<any>) {
    return this.sendMock(event, ...args);
  }

  emit(event: keyof FromProcess): void {
    return this.emitMock(event);
  }
  on(event: string | number): void {
    this.onMock(event);
  }
  once(event: string | number): void {
    this.onceMock(event);
  }

  invoke<Event extends never>(
    event: Event,
    ...args: never
  ): Promise<ReturnType<FromProcess[Event]>> {
    return this.onInvokeMock(event, args);
  }

  handle<Event extends never>(
    event: Event,
    listener: (
      event: Electron.IpcMainEvent,
      ...args: Parameters<FromProcess[Event]>
    ) => void
  ): Promise<ReturnType<FromMain[Event]>> {
    return this.handleMock(event, listener);
  }
}
