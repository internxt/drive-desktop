import { ipcMain } from 'electron';

import eventBus from '../event-bus';
import { userLogout, userSignin, userSigninFailed } from './service';
import { clearRemoteSyncStore } from '../remote-sync/helpers';

eventBus.on('USER_LOGGED_IN', () => {
  userSignin();
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
  clearRemoteSyncStore();
});

ipcMain.on('USER_LOGIN_FAILED', (_, email: string) => {
  userSigninFailed(email);
});
