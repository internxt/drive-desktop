import { DriveEvents } from '../../shared/IPC/events/drive';
import { CustomIpc } from '../../shared/IPC/IPCs';
import { NoEvents } from './NoEvents';

export type IpcDrive = CustomIpc<NoEvents, DriveEvents>;
