import { ipcMain } from 'electron';
import { TypedIPC } from 'src/apps/shared/IPC/TypedIPC';
import { ListenedEvents } from './auth-listened-events';
import { EmittedEvents } from './auth-emitted-events';


export type TAuthIPCMain = TypedIPC<ListenedEvents, EmittedEvents>;
export const AuthIPCMain = ipcMain as unknown as TAuthIPCMain;
