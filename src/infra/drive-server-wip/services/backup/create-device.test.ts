import { createDevice } from './create-device';
import { client } from '@/apps/shared/HttpClient/client';

describe('create-device', () => {
  const clientMock = vi.mocked(client);

  it('Should return ALREADY_EXISTS error when device already exists', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 409 } });
    const { error } = await createDevice({ deviceName: 'test' });
    expect(error?.code).toStrictEqual('ALREADY_EXISTS');
  });
});
