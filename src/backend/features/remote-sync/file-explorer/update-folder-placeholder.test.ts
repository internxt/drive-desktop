import { mockDeep } from 'vitest-mock-extended';
import { FolderPlaceholderUpdater } from './update-folder-placeholder';
import VirtualDrive from '@/node-win/virtual-drive';
import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as validateWindowsName from '@/context/virtual-drive/items/validate-windows-name';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as hasToBeMoved from './has-to-be-moved';
import { rename } from 'fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('fs/promises'));

describe('update-folder-placeholder', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const relativePathToAbsoluteConverter = mockDeep<RelativePathToAbsoluteConverter>();
  const service = new FolderPlaceholderUpdater(virtualDrive, relativePathToAbsoluteConverter);

  const validateWindowsNameMock = partialSpyOn(validateWindowsName, 'validateWindowsName');
  const hasToBeMovedMock = partialSpyOn(hasToBeMoved, 'hasToBeMoved');
  const renameMock = vi.mocked(rename);

  let props: Parameters<typeof service.update>[0];

  beforeEach(() => {
    validateWindowsNameMock.mockReturnValue({ isValid: true });
    relativePathToAbsoluteConverter.run.mockReturnValue('remotePath' as AbsolutePath);

    props = mockProps<typeof service.update>({
      folders: { ['uuid' as FolderUuid]: 'localPath' as AbsolutePath },
      remote: {
        path: createRelativePath('folder1', 'folder2'),
        uuid: 'uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
        placeholderId: 'FOLDER:uuid',
      },
    });
  });

  it('should skip if path is root', async () => {
    // Given
    const props = mockProps<typeof service.run>({ remotes: [{ path: createRelativePath('/') }] });
    // When
    await service.run(props);
    // Then
    expect(relativePathToAbsoluteConverter.run).toBeCalledTimes(0);
  });

  it('should do nothing if name is invalid', async () => {
    // Given
    validateWindowsNameMock.mockReturnValue({ isValid: false });
    // When
    await service.update(props);
    // Then
    expect(relativePathToAbsoluteConverter.run).toBeCalledTimes(0);
  });

  it('should create placeholder if folder does not exist locally', async () => {
    // Given
    props.folders = {};
    // When
    await service.update(props);
    // Then
    expect(hasToBeMovedMock).toBeCalledTimes(0);
    expect(virtualDrive.createFolderByPath).toBeCalledTimes(1);
    expect(virtualDrive.createFolderByPath).toBeCalledWith({
      relativePath: '/folder1/folder2',
      itemId: 'FOLDER:uuid',
      size: 0,
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
    expect(virtualDrive.createFolderByPath).toBeCalledTimes(0);
    expect(renameMock).toBeCalledTimes(1);
    expect(renameMock).toBeCalledWith('localPath', 'remotePath');
  });

  it('should do nothing if not moved', async () => {
    // Given
    hasToBeMovedMock.mockReturnValue(false);
    // When
    await service.update(props);
    // Then
    expect(virtualDrive.createFolderByPath).toBeCalledTimes(0);
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
