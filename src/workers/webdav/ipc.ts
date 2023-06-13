import { ipcRenderer } from 'electron';
import {
  WebdavMainEvents,
  WebDavProcessEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export type WebdavIpc = CustomIpc<WebDavProcessEvents, WebdavMainEvents>;

export const ipc = ipcRenderer as unknown as WebdavIpc;
