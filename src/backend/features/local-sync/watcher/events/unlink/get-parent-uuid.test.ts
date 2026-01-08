import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getParentUuid } from './get-parent-uuid';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as sleep from '@/apps/main/util';

describe('get-parent-uuid', () => {
  partialSpyOn(sleep, 'sleep');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');

  const path = abs('/drive/folder1/folder2/file');
  const props = mockProps<typeof getParentUuid>({ path });

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
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

  it('should return parentUuid', async () => {
    // When
    const res = await getParentUuid(props);
    // Then
    expect(res).toStrictEqual('parentUuid');
  });
});
