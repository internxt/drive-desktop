import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import {
  sendFeedback,
  userLogout,
  userSigning,
  userSigningFailed,
} from './service';
import { clearTempFolder } from '../app-info/helpers';

eventBus.on('USER_LOGGED_IN', () => {
  userSigning();
  clearTempFolder();
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
  clearTempFolder();
});

ipcMain.on('USER_LOGIN_FAILED', (_, email: string) => {
  userSigningFailed(email);
});

ipcMain.handle('send-feedback', (_, feedback: string) => {
  return sendFeedback(feedback);
});
