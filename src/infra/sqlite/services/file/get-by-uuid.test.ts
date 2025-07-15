import * as fileDecryptName from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { fileRepository } from '../drive-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getByUuid } from './get-by-uuid';

describe('get-by-uuid', () => {
  const findOneSpy = partialSpyOn(fileRepository, 'findOne');
  const fileDecryptNameSpy = vi.spyOn(fileDecryptName, 'fileDecryptName');

  const props = mockProps<typeof getByUuid>({});

  beforeEach(() => {
    vi.clearAllMocks();

    fileDecryptNameSpy.mockImplementation(({ encryptedName }) => ({
      name: encryptedName,
      nameWithExtension: encryptedName,
    }));
  });

  it('should return NOT_FOUND when file is not found', async () => {
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

  it('should return file', async () => {
    // Given
    findOneSpy.mockResolvedValue({ name: 'name' });
    // When
    const { data } = await getByUuid(props);
    // Then
    expect(data).toBeDefined();
  });
});
