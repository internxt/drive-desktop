import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderCreator } from './FolderCreator';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import * as updateFolderStatus from '@/backend/features/local-sync/placeholders/update-folder-status';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('Folder Creator', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const getFolderUuid = deepMocked(NodeWin.getFolderUuid);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const persistMock = partialSpyOn(HttpRemoteFolderSystem, 'persist');
  const updateFolderStatusMock = partialSpyOn(updateFolderStatus, 'updateFolderStatus');

  const path = createRelativePath('folder1', 'folder2');
  const props = mockProps<typeof FolderCreator.run>({
    ctx: { virtualDrive, workspaceId: '', userUuid: '' },
    path,
  });

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
    persistMock.mockResolvedValueOnce({ uuid: 'uuid' });
    getFolderUuid.mockReturnValueOnce({ data: 'parentUuid' as FolderUuid });

    // When
    await FolderCreator.run(props);

    // Then
    expect(persistMock).toBeCalledWith(
      expect.objectContaining({
        parentUuid: 'parentUuid',
        plainName: 'folder2',
        path: '/folder1/folder2',
      }),
    );

    expect(invokeMock).toBeCalledWith('folderCreateOrUpdate', {
      folder: {
        uuid: 'uuid',
        userUuid: '',
        workspaceId: '',
      },
    });

    expect(virtualDrive.convertToPlaceholder).toBeCalledWith({
      itemPath: '/folder1/folder2',
      id: 'FOLDER:uuid',
    });
    expect(updateFolderStatusMock).toBeCalledTimes(1);
  });
});
