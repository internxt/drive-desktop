import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getParentUuid } from './get-parent-uuid';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('get-parent-uuid', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const path = abs('/drive/folder1/folder2/file');
  const props = mockProps<typeof getParentUuid>({ path });

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    statMock.mockResolvedValue({ data: { size: 1024 } });
  });

  it('should skip if no parentUuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({});
    // When
    const res = await getParentUuid(props);
    // Then
    expect(getFolderInfoMock).toBeCalledWith(expect.objectContaining({ path: '/drive/folder1/folder2' }));
    expect(res).toBeNull();
  });

  it('should skip if no stats', async () => {
    // Given
    statMock.mockResolvedValue({});
    // When
    const res = await getParentUuid(props);
    // Then
    expect(statMock).toBeCalledWith(expect.objectContaining({ absolutePath: '/drive/folder1/folder2' }));
    expect(res).toBeNull();
  });

  it('should return parentUuid', async () => {
    // When
    const res = await getParentUuid(props);
    // Then
    expect(res).toStrictEqual('parentUuid');
  });
});
