import { Axios } from 'axios';

import { getHeaders, getNewApiHeaders } from '../../main/auth/service';
import { AuthorizedClients } from './Clients';
import { AuthorizedHttpClient } from './HttpClient';
import { ipcMain } from 'electron';

const onUserUnauthorized = () => ipcMain.emit('user-is-unauthorized');

const headersProvider = () => Promise.resolve(getHeaders(false));
const newHeadersProvider = () => Promise.resolve(getNewApiHeaders());

let client: AuthorizedHttpClient | null = null;
let newClient: AuthorizedHttpClient | null = null;

export function getClient(): Axios {
  if (!client) {
    client = new AuthorizedHttpClient(headersProvider, onUserUnauthorized);
  }

  return client.client;
}

export function getNewTokenClient(): Axios {
  if (!newClient) {
    newClient = new AuthorizedHttpClient(
      newHeadersProvider,
      onUserUnauthorized
    );
  }

  return newClient.client;
}

export function getClients(): AuthorizedClients {
  return {
    drive: getClient(),
    newDrive: getNewTokenClient(),
  };
}
