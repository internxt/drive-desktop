import { ipcRenderer } from 'electron';
import {
  WebdavMainEvents,
  WebDavProcessEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export const ipc = ipcRenderer as unknown as CustomIpc<
  WebDavProcessEvents,
  WebdavMainEvents
>;
