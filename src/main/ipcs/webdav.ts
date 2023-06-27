import { ipcMain } from 'electron';
import {
  WebdavFlowEvents,
  WebdavFlowEventsErrors,
  WebdavMainEvents,
  WebDavProcessEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export const ipcWebdav = ipcMain as unknown as CustomIpc<
  WebdavMainEvents,
  WebDavProcessEvents
>;

type NoEvents = Record<string, (...args: Array<any>) => any>;

export type IpcWebdavFlow = CustomIpc<NoEvents, WebdavFlowEvents>;

export type IpcWebdavFlowErrors = CustomIpc<NoEvents, WebdavFlowEventsErrors>;
