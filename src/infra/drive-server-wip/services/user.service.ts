import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '@/infra/drive-server-wip/in/client-wrapper.service';

export class UserService {
  async getUsage() {
    const promise = client.GET('/users/usage');

    return await clientWrapper({
      promise: () => promise,
      loggerBody: {
        msg: 'Get usage request',
        attributes: {
          method: 'GET',
          endpoint: '/users/usage',
        },
      },
    });
  }

  async getLimit() {
    const promise = client.GET('/users/limit');

    return await clientWrapper({
      promise: () => promise,
      loggerBody: {
        msg: 'Get limit request',
        attributes: {
          method: 'GET',
          endpoint: '/users/limit',
        },
      },
    });
  }
}
