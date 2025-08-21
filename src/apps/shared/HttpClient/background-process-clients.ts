import { ipcRenderer } from 'electron';
import { AuthorizedHttpClient } from './AuthorizedHttpClient';
import { AuthorizedClients } from './Clients';

export const onUserUnauthorized = () =>
  ipcRenderer.emit('user-is-unauthorized');

const driveHeadersProvider = () => ipcRenderer.invoke('get-headers');
const newDriveHeadersProvider = () =>
  ipcRenderer.invoke('get-headers-for-new-api');
const syncBlockedTracker = async () => {
  // TODO: implement the function
  // no-op
};
let clients: AuthorizedClients | null = null;

export function getClients(): AuthorizedClients {
  if (!clients) {
    clients = {
      drive: new AuthorizedHttpClient(
        driveHeadersProvider,
        onUserUnauthorized,
        syncBlockedTracker
      ).client,
      newDrive: new AuthorizedHttpClient(
        newDriveHeadersProvider,
        onUserUnauthorized,
        syncBlockedTracker
      ).client,
    };
  }

  return clients;
}
