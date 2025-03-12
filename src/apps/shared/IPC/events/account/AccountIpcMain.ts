import { ipcMain } from 'electron';
import { TypedIPC } from '../../TypedIPC';
import { BackgroundProcessAccountMessages } from './BackgroundProcessAccountMessages';
import { MainProcessAccountMessages } from './MainProcessAccountMessages';

export type TAccountIpcMain = TypedIPC<BackgroundProcessAccountMessages, MainProcessAccountMessages>;

export const AccountIpcMain = ipcMain as unknown as TAccountIpcMain;
