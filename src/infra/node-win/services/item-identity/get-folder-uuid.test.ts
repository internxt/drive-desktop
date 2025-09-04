import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as getFolderIdentity from './get-folder-identity';
import { GetFolderIdentityError } from './get-folder-identity';
import { getFolderUuid } from './get-folder-uuid';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-folder-uuid', () => {
  const getFolderIdentityMock = partialSpyOn(getFolderIdentity, 'getFolderIdentity');

  let props: Parameters<typeof getFolderUuid>[0];

  beforeEach(() => {
    props = mockProps<typeof getFolderUuid>({
      ctx: {
        rootUuid: 'rootUuid' as FolderUuid,
        virtualDrive: { syncRootPath: 'C:\\Users\\user\\InternxtDrive\\' as AbsolutePath },
        rootUuid: 'rootUuid' as FolderUuid,
      },
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
