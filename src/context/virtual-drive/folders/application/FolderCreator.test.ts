import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FolderId } from '@/context/virtual-drive/folders/domain/FolderId';
import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderUuid';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import VirtualDrive from '@/node-win/virtual-drive';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';
import { FolderCreator } from './FolderCreator';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { v4 } from 'uuid';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid as TFolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('Folder Creator', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const virtualDrive = mockDeep<VirtualDrive>();
  const getFolderUuid = deepMocked(NodeWin.getFolderUuid);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const SUT = new FolderCreator(repository, remote, virtualDrive);

  const path = createRelativePath('folder1', 'folder2');
  const props = { path };

  beforeEach(() => {
    vi.resetAllMocks();
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
    await SUT.run({ path });

    // Then
    expect(remote.persist).toBeCalledWith({
      parentUuid: folder.parentUuid,
      basename: 'folder2',
      path: folder.path,
    });

    expect(repository.add).toBeCalledWith(
      expect.objectContaining({
        _id: new FolderId(folder.id),
        _parentId: new FolderId(folder.parentId ?? 0),
        _parentUuid: new FolderUuid(folder.parentUuid ?? ''),
        _path: new FolderPath(folder.path),
        _uuid: new FolderUuid(folder.uuid),
      }),
    );

    expect(virtualDrive.convertToPlaceholder).toBeCalledWith({
      itemPath: folder.path,
      id: folder.placeholderId,
    });
  });
});
