/**TODO: DELETE DEAD CODE*/
import { ipcRenderer } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';

import configStore from '../../apps/main/config';

const userIsUnauthorized = () => {
  logger.warn({ tag: 'AUTH', msg: 'Request unauthorized' });
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
