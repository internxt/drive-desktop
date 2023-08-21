import { ipcRenderer } from 'electron';
import {
  VirtualDriveListenedEvents,
  MainProcessListenedEvents,
} from '../../shared/IPC/events/webdav';
import { CustomIpc } from '../../shared/IPC/IPCs';

export type VirtualDriveIpc = CustomIpc<
  MainProcessListenedEvents,
  VirtualDriveListenedEvents
>;

export const ipc = ipcRenderer as unknown as VirtualDriveIpc;
