import { mockDeep } from 'vitest-mock-extended';
import { FilePlaceholderUpdater } from './update-file-placeholder';
import VirtualDrive from '@/node-win/virtual-drive';
import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as hasToBeMoved from './has-to-be-moved';
import { rename } from 'fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('fs/promises'));

describe('update-file-placeholder', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const relativePathToAbsoluteConverter = mockDeep<RelativePathToAbsoluteConverter>();
  const service = new FilePlaceholderUpdater(virtualDrive, relativePathToAbsoluteConverter);

  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const hasToBeMovedMock = partialSpyOn(hasToBeMoved, 'hasToBeMoved');
  const renameMock = vi.mocked(rename);

  let props: Parameters<typeof service.update>[0];

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });
    relativePathToAbsoluteConverter.run.mockReturnValue('remotePath' as AbsolutePath);

    props = mockProps<typeof service.update>({
      files: { ['uuid' as FileUuid]: 'localPath' as AbsolutePath },
      remote: {
        path: createRelativePath('file1', 'file2'),
        uuid: 'uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        placeholderId: 'FILE:uuid',
        size: 1024,
      },
    });
  });

  it('should do nothing if name is invalid', async () => {
    // Given
    validateWindowsNameMock.mockReturnValue({ isValid: false });
    // When
    await service.update(props);
    // Then
    expect(relativePathToAbsoluteConverter.run).toBeCalledTimes(0);
  });

  it('should create placeholder if file does not exist locally', async () => {
    // Given
    props.files = {};
    // When
    await service.update(props);
    // Then
    expect(hasToBeMovedMock).toBeCalledTimes(0);
    expect(virtualDrive.createFileByPath).toBeCalledTimes(1);
    expect(virtualDrive.createFileByPath).toBeCalledWith({
      relativePath: '/file1/file2',
      itemId: 'FILE:uuid',
      size: 1024,
      creationTime: props.remote.createdAt.getTime(),
      lastWriteTime: props.remote.updatedAt.getTime(),
    });
  });

  it('should move placeholder if it has been moved', async () => {
    // Given
    hasToBeMovedMock.mockReturnValue(true);
    // When
    await service.update(props);
    // Then
    expect(virtualDrive.createFileByPath).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(1);
    expect(renameMock).toBeCalledWith('localPath', 'remotePath');
  });

  it('should do nothing if not moved', async () => {
    // Given
    hasToBeMovedMock.mockReturnValue(false);
    // When
    await service.update(props);
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
    await service.update(props);
    // Then
    expect(relativePathToAbsoluteConverter.run).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
