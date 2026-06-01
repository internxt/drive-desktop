import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FilePathUpdater } from '../../../../../../context/virtual-drive/files/application/move/FilePathUpdater';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import { SyncFileMessenger } from '../../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { DriveDesktopError } from '../../../../../../context/shared/domain/errors/DriveDesktopError';
import { moveFile } from './move-file';
import { call } from '../../../../../../../tests/vitest/utils.helper';

const fileAttrs: FileAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contentsId: 'aabbccddeeff001122334455',
  folderId: 0,
  createdAt: new Date().toISOString(),
  modificationTime: new Date().toISOString(),
  path: '/old/file.txt',
  size: 100,
  updatedAt: new Date().toISOString(),
  status: FileStatuses.EXISTS,
};

describe('move-file', () => {
  const file = File.from(fileAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let updaterMock: ReturnType<typeof mockDeep<FilePathUpdater>>;
  let messengerMock: ReturnType<typeof mockDeep<SyncFileMessenger>>;

  const props = { file, src: '/old/file.txt', dest: '/new/file.txt', container: undefined as unknown as Container };

  beforeEach(() => {
    updaterMock = mockDeep<FilePathUpdater>();
    messengerMock = mockDeep<SyncFileMessenger>();
    container = mockDeep<Container>();
    container.get.calledWith(FilePathUpdater).mockReturnValue(updaterMock);
    container.get.calledWith(SyncFileMessenger).mockReturnValue(messengerMock);
    props.container = container;
  });

  it('should notify renaming and renamed and return success', async () => {
    // Given
    updaterMock.run.mockResolvedValue(undefined);

    // When
    const result = await moveFile(props);

    // Then
    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    call(updaterMock.run).toStrictEqual([file.contentsId, '/new/file.txt']);
  });

  it('should notify renaming before and renamed after update', async () => {
    // Given
    const order: string[] = [];
    messengerMock.renaming.mockImplementation(async () => {
      order.push('renaming');
    });
    updaterMock.run.mockImplementation(async () => {
      order.push('run');
    });
    messengerMock.renamed.mockImplementation(async () => {
      order.push('renamed');
    });

    // When
    await moveFile(props);

    // Then
    expect(order).toStrictEqual(['renaming', 'run', 'renamed']);
  });

  it('should report RENAME_ERROR with src basename and return FuseError when updater throws FuseError', async () => {
    // Given
    const fuseError = new FuseError(FuseCodes.EIO, 'io error');
    updaterMock.run.mockRejectedValue(fuseError);

    // When
    const result = await moveFile(props);

    // Then
    expect(result.error).toBe(fuseError);
    call(messengerMock.issues).toMatchObject({ error: 'RENAME_ERROR', name: 'file.txt' });
  });

  it('should report RENAME_ERROR with cause from DriveDesktopError', async () => {
    // Given
    const domainError = new DriveDesktopError('NOT_EXISTS', 'not found');
    updaterMock.run.mockRejectedValue(domainError);

    // When
    const result = await moveFile(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'RENAME_ERROR', cause: 'NOT_EXISTS', name: 'file.txt' });
  });

  it('should report RENAME_ERROR with UNKNOWN cause for non-DriveDesktopError throws', async () => {
    // Given
    updaterMock.run.mockRejectedValue(new Error('unexpected'));

    // When
    const result = await moveFile(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issues).toMatchObject({ error: 'RENAME_ERROR', cause: 'UNKNOWN', name: 'file.txt' });
  });
});
