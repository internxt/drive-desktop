import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getFileIdentity } from './get-file-identity';
import { getFileUuid } from './get-file-uuid';

vi.mock(import('./get-file-identity'));

describe('get-file-uuid', () => {
  const getFileIdentityMock = vi.mocked(getFileIdentity);

  const props = mockProps<typeof getFileUuid>({});

  it('If get file identity returns a placeholder id, then return the uuid', () => {
    // Given
    getFileIdentityMock.mockReturnValueOnce({ data: 'FILE:uuid' });

    // When
    const uuid = getFileUuid(props);

    // Then
    expect(uuid).toStrictEqual({ data: 'uuid' });
  });

  it('If get file identity returns an error, then return the error', () => {
    // Given
    getFileIdentityMock.mockReturnValueOnce({ error: new Error() });

    // When
    const uuid = getFileUuid(props);

    // Then
    expect(uuid).toStrictEqual({ error: new Error() });
  });
});
