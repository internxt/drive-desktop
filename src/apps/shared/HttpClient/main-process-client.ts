import { Axios } from 'axios';

import { getNewApiHeaders } from '../../main/auth/service';
import { AuthorizedHttpClient } from './HttpClient';
import { ipcMain } from 'electron';

const onUserUnauthorized = () => ipcMain.emit('USER_IS_UNAUTHORIZED');

const newHeadersProvider = () => Promise.resolve(getNewApiHeaders());

let newClient: AuthorizedHttpClient | null = null;

export function getNewTokenClient(): Axios {
  if (!newClient) {
    newClient = new AuthorizedHttpClient(newHeadersProvider, onUserUnauthorized);
  }

  return newClient.client;
}
