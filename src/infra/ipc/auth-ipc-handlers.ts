import { IpcMainInvokeEvent } from 'electron';
import { driveServerModule } from '../drive-server/drive-server.module';
import { AuthIPCMain } from './auth-ipc-main';
import {
  AuthAccessResponseViewModel,
  AuthLoginResponseViewModel,
  LoginAccessRequest,
  LoginAccessResponse,
} from '../drive-server/services/auth/auth.types';

export function registerAuthIPCHandlers(): void {
  AuthIPCMain.handle(
    'auth:login',
    async (_event: IpcMainInvokeEvent, email: string) => {
      const response = await driveServerModule.auth.login(email);
      return response.fold<AuthLoginResponseViewModel>(
        (err) => ({ success: false, error: err.message }),
        (data) => ({ success: true, data })
      );
    }
  );

  AuthIPCMain.handle(
    'auth:access',
    async (_event: IpcMainInvokeEvent, credentials: LoginAccessRequest) => {
      const response = await driveServerModule.auth.access(credentials);
      return response.fold<AuthAccessResponseViewModel>(
        (err) => ({ success: false, error: err.message }),
        (data: LoginAccessResponse) => ({ success: true, data })
      );
    }
  );
}
