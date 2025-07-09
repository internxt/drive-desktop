import * as auth from '@/apps/main/auth/service';
import { repository } from '../drive-folder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUuid } from './get-by-uuid';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

describe('get-by-uuid', () => {
  const getUserOrThrowSpy = partialSpyOn(auth, 'getUserOrThrow');
  const findOneSpy = partialSpyOn(repository, 'findOne');
  const decryptNameSpy = vi.spyOn(Folder, 'decryptName');

  const props = mockProps<typeof getByUuid>({});

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowSpy.mockResolvedValue({ uuid: 'uuid' });
    decryptNameSpy.mockImplementation(({ name }) => name);
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
