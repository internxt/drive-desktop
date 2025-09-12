/**TODO: DELETE DEAD CODE*/
import { ipcRenderer } from 'electron';
import Logger from 'electron-log';

import configStore from '../../apps/main/config';

const userIsUnauthorized = () => {
  Logger.warn('[AUTH] Request unauthorized');
  ipcRenderer.send('user-is-unauthorized');
};

const httpRequest: typeof fetch = (input, init) => {
  const headers = {
    ...init?.headers,
    'internxt-client-id': configStore.get('clientId'),
  };

  return fetch(input, { ...init, headers }).then((res) => {
    if (res.status === 401) {
      userIsUnauthorized();
    }

    return res;
  });
};

export default httpRequest;
