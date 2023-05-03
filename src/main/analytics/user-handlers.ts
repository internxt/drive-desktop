import { ipcMain } from 'electron';

import eventBus from '../event-bus';
import { userLogout, userSignin, userSigninFailed } from './service';

eventBus.on('USER_LOGGED_IN', () => {
	userSignin();
});

eventBus.on('USER_LOGGED_OUT', () => {
	userLogout();
});

ipcMain.on('USER_LOGIN_FAILED', (_, email: string) => {
	userSigninFailed(email);
});
