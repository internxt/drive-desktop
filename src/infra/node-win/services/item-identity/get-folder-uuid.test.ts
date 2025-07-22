import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as getFolderIdentity from './get-folder-identity';
import * as getConfig from '@/apps/sync-engine/config';
import { GetFolderIdentityError } from './get-folder-identity';
import { getFolderUuid } from './get-folder-uuid';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('get-folder-uuid', () => {
  const getFolderIdentityMock = partialSpyOn(getFolderIdentity, 'getFolderIdentity');
  const getConfigMock = partialSpyOn(getConfig, 'getConfig');

  let props: Parameters<typeof getFolderUuid>[0];

  beforeEach(() => {
    getConfigMock.mockReturnValue({ rootUuid: 'rootUuid' });
    props = mockProps<typeof getFolderUuid>({
      drive: { syncRootPath: 'C:\\Users\\user\\InternxtDrive\\' as AbsolutePath },
    });
  });

  it('If it is relative root path, then return the root uuid', () => {
    // Given
    props.path = '/';
    // When
    const uuid = getFolderUuid(props);
    // Then
    expect(uuid).toStrictEqual({ data: 'rootUuid' });
  });

  it('If it is absolute root path, then return the root uuid', () => {
    // Given
    props.path = 'C:\\Users\\user\\InternxtDrive\\';
    // When
    const uuid = getFolderUuid(props);
    // Then
    expect(uuid).toStrictEqual({ data: 'rootUuid' });
  });

  it('If it is absolute root path without trailing slash, then return the root uuid', () => {
    // Given
    props.path = 'C:\\Users\\user\\InternxtDrive';
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
    const error = new GetFolderIdentityError('NON_EXISTS');
    getFolderIdentityMock.mockReturnValueOnce({ error });
    // When
    const uuid = getFolderUuid(props);
    // Then
    expect(uuid).toStrictEqual({ error });
  });
});
