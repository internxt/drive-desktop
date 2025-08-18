import * as loadInMemoryPathsModule from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { createRelativePath, AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as syncModifiedFileModule from './sync-modified-file';
import * as remoteItemsGeneratorModule from '@/context/virtual-drive/items/application/remote-items-generator';
import { syncModifiedFiles } from './sync-modified-files';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { Stats } from 'fs';

describe('sync-modified-files', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const fileContentsUploader = mockDeep<ContentsUploader>();

  const loadInMemoryPathsMock = partialSpyOn(loadInMemoryPathsModule, 'loadInMemoryPaths');
  const syncModifiedFileMock = partialSpyOn(syncModifiedFileModule, 'syncModifiedFile');
  const getExistingFilesMock = partialSpyOn(remoteItemsGeneratorModule, 'getExistingFiles');

  const createRemoteFile = (uuid: FileUuid, name = 'test.txt') =>
    mockProps({
      uuid,
      name,
      path: createRelativePath(`/${name}`),
      modificationTime: new Date('2025-08-05T10:00:00.123Z'),
    });

  const createLocalFile = (path = 'C:\\Users\\test\\Drive\\test.txt') => ({
    path: path as AbsolutePath,
    stats: {
      mtime: new Date('2025-08-05T10:00:01.000Z'),
      size: 1000,
    } as Stats,
  });

  beforeEach(() => {
    syncModifiedFileMock.mockResolvedValue(undefined);
  });

  it('should sync all files that exist both remotely and locally', async () => {
    // Given
    const file1Uuid = '123e4567-e89b-12d3-a456-426614174000' as FileUuid;
    const file2Uuid = '987fcdeb-51a2-43d7-b123-456789abcdef' as FileUuid;
    const file3Uuid = 'abcd1234-5678-90ef-ghij-klmnopqrstuv' as FileUuid;

    const remoteFile1 = createRemoteFile(file1Uuid, 'file1.txt');
    const remoteFile2 = createRemoteFile(file2Uuid, 'file2.txt');
    const remoteFile3 = createRemoteFile(file3Uuid, 'file3.txt');

    const localFile1 = createLocalFile('C:\\Users\\test\\Drive\\file1.txt');
    const localFile2 = createLocalFile('C:\\Users\\test\\Drive\\file2.txt');

    getExistingFilesMock.mockResolvedValue([remoteFile1, remoteFile2, remoteFile3]);

    loadInMemoryPathsMock.mockResolvedValue({
      files: {
        [file1Uuid]: localFile1,
        [file2Uuid]: localFile2,
      },
      folders: {},
    });
    // When
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });
    // Then
    expect(syncModifiedFileMock).toBeCalledTimes(2);
    expect(syncModifiedFileMock).toHaveBeenNthCalledWith(1, {
      remoteFile: remoteFile1,
      localFile: localFile1,
      fileContentsUploader,
      virtualDrive,
    });
    expect(syncModifiedFileMock).toHaveBeenNthCalledWith(2, {
      remoteFile: remoteFile2,
      localFile: localFile2,
      fileContentsUploader,
      virtualDrive,
    });
  });

  it('should not sync files that do not exist locally', async () => {
    // Given
    const file1Uuid = '123e4567-e89b-12d3-a456-426614174000' as FileUuid;
    const file2Uuid = '987fcdeb-51a2-43d7-b123-456789abcdef' as FileUuid;

    const remoteFile1 = createRemoteFile(file1Uuid, 'file1.txt');
    const remoteFile2 = createRemoteFile(file2Uuid, 'file2.txt');

    getExistingFilesMock.mockResolvedValue([remoteFile1, remoteFile2]);

    loadInMemoryPathsMock.mockResolvedValue({
      files: {},
      folders: {},
    });
    // When
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });
    // Then
    expect(syncModifiedFileMock).not.toBeCalled();
  });

  it('should handle empty tree gracefully', async () => {
    // Given
    getExistingFilesMock.mockResolvedValue([]);
    loadInMemoryPathsMock.mockResolvedValue({
      files: {},
      folders: {},
    });
    // When
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });
    // Then
    expect(syncModifiedFileMock).not.toBeCalled();
  });

  it('should handle mixed scenario with some files existing locally and others not', async () => {
    // Given
    const file1Uuid = '123e4567-e89b-12d3-a456-426614174000' as FileUuid;
    const file2Uuid = '987fcdeb-51a2-43d7-b123-456789abcdef' as FileUuid;
    const file3Uuid = 'abcd1234-5678-90ef-ghij-klmnopqrstuv' as FileUuid;
    const file4Uuid = 'def01234-5678-90ab-cdef-ghijklmnopqr' as FileUuid;

    const remoteFile1 = createRemoteFile(file1Uuid, 'file1.txt');
    const remoteFile2 = createRemoteFile(file2Uuid, 'file2.txt');
    const remoteFile3 = createRemoteFile(file3Uuid, 'file3.txt');
    const remoteFile4 = createRemoteFile(file4Uuid, 'file4.txt');

    const localFile1 = createLocalFile('C:\\Users\\test\\Drive\\file1.txt');
    const localFile4 = createLocalFile('C:\\Users\\test\\Drive\\file4.txt');

    getExistingFilesMock.mockResolvedValue([remoteFile1, remoteFile2, remoteFile3, remoteFile4]);

    loadInMemoryPathsMock.mockResolvedValue({
      files: {
        [file1Uuid]: localFile1,
        [file4Uuid]: localFile4,
      },
      folders: {},
    });
    // When
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });
    // Then
    expect(syncModifiedFileMock).toBeCalledTimes(2);
    expect(syncModifiedFileMock).toHaveBeenNthCalledWith(1, {
      remoteFile: remoteFile1,
      localFile: localFile1,
      fileContentsUploader,
      virtualDrive,
    });
    expect(syncModifiedFileMock).toHaveBeenNthCalledWith(2, {
      remoteFile: remoteFile4,
      localFile: localFile4,
      fileContentsUploader,
      virtualDrive,
    });
  });

  it('should handle syncModifiedFile failures without affecting other files', async () => {
    // Given
    const file1Uuid = '123e4567-e89b-12d3-a456-426614174000' as FileUuid;
    const file2Uuid = '987fcdeb-51a2-43d7-b123-456789abcdef' as FileUuid;

    const remoteFile1 = createRemoteFile(file1Uuid, 'file1.txt');
    const remoteFile2 = createRemoteFile(file2Uuid, 'file2.txt');

    const localFile1 = createLocalFile('C:\\Users\\test\\Drive\\file1.txt');
    const localFile2 = createLocalFile('C:\\Users\\test\\Drive\\file2.txt');

    getExistingFilesMock.mockResolvedValue([remoteFile1, remoteFile2]);

    loadInMemoryPathsMock.mockResolvedValue({
      files: {
        [file1Uuid]: localFile1,
        [file2Uuid]: localFile2,
      },
      folders: {},
    });

    syncModifiedFileMock.mockRejectedValueOnce(new Error('Sync failed for file1')).mockResolvedValueOnce(undefined);
    // When
    await expect(syncModifiedFiles({ fileContentsUploader, virtualDrive })).rejects.toThrow();
    // Then
    expect(syncModifiedFileMock).toBeCalledTimes(2);
  });

  it('should wait for all sync operations to complete', async () => {
    // Given
    const file1Uuid = '123e4567-e89b-12d3-a456-426614174000' as FileUuid;
    const file2Uuid = '987fcdeb-51a2-43d7-b123-456789abcdef' as FileUuid;

    const remoteFile1 = createRemoteFile(file1Uuid, 'file1.txt');
    const remoteFile2 = createRemoteFile(file2Uuid, 'file2.txt');

    const localFile1 = createLocalFile('C:\\Users\\test\\Drive\\file1.txt');
    const localFile2 = createLocalFile('C:\\Users\\test\\Drive\\file2.txt');

    getExistingFilesMock.mockResolvedValue([remoteFile1, remoteFile2]);

    loadInMemoryPathsMock.mockResolvedValue({
      files: {
        [file1Uuid]: localFile1,
        [file2Uuid]: localFile2,
      },
      folders: {},
    });

    let call1Resolved = false;
    let call2Resolved = false;

    syncModifiedFileMock
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        call1Resolved = true;
      })
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        call2Resolved = true;
      });
    // When
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });
    // Then
    expect(call1Resolved).toBe(true);
    expect(call2Resolved).toBe(true);
    expect(syncModifiedFileMock).toBeCalledTimes(2);
  });

  it('should handle loadInMemoryPaths failure', async () => {
    // Given
    getExistingFilesMock.mockResolvedValue([createRemoteFile('123e4567-e89b-12d3-a456-426614174000' as FileUuid)]);
    loadInMemoryPathsMock.mockRejectedValue(new Error('Failed to load in-memory paths'));
    // When / Then
    await expect(syncModifiedFiles({ fileContentsUploader, virtualDrive })).rejects.toThrow('Failed to load in-memory paths');
    expect(syncModifiedFileMock).not.toBeCalled();
  });
});
