import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { userSignin, userLogout, userSigninFailded } from './service';

eventBus.on('USER_LOGGED_IN', () => {
  userSignin();
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
});

ipcMain.on('user-loging-failed', (_, email: string) => {
  userSigninFailded(email);
});
