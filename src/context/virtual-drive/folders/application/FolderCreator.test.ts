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
import * as updateFolderStatus from '@/backend/features/local-sync/placeholders/update-folder-status';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('Folder Creator', () => {
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const virtualDrive = mockDeep<VirtualDrive>();
  const getFolderUuid = deepMocked(NodeWin.getFolderUuid);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const updateFolderStatusMock = partialSpyOn(updateFolderStatus, 'updateFolderStatus');

  const SUT = new FolderCreator(remote, virtualDrive);

  const path = createRelativePath('folder1', 'folder2');
  const props = mockProps<typeof SUT.run>({ path });

  beforeEach(() => {
    invokeMock.mockResolvedValue({});
  });

  it('If placeholderId is not found, throw error', async () => {
    // Given
    getFolderUuid.mockReturnValueOnce({ error: new Error() });

    // When
    const promise = SUT.run(props);

    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
  });

  it('If placeholder id is found, create folder', async () => {
    // Given
    const folder = FolderMother.fromPartial({ parentId: 1, parentUuid: v4(), path });
    remote.persist.mockResolvedValueOnce(folder.attributes() as any);
    getFolderUuid.mockReturnValueOnce({ data: folder.parentUuid as TFolderUuid });

    // When
    await SUT.run(props);

    // Then
    expect(remote.persist).toBeCalledWith({
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
    expect(updateFolderStatusMock).toBeCalledTimes(1);
  });
});
