import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUpdatedAt } from './get-by-updated-at';
import { Between } from 'typeorm';

describe('get-by-updated-at', () => {
  const findBy = partialSpyOn(fileRepository, 'findBy');
  const fileDecryptNameSpy = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getByUpdatedAt>({
    workspaceId: 'workspaceId',
    from: 'from',
    to: 'to',
  });

  beforeEach(() => {
    fileDecryptNameSpy.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByUpdatedAt(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findBy.mockResolvedValue([]);
    // When
    const { data } = await getByUpdatedAt(props);
    // Then
    expect(data).toBeDefined();
    call(findBy).toMatchObject({
      workspaceId: 'workspaceId',
      updatedAt: Between('from', 'to'),
    });
  });
});
