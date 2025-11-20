import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { call, mockProps } from 'tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderCreator } from './FolderCreator';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

describe('Folder Creator', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = abs('/parent/folder');
  const props = mockProps<typeof FolderCreator.run>({
    ctx: { virtualDrive, workspaceId: '', userUuid: '' },
    path,
  });

  beforeEach(() => {
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
  });

  it('If placeholderId is not found, throw error', async () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ error: new Error() });
    // When
    const promise = FolderCreator.run(props);
    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
  });

  it('If placeholder id is found, create folder', async () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'parentUuid' as FolderUuid } });
    // When
    await FolderCreator.run(props);
    // Then
    call(invokeMock).toMatchObject(['createFolder', { path }]);
    call(virtualDrive.convertToPlaceholder).toStrictEqual({ path, placeholderId: 'FOLDER:uuid' });
  });
});
