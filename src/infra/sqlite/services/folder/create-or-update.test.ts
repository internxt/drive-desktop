import { folderRepository } from '../drive-folder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

describe('create-or-update', () => {
  const saveMock = partialSpyOn(folderRepository, 'save');
  const decryptNameSpy = partialSpyOn(Folder, 'decryptName');

  const props = mockProps<typeof createOrUpdate>({});

  beforeEach(() => {
    decryptNameSpy.mockImplementation(({ name }) => name);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    saveMock.mockRejectedValue(new Error());
    // When
    const { error } = await createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return folder', async () => {
    // Given
    saveMock.mockResolvedValue({});
    // When
    const { data } = await createOrUpdate(props);
    // Then
    expect(data).toBeDefined();
  });
});
