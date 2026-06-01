import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FileTrasher } from '../../../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { trashFile } from './trash-file';
import { call } from '../../../../../../../tests/vitest/utils.helper';

const fileAttrs: FileAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contentsId: 'aabbccddeeff001122334455',
  folderId: 0,
  createdAt: new Date().toISOString(),
  modificationTime: new Date().toISOString(),
  path: '/folder/file.txt',
  size: 100,
  updatedAt: new Date().toISOString(),
  status: FileStatuses.EXISTS,
};

describe('trash-file', () => {
  const file = File.from(fileAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let trasherMock: ReturnType<typeof mockDeep<FileTrasher>>;
  let messengerMock: ReturnType<typeof mockDeep<SyncFileMessenger>>;

  const props = { file, container: undefined as unknown as Container };

  beforeEach(() => {
    trasherMock = mockDeep<FileTrasher>();
    messengerMock = mockDeep<SyncFileMessenger>();
    container = mockDeep<Container>();
    container.get.calledWith(FileTrasher).mockReturnValue(trasherMock);
    container.get.calledWith(SyncFileMessenger).mockReturnValue(messengerMock);
    props.container = container;
  });

  it('should return success when file is trashed', async () => {
    // Given
    trasherMock.run.mockResolvedValue(undefined);

    // When
    const result = await trashFile(props);

    // Then
    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    call(trasherMock.run).toBe(file.contentsId);
  });

  it('should report DELETE_ERROR and return FuseError when trasher throws FuseError', async () => {
    // Given
    const fuseError = new FuseError(FuseCodes.EIO, 'io error');
    trasherMock.run.mockRejectedValue(fuseError);

    // When
    const result = await trashFile(props);

    // Then
    expect(result.error).toBe(fuseError);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', name: file.name });
  });

  it('should report DELETE_ERROR with cause from DriveDesktopError', async () => {
    // Given
    const domainError = new DriveDesktopError('NOT_EXISTS', 'not found');
    trasherMock.run.mockRejectedValue(domainError);

    // When
    const result = await trashFile(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', cause: 'NOT_EXISTS', name: file.name });
  });

  it('should report DELETE_ERROR with UNKNOWN cause for non-DriveDesktopError throws', async () => {
    // Given
    trasherMock.run.mockRejectedValue(new Error('unexpected'));

    // When
    const result = await trashFile(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'DELETE_ERROR', cause: 'UNKNOWN', name: file.name });
  });
});
