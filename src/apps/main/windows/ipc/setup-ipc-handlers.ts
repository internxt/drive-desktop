import { AuthService } from '@/context/infra/api/auth.service';
import { SettingsIPCMain } from './settings-ipc-main';

export const setupSettingsIPCHandlers = () => {
  SettingsIPCMain.handle('renderer.login-access', (_, props) => AuthService.access(props));
  SettingsIPCMain.handle('renderer.login', (_, props) => AuthService.login(props));
};
