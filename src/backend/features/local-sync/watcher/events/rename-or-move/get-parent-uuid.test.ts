import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { getParentUuid } from './get-parent-uuid';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('get-parent-uuid', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');

  let props: Parameters<typeof getParentUuid>[0];

  beforeEach(() => {
    getFolderUuidMock.mockReturnValue({ data: 'newParentUuid' as FolderUuid });

    props = mockProps<typeof getParentUuid>({
      self: { logger: loggerMock },
      path: createRelativePath('folder', 'file.txt'),
      item: {},
    });
  });

  it('should log error and return if item is undefined', () => {
    // Given
    props.item = undefined;
    // When
    const parentUuid = getParentUuid(props);
    // Then
    expect(parentUuid).toBeUndefined();
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should log error and return if parent placeholder is not found', () => {
    // Given
    const error = new GetFolderIdentityError('NON_EXISTS');
    getFolderUuidMock.mockReturnValue({ error });
    // When
    const parentUuid = getParentUuid(props);
    // Then
    expect(parentUuid).toBeUndefined();
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should return parentUuid if parent is found', () => {
    // Given
    getFolderUuidMock.mockReturnValue({ data: 'newParentUuid' as FolderUuid });
    // When
    const parentUuid = getParentUuid(props);
    // Then
    expect(getFolderUuidMock).toBeCalledWith(expect.objectContaining({ path: '/folder' }));
    expect(parentUuid).toBe('newParentUuid');
  });
});
