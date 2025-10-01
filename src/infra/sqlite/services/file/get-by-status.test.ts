import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByStatus } from './get-by-status';

describe('get-by-status', () => {
  const findMock = partialSpyOn(fileRepository, 'find');
  const fileDecryptNameMock = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getByStatus>({ workspaceId: 'workspaceId', status: 'EXISTS' });

  beforeEach(() => {
    fileDecryptNameMock.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findMock.mockRejectedValue(new Error());
    // When
    const { error } = await getByStatus(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
    // Given
    findMock.mockResolvedValue([]);
    // When
    const { data } = await getByStatus(props);
    // Then
    expect(data).toBeDefined();
    call(findMock).toMatchObject({
      where: { workspaceId: 'workspaceId', status: 'EXISTS' },
      order: { updatedAt: 'ASC' },
    });
  });
});
