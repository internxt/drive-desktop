import { clientMock } from 'tests/vitest/mocks.helper.test';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getDevice } from './get-device';

describe('get-device', () => {
  const props = mockProps<typeof getDevice>({});

  it('should return NOT_FOUND error when device does not exist', async () => {
    // Given
    clientMock.GET.mockResolvedValue({ response: { status: 404, headers: new Map() } });
    // When
    const { error } = await getDevice(props);
    // Then
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
