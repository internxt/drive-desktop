import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByParentUuid } from './get-by-parent-uuid';
import * as folderDecryptName from '@/context/virtual-drive/folders/domain/folder-decrypt-name';
import { folderRepository } from '../drive-folder';

describe('get-by-parent-uuid', () => {
  const findBy = partialSpyOn(folderRepository, 'findBy');
  partialSpyOn(folderDecryptName, 'folderDecryptName');

  const props = mockProps<typeof getByParentUuid>({ parentUuid: 'uuid' });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByParentUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folders', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getByParentUuid(props);
    // Then
    expect(data).toBeDefined();
    expect(findBy).toBeCalledWith({
      parentUuid: 'uuid',
      status: 'EXISTS',
    });
  });
});
