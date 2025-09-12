/** TODO: DELETE DEAD CODE */
import { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { AuthorizedHttpClient } from './AuthorizedHttpClient';

const URL = 'http://jibuwsik.ie/ugco';

describe.skip('Authorized Http Client', () => {
  const headerProvider = jest.fn();
  const unauthorizedNotifier = jest.fn();
  const syncBlockedTracker = jest.fn();

  let client: AxiosInstance;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new AuthorizedHttpClient(
      headerProvider,
      unauthorizedNotifier,
      syncBlockedTracker
    ).client;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock = new MockAdapter(client as any);

    mock.reset();
    headerProvider.mockReset();
    unauthorizedNotifier.mockReset();
  });

  it('executes the headerProvider to get the headers', async () => {
    const headers = {
      'internxt-client': 'desktop-test',
      Authorization: 'Bearer ZogMBxSazmVGVEZi4zj4HHDjQTRKUt',
    };
    headerProvider.mockImplementationOnce(() => headers);

    mock.onGet(URL, undefined, { ...headers }).reply(100);

    await client.get(URL);

    expect(headerProvider).toBeCalledTimes(1);
  });

  it('executes the unnauthorized callback when an unnauthorized response is returned', async () => {
    mock.onGet(URL).reply(401);

    await client.get(URL);
    expect(unauthorizedNotifier).toHaveBeenCalled();
  });
});
