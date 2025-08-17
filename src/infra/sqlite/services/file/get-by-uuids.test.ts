import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUuids } from './get-by-uuids';

describe('get-by-uuids', () => {
  const findBy = partialSpyOn(fileRepository, 'findBy');
  const fileDecryptNameSpy = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getByUuids>({ uuids: [] });

  beforeEach(() => {
    fileDecryptNameSpy.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getByUuids(props);
    // Then
    expect(data).toBeDefined();
    expect(findBy).toBeCalledWith({
      folderUuid: 'uuid',
      status: 'EXISTS',
    });
  });
});
