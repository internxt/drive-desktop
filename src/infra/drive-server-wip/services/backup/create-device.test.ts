import { clientMock } from 'tests/vitest/mocks.helper.test';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { createDevice } from './create-device';

describe('create-device', () => {
  const props = mockProps<typeof createDevice>({});

  it('should return ALREADY_EXISTS error when device already exists', async () => {
    // Given
    clientMock.POST.mockResolvedValue({ response: { status: 409, headers: new Map() } });
    // When
    const { error } = await createDevice(props);
    // Then
    expect(error?.code).toStrictEqual('ALREADY_EXISTS');
  });
});
