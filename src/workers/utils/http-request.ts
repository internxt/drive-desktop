import { ipcRenderer } from 'electron';
import configStore from '../../main/config';

const userIsUnauthorized = () => {
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
