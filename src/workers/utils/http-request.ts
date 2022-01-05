import { ipcRenderer } from 'electron';

const userIsUnauthorized = () => {
  ipcRenderer.send('user-is-unauthorized');
};

const httpRequest: typeof fetch = (...args) => {
  return fetch(...args).then((res) => {
    if (res.status === 401) {
      userIsUnauthorized();
    }
    return res;
  });
};

export default httpRequest;
