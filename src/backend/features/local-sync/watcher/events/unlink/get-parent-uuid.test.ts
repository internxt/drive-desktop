import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getParentUuid } from './get-parent-uuid';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('get-parent-uuid', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const absolutePath = 'C:\\Users\\user\\InternxtDrive\\folder1\\folder2\\file' as AbsolutePath;
  const props = mockProps<typeof getParentUuid>({ absolutePath });

  beforeEach(() => {
    getFolderUuidMock.mockReturnValue({ data: 'parentUuid' as FolderUuid });
    statMock.mockResolvedValue({ data: { size: 1024 } });
  });

  it('should skip if no parentUuid', async () => {
    // Given
    getFolderUuidMock.mockReturnValue({});
    // When
    const res = await getParentUuid(props);
    // Then
    expect(getFolderUuidMock).toBeCalledWith(expect.objectContaining({ path: 'C:\\Users\\user\\InternxtDrive\\folder1\\folder2' }));
    expect(res).toBeNull();
  });

  it('should skip if no stats', async () => {
    // Given
    statMock.mockResolvedValue({});
    // When
    const res = await getParentUuid(props);
    // Then
    expect(statMock).toBeCalledWith(expect.objectContaining({ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1\\folder2' }));
    expect(res).toBeNull();
  });

  it('should return parentUuid', async () => {
    // When
    const res = await getParentUuid(props);
    // Then
    expect(res).toStrictEqual('parentUuid');
  });
});
