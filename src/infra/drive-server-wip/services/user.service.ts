import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';

export class UserService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async getUsage() {
    const promise = client.GET('/users/usage');

    return await this.clientWrapper.run({
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

  async getLimit() {
    const promise = client.GET('/users/limit');

    return await this.clientWrapper.run({
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
