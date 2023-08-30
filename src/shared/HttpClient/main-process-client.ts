import { Axios } from 'axios';
import { Storage } from '@internxt/sdk/dist/drive';

import packageConfig from '../../../package.json';
import { onUserUnauthorized } from '../../main/auth/handlers';
import {
  getHeaders,
  getNewApiHeaders,
  obtainToken,
} from '../../main/auth/service';
import { AuthorizedClients } from './Clients';
import { AuthorizedHttpClient } from './HttpClient';

const headersProvider = () => Promise.resolve(getHeaders(false));
const newHeadersProvider = () => Promise.resolve(getNewApiHeaders());

let client: AuthorizedHttpClient | null = null;
let newClient: AuthorizedHttpClient | null = null;
let storageSdk: Storage | null = null;

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

export function getStorageSdk(): Storage {
  if (storageSdk) return storageSdk;

  const appDetails = {
    clientName: 'drive-desktop',
    clientVersion: packageConfig.version,
  };

  const token = obtainToken('bearerToken');
  const apiSecurity = {
    token,
    unauthorizedCallback: onUserUnauthorized,
  };
  storageSdk = Storage.client(
    process.env.API_URL + '/api',
    appDetails,
    apiSecurity
  );

  return storageSdk;
}

export function getClients(): AuthorizedClients {
  return {
    drive: getClient(),
    newDrive: getNewTokenClient(),
  };
}
