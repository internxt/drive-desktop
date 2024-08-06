import { ipcMain } from 'electron';
import { TypedIPC } from '../../../shared/IPC/TypedIPC';
import { BackgroundProcessBackupsMessages } from '../../../shared/IPC/events/backups/BackgroundProcessBackupsMessages';
import { MainProcessBackupsMessages } from '../../../shared/IPC/events/backups/MainProcessBackupsMessages';

type BackupsIPCMain = TypedIPC<
  BackgroundProcessBackupsMessages,
  MainProcessBackupsMessages
>;

export const BackupsIPCMain = ipcMain as unknown as BackupsIPCMain;
