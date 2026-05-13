import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import * as checkIfMoved from './check-if-moved';
import { updateFolderPlaceholder } from './update-folder-placeholder';

describe('update-folder-placeholder', () => {
  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const createFolderPlaceholderMock = partialSpyOn(Addon, 'createFolderPlaceholder');
  const checkIfMovedMock = partialSpyOn(checkIfMoved, 'checkIfMoved');

  const date = '2000-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: TestProps<typeof updateFolderPlaceholder>;

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });

    props = {
      ctx: { logger: loggerMock },
      folders: new Map([['uuid' as FolderUuid, {}]]),
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
    calls(createFolderPlaceholderMock).toHaveLength(0);
    calls(checkIfMovedMock).toHaveLength(0);
  });

  it('should create placeholder if it does not exist locally', async () => {
    // Given
    props.folders = new Map();
    // When
    const res = await updateFolderPlaceholder(props as any);
    // Then
    expect(res).toBe(true);
    calls(checkIfMovedMock).toHaveLength(0);
    call(createFolderPlaceholderMock).toStrictEqual({
      path: 'remotePath',
      placeholderId: 'FOLDER:uuid',
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should check if placeholder is moved or modified if it already exists locally', async () => {
    // When
    await updateFolderPlaceholder(props as any);
    // Then
    calls(createFolderPlaceholderMock).toHaveLength(0);
    calls(checkIfMovedMock).toHaveLength(1);
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
    expect(checkIfMovedMock).toBeCalledTimes(0);
    call(loggerFn).toMatchObject([{ msg: 'Error updating folder placeholder' }, { uuid: 'uuid' }]);
  });
});
