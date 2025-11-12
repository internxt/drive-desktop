import { mockDeep } from 'vitest-mock-extended';
import { FilePlaceholderUpdater } from './update-file-placeholder';
import VirtualDrive from '@/node-win/virtual-drive';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as hasToBeMoved from './has-to-be-moved';
import { rename } from 'node:fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('node:fs/promises'));

describe('update-file-placeholder', () => {
  const virtualDrive = mockDeep<VirtualDrive>();

  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const hasToBeMovedMock = partialSpyOn(hasToBeMoved, 'hasToBeMoved');
  const renameMock = vi.mocked(rename);

  const date = '2000-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: Parameters<typeof FilePlaceholderUpdater.update>[0];

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });

    props = mockProps<typeof FilePlaceholderUpdater.update>({
      ctx: { virtualDrive },
      files: { ['uuid' as FileUuid]: { path: 'localPath.absolutePath' as AbsolutePath } },
      remote: {
        path: createRelativePath('file1', 'file2'),
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FileUuid,
        createdAt: date,
        updatedAt: date,
        size: 1024,
      },
    });
  });

  it('should do nothing if name is invalid', async () => {
    // Given
    validateWindowsNameMock.mockReturnValue({ isValid: false });
    // When
    await FilePlaceholderUpdater.update(props);
    // Then
    expect(hasToBeMovedMock).toBeCalledTimes(0);
  });

  it('should create placeholder if file does not exist locally', async () => {
    // Given
    props.files = {};
    // When
    await FilePlaceholderUpdater.update(props);
    // Then
    expect(hasToBeMovedMock).toBeCalledTimes(0);
    expect(virtualDrive.createFileByPath).toBeCalledTimes(1);
    expect(virtualDrive.createFileByPath).toBeCalledWith({
      itemPath: '/file1/file2',
      placeholderId: 'FILE:uuid',
      size: 1024,
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should move placeholder if it has been moved', async () => {
    // Given
    hasToBeMovedMock.mockReturnValue(true);
    // When
    await FilePlaceholderUpdater.update(props);
    // Then
    expect(virtualDrive.createFileByPath).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(1);
    expect(renameMock).toBeCalledWith('localPath.absolutePath', 'remotePath');
  });

  it('should do nothing if not moved', async () => {
    // Given
    hasToBeMovedMock.mockReturnValue(false);
    // When
    await FilePlaceholderUpdater.update(props);
    // Then
    expect(virtualDrive.createFileByPath).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(0);
  });

  it('should capture exception if something fails', async () => {
    // Given
    validateWindowsNameMock.mockImplementation(() => {
      throw new Error('Something failed');
    });
    // When
    await FilePlaceholderUpdater.update(props);
    // Then
    expect(hasToBeMovedMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
