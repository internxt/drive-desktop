import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByWorkspaceId } from './get-by-workspace-id';

describe('get-by-workspace-id', () => {
  const findBy = partialSpyOn(fileRepository, 'findBy');
  const fileDecryptNameSpy = partialSpyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getByWorkspaceId>({
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
  });

  beforeEach(() => {
    fileDecryptNameSpy.mockResolvedValue({});
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findBy.mockRejectedValue(new Error());
    // When
    const { error } = await getByWorkspaceId(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return files', async () => {
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
