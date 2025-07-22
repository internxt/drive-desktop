import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'fs/promises';
import { getPlaceholdersWithPendingState } from './get-placeholders-with-pending-state';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileIdentityError } from '@/infra/node-win/services/item-identity/get-file-identity';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('fs/promises'));
vi.mock(import('@/infra/node-win/node-win.module'));

describe('get-placeholders-with-pending-state', () => {
  const readdirMock = deepMocked(readdir);
  const getFileUuidMock = vi.mocked(NodeWin.getFileUuid);

  const props = mockProps<typeof getPlaceholdersWithPendingState>({ path: 'C:\\Users\\user\\InternxtDrive' });

  it('should return files that are not uploaded', async () => {
    getFileUuidMock.mockReturnValueOnce({ data: 'uuid' as FileUuid });
    getFileUuidMock.mockReturnValueOnce({ error: new GetFileIdentityError('NON_EXISTS') });
    readdirMock.mockResolvedValueOnce([
      { name: 'file1' as unknown as Buffer, isDirectory: () => false, isFile: () => true },
      { name: 'folder1' as unknown as Buffer, isDirectory: () => true, isFile: () => false },
    ]);
    readdirMock.mockResolvedValueOnce([{ name: 'file2' as unknown as Buffer, isDirectory: () => false, isFile: () => true }]);

    // When
    const pendingPages = await getPlaceholdersWithPendingState(props);

    // Then
    expect(pendingPages).toEqual(['C:\\Users\\user\\InternxtDrive\\folder1\\file2']);
  });
});
