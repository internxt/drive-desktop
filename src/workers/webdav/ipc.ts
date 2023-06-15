import { ipcRenderer } from 'electron';
import {
  WebdavInvokableFunctions,
  WebdavMainEvents,
  WebDavProcessEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export type WebdavCustomIpc = CustomIpc<
  WebDavProcessEvents,
  WebdavMainEvents,
  WebdavInvokableFunctions
>;

export const ipc = ipcRenderer as unknown as WebdavCustomIpc;
