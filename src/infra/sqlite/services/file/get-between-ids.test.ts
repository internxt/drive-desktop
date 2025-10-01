import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getBetweenIds } from './get-between-ids';
import { Between } from 'typeorm';

describe('get-between-ids', () => {
  const findMock = partialSpyOn(fileRepository, 'find');
  const fileDecryptNameMock = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getBetweenIds>({
    workspaceId: 'workspaceId',
    firstId: 1,
    lastId: 10,
  });

  beforeEach(() => {
    fileDecryptNameMock.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findMock.mockRejectedValue(new Error());
    // When
    const { error } = await getBetweenIds(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findMock.mockResolvedValue([]);
    // When
    const { data } = await getBetweenIds(props);
    // Then
    expect(data).toBeDefined();
    call(findMock).toMatchObject({
      order: { id: 'ASC' },
      where: {
        workspaceId: 'workspaceId',
        status: 'EXISTS',
        id: Between(1, 10),
      },
    });
  });
});
