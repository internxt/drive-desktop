import { ipcMain } from 'electron';
import {
  WebdavFlowEvents,
  WebdavFlowEventsErrors,
  VirtualDriveListenedEvents,
  MainProcessListenedEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export const ipcWebdav = ipcMain as unknown as CustomIpc<
  VirtualDriveListenedEvents,
  MainProcessListenedEvents
>;

type NoEvents = Record<string, (...args: Array<any>) => any>;

export type IpcWebdavFlow = CustomIpc<NoEvents, WebdavFlowEvents>;

export type IpcWebdavFlowErrors = CustomIpc<NoEvents, WebdavFlowEventsErrors>;
