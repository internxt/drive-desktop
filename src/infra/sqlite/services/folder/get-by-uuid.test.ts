import * as auth from '@/apps/main/auth/service';
import { folderRepository } from '../drive-folder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUuid } from './get-by-uuid';
import * as folderDecryptName from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

describe('get-by-uuid', () => {
  const getUserOrThrowSpy = partialSpyOn(auth, 'getUserOrThrow');
  const findOneSpy = partialSpyOn(folderRepository, 'findOne');
  partialSpyOn(folderDecryptName, 'folderDecryptName');

  const props = mockProps<typeof getByUuid>({});

  beforeEach(() => {
    getUserOrThrowSpy.mockResolvedValue({ uuid: 'uuid' });
  });

  it('should return NOT_FOUND when folder is not found', async () => {
    // Given
    findOneSpy.mockResolvedValue(null);
    // When
    const { error } = await getByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findOneSpy.mockRejectedValue(new Error());
    // When
    const { error } = await getByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folder', async () => {
    // Given
    findOneSpy.mockResolvedValue({ name: 'name' });
    // When
    const { data } = await getByUuid(props);
    // Then
    expect(data).toBeDefined();
  });
});
