import { Axios } from 'axios';

import { onUserUnauthorized } from '../../main/auth/handlers';
import { getHeaders, getNewApiHeaders } from '../../main/auth/service';
import { AuthorizedClients } from './Clients';
import { AuthorizedHttpClient } from './AuthorizedHttpClient';
import { syncBlocked } from '../../main/analytics/service';

const headersProvider = () => Promise.resolve(getHeaders(false));
const newHeadersProvider = () => Promise.resolve(getNewApiHeaders());
const syncBlockedTracker = async () => {
  syncBlocked();
};

let client: AuthorizedHttpClient | null = null;
let newClient: AuthorizedHttpClient | null = null;

export function getClient(): Axios {
  if (!client) {
    client = new AuthorizedHttpClient(headersProvider, onUserUnauthorized, syncBlockedTracker);
  }

  return client.client;
}

export function getNewTokenClient(): Axios {
  if (!newClient) {
    newClient = new AuthorizedHttpClient(newHeadersProvider, onUserUnauthorized, syncBlockedTracker);
  }

  return newClient.client;
}

export function getClients(): AuthorizedClients {
  return {
    drive: getClient(),
    newDrive: getNewTokenClient(),
  };
}
