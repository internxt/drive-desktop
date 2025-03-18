import { ipcRenderer } from 'electron';
import { TypedIPC } from '../../TypedIPC';
import { BackgroundProcessAccountMessages } from './BackgroundProcessAccountMessages';
import { MainProcessAccountMessages } from './MainProcessAccountMessages';

export type TAccountIpcRenderer = TypedIPC<MainProcessAccountMessages, BackgroundProcessAccountMessages>;

export const AccountIpcRenderer = ipcRenderer as unknown as TAccountIpcRenderer;
