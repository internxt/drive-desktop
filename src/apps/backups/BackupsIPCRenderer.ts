import { ipcRenderer } from 'electron';
import { TypedIPC } from '../shared/IPC/TypedIPC';
import { BackgroundProcessBackupsMessages } from '../shared/IPC/events/backups/BackgroundProcessBackupsMessages';
import { MainProcessBackupsMessages } from '../shared/IPC/events/backups/MainProcessBackupsMessages';

export type BackupsIPCRenderer = TypedIPC<
  MainProcessBackupsMessages,
  BackgroundProcessBackupsMessages
>;

export const BackupsIPCRenderer = ipcRenderer as unknown as BackupsIPCRenderer;
