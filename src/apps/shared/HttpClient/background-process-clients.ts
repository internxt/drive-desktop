import { ipcRenderer } from 'electron';

import { AuthorizedClients } from './Clients';
import { AuthorizedHttpClient } from './HttpClient';

export const onUserUnauthorized = () =>
  ipcRenderer.emit('user-is-unauthorized');

const driveHeadersProvider = () => ipcRenderer.invoke('get-headers');
const newDriveHeadersProvider = () =>
  ipcRenderer.invoke('get-headers-for-new-api');

let clients: AuthorizedClients | null = null;

export function getClients(): AuthorizedClients {
  if (!clients) {
    clients = {
      drive: new AuthorizedHttpClient(driveHeadersProvider, onUserUnauthorized)
        .client,
      newDrive: new AuthorizedHttpClient(
        newDriveHeadersProvider,
        onUserUnauthorized
      ).client,
    };
  }

  return clients;
}
