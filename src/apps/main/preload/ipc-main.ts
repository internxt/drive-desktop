import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

const ipcPreloadMain = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupPreloadIpc() {
  ipcPreloadMain.handle('authLogin', (_, props) => driveServerWip.auth.login(props));
  ipcPreloadMain.handle('authAccess', (_, props) => driveServerWip.auth.access(props));
  ipcPreloadMain.on('getLastBackupProgress', () => getLastBackupProgress());
  ipcPreloadMain.handle('getUsage', () => calculateUsage());
}
