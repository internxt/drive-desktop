import { ipcMain } from 'electron';
import {
  WebdavMainEvents,
  WebDavProcessEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export const ipcWebdav = ipcMain as unknown as CustomIpc<
  WebdavMainEvents,
  WebDavProcessEvents
>;
