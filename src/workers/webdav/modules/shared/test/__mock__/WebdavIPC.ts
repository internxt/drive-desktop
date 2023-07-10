import {
  WebdavMainEvents,
  WebDavProcessEvents,
} from 'shared/IPC/events/webdav';
import { WebdavIpc } from '../../../../ipc';

export class WebdavIpcMock implements WebdavIpc {
  sendMock = jest.fn();
  emitMock = jest.fn();
  onMock = jest.fn();
  onceMock = jest.fn();
  handleMock = jest.fn();
  onInvokeMock = jest.fn();

  send(event: string, ...args: Array<any>) {
    return this.sendMock(event, ...args);
  }

  emit(event: keyof WebDavProcessEvents): void {
    return this.emitMock(event);
  }
  on<Event extends keyof WebdavMainEvents>(event: Event): void {
    this.onMock(event);
  }
  once<Event extends keyof WebdavMainEvents>(event: Event): void {
    this.onceMock(event);
  }

  invoke<Event extends never>(
    event: Event,
    ...args: never
  ): Promise<ReturnType<WebDavProcessEvents[Event]>> {
    return this.onInvokeMock(event, args);
  }

  handle<Event extends never>(
    event: Event,
    listener: (
      event: Electron.IpcMainEvent,
      ...args: Parameters<WebDavProcessEvents[Event]>
    ) => void
  ): Promise<ReturnType<WebdavMainEvents[Event]>> {
    return this.handleMock(event, listener);
  }
}
