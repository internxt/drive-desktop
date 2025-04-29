import { ipcMain } from 'electron';
import { TypedIPC } from '../../../shared/IPC/TypedIPC';
import { EmittedEvents } from './emitted-events';
import { ListenedEvents } from './listened-events';

type TSettingsIPCMain = TypedIPC<ListenedEvents, EmittedEvents>;
export const SettingsIPCMain = ipcMain as unknown as TSettingsIPCMain;
