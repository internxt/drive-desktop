import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import * as updateContentsIdModule from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { FileStatuses } from '@/context/virtual-drive/files/domain/FileStatus';
import { File } from '@/context/virtual-drive/files/domain/File';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { syncModifiedFile } from './sync-modified-file';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { Stats } from 'fs';

describe('sync-modified-file', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const relativePathToAbsoluteConverter = mockDeep<RelativePathToAbsoluteConverter>();
  const fileContentsUploader = mockDeep<ContentsUploader>();

  const updateContentsIdMock = partialSpyOn(updateContentsIdModule, 'updateContentsId');

  beforeEach(() => {
    relativePathToAbsoluteConverter.run.mockReturnValue('C:\\Users\\test\\Drive\\test.txt' as AbsolutePath);
    updateContentsIdMock.mockResolvedValue(undefined);
  });

  it('should not update remote file if local modification time is older', async () => {
    // Given
    const remoteDate = new Date('2025-08-05T10:00:00.123Z');
    const localDate = new Date('2025-08-05T09:59:59.999Z');
    const remoteFile = File.from({
      id: 1,
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      contentsId: '123456789012345678901234',
      folderId: 1,
      folderUuid: '123e4567-e89b-12d3-a456-426614174001',
      path: '/test.txt',
      size: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modificationTime: remoteDate.toISOString(),
      status: FileStatuses.EXISTS,
    });
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt',
      stats: {
        mtime: localDate,
        size: 1000,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
      relativePathToAbsoluteConverter,
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should update remote file if local modification time is newer', async () => {
    // Given
    const remoteDate = new Date('2025-08-05T10:00:00.123Z');
    const localDate = new Date('2025-08-05T10:00:01.000Z');
    const remoteFile = File.from({
      id: 1,
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      contentsId: '123456789012345678901234',
      folderId: 1,
      folderUuid: '123e4567-e89b-12d3-a456-426614174001',
      path: '/test.txt',
      size: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modificationTime: remoteDate.toISOString(),
      status: FileStatuses.EXISTS,
    });
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt',
      stats: {
        mtime: localDate,
        size: 1000,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
      relativePathToAbsoluteConverter,
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).toBeCalledTimes(1);
    expect(updateContentsIdMock).toBeCalledWith({
      virtualDrive,
      stats: localFile.stats,
      path: createRelativePath('/test.txt'),
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      fileContentsUploader,
    });
  });

  it('should not update if timestamps are identical', async () => {
    // Given
    const remoteDate = new Date('2025-08-05T10:00:00.123Z');
    const localDate = new Date('2025-08-05T10:00:00.456Z');
    const remoteFile = File.from({
      id: 1,
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      contentsId: '123456789012345678901234',
      folderId: 1,
      folderUuid: '123e4567-e89b-12d3-a456-426614174001',
      path: '/test.txt',
      size: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modificationTime: remoteDate.toISOString(),
      status: FileStatuses.EXISTS,
    });
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt',
      stats: {
        mtime: localDate,
        size: 1000,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
      relativePathToAbsoluteConverter,
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });
});
