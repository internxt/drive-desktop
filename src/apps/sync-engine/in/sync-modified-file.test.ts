import * as updateContentsIdModule from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
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

  const createRemoteFile = (modificationDate: Date, uuid: string) =>
    mockProps({
      uuid,
      name: 'test.txt',
      path: createRelativePath('/test.txt'),
      modificationTime: modificationDate,
    });

  beforeEach(() => {
    updateContentsIdMock.mockResolvedValue(undefined);
    pathUtilsMock.mockReturnValue(createRelativePath('/test.txt'));
  });

  it('should not update remote file if local modification time is older', async () => {
    // Given
    const remoteDate = new Date('2025-08-05T10:00:00.123Z');
    const localDate = new Date('2025-08-05T09:59:59.999Z');
    const remoteFile = createRemoteFile(remoteDate, '123e4567-e89b-12d3-a456-426614174000');
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
    const remoteFile = createRemoteFile(remoteDate, '123e4567-e89b-12d3-a456-426614174000');
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

  it('should not update if timestamps are identical when rounded to seconds', async () => {
    // Given
    const remoteDate = new Date('2025-08-05T10:00:00.123Z');
    const localDate = new Date('2025-08-05T10:00:00.456Z');
    const remoteFile = createRemoteFile(remoteDate, '123e4567-e89b-12d3-a456-426614174000');
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
      fileContentsUploader,
      virtualDrive,
    });
    // Then
    expect(updateContentsIdMock).not.toBeCalled();
  });
});
