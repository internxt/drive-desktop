import { clientMock } from 'tests/vitest/mocks.helper.test';
import { getDevice } from './get-device';

describe('get-device', () => {
  it('should return NOT_FOUND error when device does not exist', async () => {
    clientMock.GET.mockResolvedValue({ response: { status: 404, headers: new Map() } });
    const { error } = await getDevice({ deviceUuid: 'uuid' });
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
