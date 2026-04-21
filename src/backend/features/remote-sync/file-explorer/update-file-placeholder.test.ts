import { rename } from 'node:fs/promises';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { testLogger, testLoggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import * as needsToBeMoved from './needs-to-be-moved';
import { updateFilePlaceholder } from './update-file-placeholder';

vi.mock(import('node:fs/promises'));

describe('update-file-placeholder', () => {
  const createFilePlaceholderMock = partialSpyOn(Addon, 'createFilePlaceholder');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const setPinStateMock = partialSpyOn(Addon, 'setPinState');
  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const needsToBeMovedMock = partialSpyOn(needsToBeMoved, 'needsToBeMoved');
  const renameMock = vi.mocked(rename);

  const date = '2000-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: TestProps<typeof updateFilePlaceholder>;

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });

    props = {
      ctx: { logger: testLogger },
      isFirstExecution: false,
      files: new Map([['uuid' as FileUuid, { path: 'localPath' as AbsolutePath }]]),
      remote: {
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FileUuid,
        createdAt: date,
        updatedAt: date,
        size: 1024,
      },
    };
  });

  it('should do nothing if name is invalid', async () => {
    // Given
    validateWindowsNameMock.mockReturnValue({ isValid: false });
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(needsToBeMovedMock).toHaveLength(0);
  });

  it('should create placeholder if file does not exist locally', async () => {
    // Given
    props.files = new Map();
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(needsToBeMovedMock).toHaveLength(0);
    call(createFilePlaceholderMock).toStrictEqual({
      path: 'remotePath',
      placeholderId: 'FILE:uuid',
      size: 1024,
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should reset pin state if file is partially hydrated', async () => {
    // Given
    props.isFirstExecution = true;
    props.files = new Map([
      [
        'uuid' as FileUuid,
        { path: 'remotePath' as AbsolutePath, stats: { size: 1024 }, placeholder: { pinState: PinState.AlwaysLocal, onDiskSize: 512 } },
      ],
    ]);
    // When
    await updateFilePlaceholder(props as any);
    // Then
    call(testLoggerFn).toStrictEqual({ msg: 'File stuck in hydrated state', onDiskSize: 512, size: 1024, path: 'remotePath' });
    call(setPinStateMock).toStrictEqual({ path: 'remotePath', pinState: PinState.Unspecified });
  });

  it('should move placeholder if it has been moved', async () => {
    // Given
    needsToBeMovedMock.mockResolvedValue(true);
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(createFilePlaceholderMock).toHaveLength(0);
    call(renameMock).toStrictEqual(['localPath', 'remotePath']);
    call(updateSyncStatusMock).toStrictEqual({ path: 'remotePath' });
  });

  it('should do nothing if not moved', async () => {
    // Given
    needsToBeMovedMock.mockResolvedValue(false);
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(createFilePlaceholderMock).toHaveLength(0);
    calls(renameMock).toHaveLength(0);
  });

  it('should capture exception if something fails', async () => {
    // Given
    validateWindowsNameMock.mockImplementation(() => {
      throw new Error('Something failed');
    });
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(needsToBeMovedMock).toHaveLength(0);
    call(testLoggerFn).toMatchObject({ msg: 'Error updating file placeholder' });
  });
});
