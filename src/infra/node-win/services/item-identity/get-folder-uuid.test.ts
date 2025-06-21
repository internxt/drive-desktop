import { mockProps } from 'tests/vitest/utils.helper.test';
import { getFolderIdentity } from './get-folder-identity';
import { getFolderUuid } from './get-folder-uuid';

vi.mock(import('./get-folder-identity'));

describe('get-folder-uuid', () => {
  const getFolderIdentityMock = vi.mocked(getFolderIdentity);

  const props = mockProps<typeof getFolderUuid>({});

  it('If it is root path, then return the root uuid', () => {
    // Given
    const props = mockProps<typeof getFolderUuid>({ path: '/', rootUuid: 'rootUuid' });

    // When
    const uuid = getFolderUuid(props);

    // Then
    expect(uuid).toStrictEqual({ data: 'rootUuid' });
  });

  it('If get folder identity returns a placeholder id, then return the uuid', () => {
    // Given
    getFolderIdentityMock.mockReturnValueOnce({ data: 'FOLDER:uuid' });

    // When
    const uuid = getFolderUuid(props);

    // Then
    expect(uuid).toStrictEqual({ data: 'uuid' });
  });

  it('If get folder identity returns an error, then return the error', () => {
    // Given
    getFolderIdentityMock.mockReturnValueOnce({ error: new Error() });

    // When
    const uuid = getFolderUuid(props);

    // Then
    expect(uuid).toStrictEqual({ error: new Error() });
  });
});
