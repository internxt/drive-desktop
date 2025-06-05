import { client } from '@/apps/shared/HttpClient/client';
import { retryWrapper } from '../out/retry-wrapper';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';

export class UserService {
  getUsage() {
    const promise = () =>
      clientWrapper({
        promise: client.GET('/users/usage'),
        loggerBody: {
          msg: 'Get usage request was not successful',
          attributes: {
            method: 'GET',
            endpoint: '/users/usage',
          },
        },
      });

    return retryWrapper({ promise });
  }

  getLimit() {
    const promise = () =>
      clientWrapper({
        promise: client.GET('/users/limit'),
        loggerBody: {
          msg: 'Get limit request was not successful',
          attributes: {
            method: 'GET',
            endpoint: '/users/limit',
          },
        },
      });

    return retryWrapper({ promise });
  }
}
