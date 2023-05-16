import { ipcRenderer } from 'electron';
import { AuthorizedClients } from '../../shared/HttpClient/Clients';
import { AuthorizedHttpClient } from '../../shared/HttpClient/HttpClient';

const onUserUnauthorized = () => ipcRenderer.emit('user-is-unauthorized');

const davAccessControlHeaders = {
  'Access-Control-Allow-Headers': 'dav://localhost:1900',
};

const driveHeadersProvider = async () => {
  const base = await ipcRenderer.invoke('get-headers');

  return {
    ...base,
    ...davAccessControlHeaders,
  };
};

const newDriveHeadersProvider = async () => {
  const base = await ipcRenderer.invoke('get-headers-for-new-api');

  return {
    ...base,
    ...davAccessControlHeaders,
  };
};

let clients: AuthorizedClients | null = null;

export function httpClient(): AuthorizedClients {
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
