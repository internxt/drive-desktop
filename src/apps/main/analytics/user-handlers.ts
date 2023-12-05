import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import {
  sendFeedback,
  userLogout,
  userSignin,
  userSigninFailed,
} from './service';
import { clearRemoteSyncStore } from '../remote-sync/helpers';
import { clearTempFolder } from '../app-info/helpers';

eventBus.on('USER_LOGGED_IN', () => {
  userSignin();
  clearTempFolder();
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
  clearRemoteSyncStore();
  clearTempFolder();
});

ipcMain.on('USER_LOGIN_FAILED', (_, email: string) => {
  userSigninFailed(email);
});

ipcMain.handle('send-feedback', (_, feedback: string) => {
  return sendFeedback(feedback);
});
