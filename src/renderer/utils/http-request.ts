import Logger from 'electron-log';

const httpRequest: typeof fetch = (...args) => {
  return fetch(...args).then((res) => {
    if (res.status === 401) {
      Logger.warn('[AUTH] Request unauthorized');
      window.electron.userIsUnauthorized();
    }
    return res;
  });
};

export default httpRequest;
