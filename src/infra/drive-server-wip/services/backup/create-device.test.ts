import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createDevice } from './create-device';

describe('create-device', () => {
  it('should return ALREADY_EXISTS error when device already exists', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 409, headers: new Map() } });
    const { error } = await createDevice({ deviceName: 'test' });
    expect(error?.code).toStrictEqual('ALREADY_EXISTS');
  });
});
