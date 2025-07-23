import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getParentUuid } from './get-parent-uuid';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-parent-uuid', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const path = createRelativePath('folder1', 'folder2', 'file');
  const props = mockProps<typeof getParentUuid>({ path });

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
    expect(getFolderUuidMock).toBeCalledWith(expect.objectContaining({ path: '/folder1/folder2' }));
    expect(res).toBeUndefined();
  });

  it('should skip if no stats', async () => {
    // Given
    statMock.mockResolvedValue({});
    // When
    const res = await getParentUuid(props);
    // Then
    expect(statMock).toBeCalledWith(expect.objectContaining({ absolutePath: '/folder1/folder2' }));
    expect(res).toBeUndefined();
  });

  it('should return parentUuid', async () => {
    // When
    const res = await getParentUuid(props);
    // Then
    expect(res).toStrictEqual('parentUuid');
  });
});
