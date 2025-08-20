import * as updateContentsIdModule from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';
import { syncModifiedFile } from './sync-modified-file';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { Stats } from 'fs';

describe('sync-modified-file', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const fileContentsUploader = mockDeep<ContentsUploader>();
  const updateContentsIdMock = partialSpyOn(updateContentsIdModule, 'updateContentsId');
  const pathUtilsMock = partialSpyOn(pathUtils, 'absoluteToRelative');

  const createRemoteFile = (size: number, uuid: string) =>
    mockProps({
      uuid,
      name: 'test.txt',
      path: createRelativePath('/test.txt'),
      size,
    });

  beforeEach(() => {
    pathUtilsMock.mockReturnValue(createRelativePath('/test.txt'));
  });

  it('should not update remote file if local and remote file sizes are equal', async () => {
    // Given
    const fileSize = 1000;
    const remoteFile = createRemoteFile(fileSize, '123e4567-e89b-12d3-a456-426614174000');
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt' as AbsolutePath,
      stats: {
        mtime: new Date('2025-08-05T10:00:00.000Z'),
        size: fileSize,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });

  it('should update remote file if local and remote file sizes are different', async () => {
    // Given
    const remoteSize = 1000;
    const localSize = 1500;
    const remoteFile = createRemoteFile(remoteSize, '123e4567-e89b-12d3-a456-426614174000');
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt' as AbsolutePath,
      stats: {
        mtime: new Date('2025-08-05T10:00:00.000Z'),
        size: localSize,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
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

  it('should not update if file sizes are identical', async () => {
    // Given
    const fileSize = 2000;
    const remoteFile = createRemoteFile(fileSize, '123e4567-e89b-12d3-a456-426614174000');
    const localFile = {
      path: 'C:\\Users\\test\\Drive\\test.txt' as AbsolutePath,
      stats: {
        mtime: new Date('2025-08-05T10:00:00.456Z'),
        size: fileSize,
      } as Stats,
    };
    // When
    await syncModifiedFile({
      remoteFile,
      localFile,
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });
});
