import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FolderDeleter } from '../../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { Folder, FolderAttributes } from '../../../../../../context/virtual-drive/folders/domain/Folder';
import { FolderStatuses } from '../../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { trashFolder } from './trash-folder';
import { call } from '../../../../../../../tests/vitest/utils.helper';

const folderAttrs: FolderAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  parentId: 0,
  path: '/folder',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: FolderStatuses.EXISTS,
};

describe('trash-folder', () => {
  const folder = Folder.from(folderAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let deleterMock: ReturnType<typeof mockDeep<FolderDeleter>>;
  let messengerMock: ReturnType<typeof mockDeep<SyncFileMessenger>>;

  const props = { folder, container: undefined as unknown as Container };

  beforeEach(() => {
    deleterMock = mockDeep<FolderDeleter>();
    messengerMock = mockDeep<SyncFileMessenger>();
    container = mockDeep<Container>();
    container.get.calledWith(FolderDeleter).mockReturnValue(deleterMock);
    container.get.calledWith(SyncFileMessenger).mockReturnValue(messengerMock);
    props.container = container;
  });

  it('should return success when folder is trashed', async () => {
    // Given
    deleterMock.run.mockResolvedValue(undefined);

    // When
    const result = await trashFolder(props);

    // Then
    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    call(deleterMock.run).toBe(folder.uuid);
  });

  it('should report DELETE_ERROR and return FuseError when deleter throws FuseError', async () => {
    // Given
    const fuseError = new FuseError(FuseCodes.EIO, 'io error');
    deleterMock.run.mockRejectedValue(fuseError);

    // When
    const result = await trashFolder(props);

    // Then
    expect(result.error).toBe(fuseError);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', name: folder.name });
  });

  it('should report DELETE_ERROR with cause from DriveDesktopError', async () => {
    // Given
    const domainError = new DriveDesktopError('NOT_EXISTS', 'not found');
    deleterMock.run.mockRejectedValue(domainError);

    // When
    const result = await trashFolder(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', cause: 'NOT_EXISTS', name: folder.name });
  });

  it('should report DELETE_ERROR with UNKNOWN cause for non-DriveDesktopError throws', async () => {
    // Given
    deleterMock.run.mockRejectedValue(new Error('unexpected'));

    // When
    const result = await trashFolder(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', cause: 'UNKNOWN', name: folder.name });
  });
});
