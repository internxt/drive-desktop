import { getDevice } from './get-device';
import { client } from '@/apps/shared/HttpClient/client';

describe('get-device', () => {
  const clientMock = vi.mocked(client);

  it('Should return NOT_FOUND error when device does not exist', async () => {
    clientMock.GET.mockResolvedValue({ response: { status: 404 } });
    const { error } = await getDevice({ deviceUuid: 'uuid' });
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
