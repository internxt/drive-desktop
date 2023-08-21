import {
  VirtualDriveListenedEvents,
  MainProcessListenedEvents,
} from 'shared/IPC/events/webdav';
import { VirtualDriveIpc } from '../../../../ipc';

export class WebdavIpcMock implements VirtualDriveIpc {
  sendMock = jest.fn();
  emitMock = jest.fn();
  onMock = jest.fn();
  onceMock = jest.fn();
  handleMock = jest.fn();
  onInvokeMock = jest.fn();

  send(event: string, ...args: Array<any>) {
    return this.sendMock(event, ...args);
  }

  emit(event: keyof MainProcessListenedEvents): void {
    return this.emitMock(event);
  }
  on<Event extends keyof VirtualDriveListenedEvents>(event: Event): void {
    this.onMock(event);
  }
  once<Event extends keyof VirtualDriveListenedEvents>(event: Event): void {
    this.onceMock(event);
  }

  invoke<Event extends never>(
    event: Event,
    ...args: never
  ): Promise<ReturnType<MainProcessListenedEvents[Event]>> {
    return this.onInvokeMock(event, args);
  }

  handle<Event extends never>(
    event: Event,
    listener: (
      event: Electron.IpcMainEvent,
      ...args: Parameters<MainProcessListenedEvents[Event]>
    ) => void
  ): Promise<ReturnType<VirtualDriveListenedEvents[Event]>> {
    return this.handleMock(event, listener);
  }
}
