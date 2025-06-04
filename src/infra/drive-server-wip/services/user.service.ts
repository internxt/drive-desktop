import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';
import { retryWrapper } from '../out/retry-wrapper';

export class UserService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  getUsage() {
    const promise = () =>
      this.clientWrapper.run({
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
      this.clientWrapper.run({
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
