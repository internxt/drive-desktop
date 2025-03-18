import { ipcRenderer } from 'electron';
import { BackgroundProcessBackupsMessages } from '../shared/IPC/events/backups/BackgroundProcessBackupsMessages';
import { MainProcessBackupsMessages } from '../shared/IPC/events/backups/MainProcessBuckupsMessages';
import { TypedIPC } from '../shared/IPC/TypedIPC';

type TBackupsIPCRenderer = TypedIPC<MainProcessBackupsMessages, BackgroundProcessBackupsMessages>;
export const BackupsIPCRenderer = ipcRenderer as unknown as TBackupsIPCRenderer;
