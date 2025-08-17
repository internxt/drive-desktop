import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUuids } from './get-by-uuids';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { folderRepository } from '../drive-folder';

describe('get-by-uuids', () => {
  const findBy = partialSpyOn(folderRepository, 'findBy');
  partialSpyOn(Folder, 'decryptName');

  const props = mockProps<typeof getByUuids>({ uuids: [] });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folders', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getByUuids(props);
    // Then
    expect(data).toBeDefined();
    expect(findBy).toBeCalledWith({
      parentUuid: 'uuid',
      status: 'EXISTS',
    });
  });
});
