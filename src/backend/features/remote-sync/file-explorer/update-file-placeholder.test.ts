import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { loggerMock, loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import * as checkIfModified from './check-if-modified';
import * as checkIfMoved from './check-if-moved';
import { updateFilePlaceholder } from './update-file-placeholder';

describe('update-file-placeholder', () => {
  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const createFilePlaceholderMock = partialSpyOn(Addon, 'createFilePlaceholder');
  const setPinStateMock = partialSpyOn(Addon, 'setPinState');
  const checkIfMovedMock = partialSpyOn(checkIfMoved, 'checkIfMoved');
  const checkIfModifiedMock = partialSpyOn(checkIfModified, 'checkIfModified');

  const date = '2000-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: TestProps<typeof updateFilePlaceholder>;

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });

    props = {
      ctx: { logger: loggerMock },
      isFirstExecution: false,
      files: new Map([['uuid' as FileUuid, {}]]),
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
    calls(createFilePlaceholderMock).toHaveLength(0);
    calls(checkIfMovedMock).toHaveLength(0);
    calls(checkIfModifiedMock).toHaveLength(0);
  });

  it('should create placeholder if it does not exist locally', async () => {
    // Given
    props.files = new Map();
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(checkIfMovedMock).toHaveLength(0);
    calls(checkIfModifiedMock).toHaveLength(0);
    call(createFilePlaceholderMock).toStrictEqual({
      path: 'remotePath',
      placeholderId: 'FILE:uuid',
      size: 1024,
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should check if placeholder is moved or modified if it already exists locally', async () => {
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(createFilePlaceholderMock).toHaveLength(0);
    calls(checkIfMovedMock).toHaveLength(1);
    calls(checkIfModifiedMock).toHaveLength(1);
  });

  it('should reset pin state if file is partially hydrated', async () => {
    // Given
    props.isFirstExecution = true;
    props.files = new Map([['uuid' as FileUuid, { size: 1024, pinState: PinState.AlwaysLocal, onDiskSize: 512 }]]);
    // When
    await updateFilePlaceholder(props as any);
    // Then
    call(loggerFn).toStrictEqual({ msg: 'File stuck in hydrated state', onDiskSize: 512, size: 1024, path: 'remotePath' });
    call(setPinStateMock).toStrictEqual({ path: 'remotePath', pinState: PinState.Unspecified });
  });

  it('should capture exception if something fails', async () => {
    // Given
    validateWindowsNameMock.mockImplementation(() => {
      throw new Error('Something failed');
    });
    // When
    await updateFilePlaceholder(props as any);
    // Then
    calls(checkIfMovedMock).toHaveLength(0);
    call(loggerFn).toMatchObject([{ msg: 'Error updating file placeholder' }, { uuid: 'uuid' }]);
  });
});
