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
import { initializeVirtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('Folder Creator', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  initializeVirtualDrive(virtualDrive);

  const getFolderUuid = deepMocked(NodeWin.getFolderUuid);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = createRelativePath('folder1', 'folder2');
  const props = mockProps<typeof FolderCreator.run>({ path });

  beforeEach(() => {
    getFolderUuid.mockReturnValue({ data: 'parentUuid' as FolderUuid });
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderUuid.mockReturnValueOnce({ error: new Error() });
    // When
    const promise = FolderCreator.run(props);
    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
  });

  it('create file if placeholder id is found', async () => {
    // When
    await FolderCreator.run(props);
    // Then
    expect(invokeMock).toBeCalledTimes(1);
    expect(virtualDrive.convertToPlaceholder).toBeCalledWith({
      itemPath: path,
      id: 'FOLDER:uuid',
    });
  });
});
