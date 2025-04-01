import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SettingsIPCMain } from './settings-ipc-main';

export const setupSettingsIPCHandlers = () => {
  SettingsIPCMain.handle('renderer.login-access', (_, props) => driveServerWipModule.auth.access(props));
  SettingsIPCMain.handle('renderer.login', (_, props) => driveServerWipModule.auth.login(props));
};
