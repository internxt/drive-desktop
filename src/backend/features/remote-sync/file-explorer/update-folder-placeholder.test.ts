import { rename } from 'node:fs/promises';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { Lmdb } from '@/infra/lmdb/lmdb';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import * as needsToBeMoved from './needs-to-be-moved';
import { updateFolderPlaceholder } from './update-folder-placeholder';

vi.mock(import('node:fs/promises'));

describe('update-folder-placeholder', () => {
  const lmdbGet = partialSpyOn(Lmdb, 'get');
  const createFolderPlaceholderMock = partialSpyOn(Addon, 'createFolderPlaceholder');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const needsToBeMovedMock = partialSpyOn(needsToBeMoved, 'needsToBeMoved');
  const renameMock = vi.mocked(rename);

  const date = '2000-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: TestProps<typeof updateFolderPlaceholder>;

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });
    lmdbGet.mockReturnValue({ path: 'localPath' as AbsolutePath });

    props = {
      remote: {
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FolderUuid,
        createdAt: date,
        updatedAt: date,
      },
    };
  });

  it('should do nothing if name is invalid', async () => {
    // Given
    validateWindowsNameMock.mockReturnValue({ isValid: false });
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(false);
    expect(needsToBeMovedMock).toBeCalledTimes(0);
  });

  it('should create placeholder if folder does not exist locally', async () => {
    // Given
    lmdbGet.mockReturnValue(undefined);
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(true);
    expect(needsToBeMovedMock).toBeCalledTimes(0);
    expect(createFolderPlaceholderMock).toBeCalledTimes(1);
    expect(createFolderPlaceholderMock).toBeCalledWith({
      path: 'remotePath',
      placeholderId: 'FOLDER:uuid',
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should move placeholder if it has been moved', async () => {
    // Given
    needsToBeMovedMock.mockResolvedValue(true);
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(true);
    expect(createFolderPlaceholderMock).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(1);
    expect(renameMock).toBeCalledWith('localPath', 'remotePath');
    call(updateSyncStatusMock).toStrictEqual({ path: 'remotePath' });
  });

  it('should do nothing if not moved', async () => {
    // Given
    needsToBeMovedMock.mockResolvedValue(false);
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(true);
    expect(createFolderPlaceholderMock).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(0);
  });

  it('should capture exception if something fails', async () => {
    // Given
    validateWindowsNameMock.mockImplementation(() => {
      throw new Error('Something failed');
    });
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(false);
    expect(needsToBeMovedMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
