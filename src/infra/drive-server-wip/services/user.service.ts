import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../in/client-wrapper.service';

export class UserService {
  getUsage() {
    const promise = client.GET('/users/usage');

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get usage request was not successful',
        attributes: {
          method: 'GET',
          endpoint: '/users/usage',
        },
      },
    });
  }

  getLimit() {
    const promise = client.GET('/users/limit');

    return clientWrapper({
      promise,
      loggerBody: {
        msg: 'Get limit request was not successful',
        attributes: {
          method: 'GET',
          endpoint: '/users/limit',
        },
      },
    });
  }
}
