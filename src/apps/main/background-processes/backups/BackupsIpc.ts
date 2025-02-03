import { ipcMain } from 'electron';
import { TypedIPC } from '../../../shared/IPC/TypedIPC';
import { MainProcessBackupsMessages } from '../../../shared/IPC/events/backups/MainProcessBackupsMessages';
import { BackgroundProcessBackupsMessages } from '../../../shared/IPC/events/backups/BackgroundProcessBackupsMessages';

type BackupsIPCMain = TypedIPC<
  BackgroundProcessBackupsMessages,
  MainProcessBackupsMessages
>;

export const BackupsIPCMain = ipcMain as unknown as BackupsIPCMain;
