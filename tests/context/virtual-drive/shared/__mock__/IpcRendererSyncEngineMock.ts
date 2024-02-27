import { BackgroundProcessVirtualDriveEvents } from '../../../../../src/apps/shared/IPC/events/virtualDrive/BackgroundProcessVirtualDriveEvents';
import { MainProcessVirtualDriveEvents } from '../../../../../src/apps/shared/IPC/events/virtualDrive/MainProcessVirtualDriveEvents';
import { SyncEngineIpc } from '../../../../../src/apps/sync-engine/SyncEngineIpc';

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

  emit(event: string): void {
    return this.emitMock(event);
  }
  on(event: string | number): void {
    this.onMock(event);
  }
  once(event: string | number): void {
    this.onceMock(event);
  }

  invoke<Event extends never>(event: Event, ...args: never): Promise<any> {
    return this.onInvokeMock(event, args);
  }

  handle<Event extends never>(
    event: Event,
    listener: (
      event: Electron.IpcMainEvent,
      ...args: Parameters<BackgroundProcessVirtualDriveEvents[Event]>
    ) => void
  ): Promise<ReturnType<MainProcessVirtualDriveEvents[Event]>> {
    return this.handleMock(event, listener);
  }
}
