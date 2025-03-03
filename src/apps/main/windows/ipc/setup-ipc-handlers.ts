import { AuthService } from '@/context/infra/api/auth.service';
import { SettingsIPCMain } from './settings-ipc-main';

export const setupIPCHandlers = () => {
  SettingsIPCMain.on('renderer.login-access', (_, props) => AuthService.access(props));
  SettingsIPCMain.on('renderer.login', (_, props) => AuthService.login(props));
};
