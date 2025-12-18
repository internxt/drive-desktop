import { logger } from '@internxt/drive-desktop-core/build/backend';

const httpRequest: typeof fetch = (...args) => {
  return fetch(...args).then((res) => {
    if (res.status === 401) {
      logger.warn({ tag: 'AUTH', msg: 'Request unauthorized' });
      window.electron.userIsUnauthorized();
    }

    return res;
  });
};

export default httpRequest;
