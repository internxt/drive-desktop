import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';
import { FolderCreator } from './FolderCreator';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { v4 } from 'uuid';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid as TFolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { initializeVirtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('Folder Creator', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  initializeVirtualDrive(virtualDrive);

  const persistMock = partialSpyOn(HttpRemoteFolderSystem, 'persist');
  const getFolderUuid = deepMocked(NodeWin.getFolderUuid);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = createRelativePath('folder1', 'folder2');
  const props = mockProps<typeof FolderCreator.run>({ path });

  beforeEach(() => {
    invokeMock.mockResolvedValue({});
  });

  it('If placeholderId is not found, throw error', async () => {
    // Given
    getFolderUuid.mockReturnValueOnce({ error: new Error() });

    // When
    const promise = FolderCreator.run(props);

    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
  });

  it('If placeholder id is found, create folder', async () => {
    // Given
    const folder = FolderMother.fromPartial({ parentId: 1, parentUuid: v4(), path });
    persistMock.mockResolvedValueOnce(folder.attributes() as any);
    getFolderUuid.mockReturnValueOnce({ data: folder.parentUuid as TFolderUuid });

    // When
    await FolderCreator.run(props);

    // Then
    expect(persistMock).toBeCalledWith({
      parentUuid: folder.parentUuid,
      plainName: 'folder2',
      path: folder.path,
    });

    expect(invokeMock).toBeCalledWith('folderCreateOrUpdate', {
      folder: {
        ...folder.attributes(),
        userUuid: '',
        workspaceId: '',
      },
    });

    expect(virtualDrive.convertToPlaceholder).toBeCalledWith({
      itemPath: folder.path,
      id: folder.placeholderId,
    });
  });
});
