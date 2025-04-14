import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';

export class UserService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  getUsage() {
    const promise = client.GET('/users/usage');

    return this.clientWrapper.run({
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

    return this.clientWrapper.run({
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
