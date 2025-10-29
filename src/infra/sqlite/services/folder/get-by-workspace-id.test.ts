import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByWorkspaceId } from './get-by-workspace-id';
import { folderRepository } from '../drive-folder';
import * as folderDecryptName from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

describe('get-by-workspace-id', () => {
  const findBy = partialSpyOn(folderRepository, 'findBy');
  partialSpyOn(folderDecryptName, 'folderDecryptName');

  const props = mockProps<typeof getByWorkspaceId>({
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByWorkspaceId(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folders', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toBeDefined();
    expect(findBy).toBeCalledWith({
      userUuid: 'userUuid',
      workspaceId: 'uuid',
    });
  });
});
