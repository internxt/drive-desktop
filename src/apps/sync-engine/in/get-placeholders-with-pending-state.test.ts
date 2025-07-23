import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'fs/promises';
import { getPlaceholdersWithPendingState } from './get-placeholders-with-pending-state';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileIdentityError } from '@/infra/node-win/services/item-identity/get-file-identity';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { fileSystem } from '@/infra/file-system/file-system.module';

vi.mock(import('fs/promises'));

describe('get-placeholders-with-pending-state', () => {
  const readdirMock = deepMocked(readdir);
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
  const statMock = partialSpyOn(fileSystem, 'stat');

  type MockReaddirReturn = ReturnType<typeof readdir> extends Promise<infer T> ? T : never;

  const props = mockProps<typeof getPlaceholdersWithPendingState>({ path: 'C:\\Users\\user\\InternxtDrive' });

  it('should return files that are not uploaded', async () => {
    getFileUuidMock.mockReturnValueOnce({ data: 'uuid' as FileUuid });
    getFileUuidMock.mockReturnValueOnce({ error: new GetFileIdentityError('NON_EXISTS') });
    readdirMock.mockResolvedValueOnce(['file1', 'folder1'] as unknown as MockReaddirReturn);
    readdirMock.mockResolvedValueOnce(['file2'] as unknown as MockReaddirReturn);
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });

    // When
    const pendingPages = await getPlaceholdersWithPendingState(props);

    // Then
    expect(pendingPages).toStrictEqual([
      expect.objectContaining({
        absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1\\file2',
      }),
    ]);
  });
});
